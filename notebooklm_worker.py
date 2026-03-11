"""
notebooklm_worker.py
====================
Run this script LOCALLY (or on any server with notebooklm-py installed).
It polls your Supabase DB for pending posts and:
  1. Downloads Drive attachments via Google API
  2. Creates a NotebookLM notebook
  3. Uploads files as sources
  4. Generates a Video Overview
  5. Uploads the video to Supabase Storage
  6. Updates post/video status in the DB

SETUP:
  pip install "notebooklm-py[browser]" supabase google-api-python-client google-auth-oauthlib
  playwright install chromium
  notebooklm login    # one-time browser auth

THEN set these env vars (or create a .env file):
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_KEY=your-service-role-key
  GOOGLE_TOKEN_JSON={"access_token":"...","refresh_token":"..."}  # from user session

Run:
  python notebooklm_worker.py
"""

import asyncio
import os
import json
import tempfile
from datetime import datetime
from pathlib import Path

from supabase import create_client, Client
from notebooklm import NotebookLMClient, VideoStyle, VideoFormat, RPCError

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
POLL_INTERVAL = 60  # seconds between DB polls
VIDEO_STYLE = VideoStyle.WHITEBOARD
VIDEO_FORMAT = VideoFormat.EXPLAINER


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_google_drive_client(access_token: str):
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
    creds = Credentials(token=access_token)
    return build("drive", "v3", credentials=creds)


def download_drive_file(drive, file_id: str, filename: str, dest_dir: str) -> str | None:
    from googleapiclient.http import MediaIoBaseDownload
    import io
    try:
        meta = drive.files().get(fileId=file_id, fields="mimeType").execute()
        mime = meta.get("mimeType", "")
        export_map = {
            "application/vnd.google-apps.document": ("application/pdf", ".pdf"),
            "application/vnd.google-apps.presentation": ("application/pdf", ".pdf"),
        }
        safe = "".join(c for c in filename if c.isalnum() or c in " ._-")[:50]
        if mime in export_map:
            exp_mime, ext = export_map[mime]
            req = drive.files().export_media(fileId=file_id, mimeType=exp_mime)
            path = os.path.join(dest_dir, safe + ext)
        else:
            req = drive.files().get_media(fileId=file_id)
            path = os.path.join(dest_dir, safe)

        with open(path, "wb") as fh:
            dl = MediaIoBaseDownload(fh, req)
            done = False
            while not done:
                _, done = dl.next_chunk()
        return path
    except Exception as e:
        print(f"  ⚠ Drive download failed: {e}")
        return None


async def process_post(sb: Client, post: dict):
    post_id = post["id"]
    course_id = post["course_id"]
    user_id = post["user_id"]
    title = post["title"]

    print(f"\n📋 Processing: {title[:60]}")

    # Mark as processing
    sb.table("posts").update({"status": "processing"}).eq("id", post_id).execute()

    # Get user's Google access token from Supabase auth
    try:
        identity = sb.auth.admin.list_users()
        # In production, fetch from your tokens table or session
        # For now, expects GOOGLE_ACCESS_TOKEN env var
        access_token = os.environ.get("GOOGLE_ACCESS_TOKEN", "")
    except Exception:
        access_token = os.environ.get("GOOGLE_ACCESS_TOKEN", "")

    # Parse attachments (stored in post metadata or re-fetch from Classroom)
    # Here we expect attachments as JSON in post["attachments"] column
    attachments = json.loads(post.get("attachments") or "[]")

    downloaded_files = []
    url_sources = []

    with tempfile.TemporaryDirectory() as tmpdir:
        if access_token and attachments:
            drive = get_google_drive_client(access_token)
            for att in attachments:
                if att.get("type") == "drive" and att.get("id"):
                    fp = download_drive_file(drive, att["id"], att.get("name", "file"), tmpdir)
                    if fp:
                        downloaded_files.append(fp)
                elif att.get("url"):
                    url_sources.append(att["url"])

        if not downloaded_files and not url_sources:
            print("  ⚠ No sources — skipping notebook creation")
            sb.table("posts").update({"status": "error", "error_message": "No downloadable attachments"}).eq("id", post_id).execute()
            return

        # ── NotebookLM ────────────────────────────────────────
        try:
            async with await NotebookLMClient.from_storage() as client:
                # Create notebook
                nb_name = f"[Auto] {title[:70]}"
                nb = await client.notebooks.create(nb_name)
                print(f"  📒 Notebook created: {nb.id}")

                # Upload sources
                for fp in downloaded_files:
                    try:
                        await client.sources.add_file(nb.id, fp, wait=True)
                        print(f"  📤 Uploaded: {Path(fp).name}")
                        await asyncio.sleep(2)
                    except RPCError as e:
                        print(f"  ⚠ Upload failed: {e}")

                for url in url_sources:
                    try:
                        await client.sources.add_url(nb.id, url, wait=True)
                        print(f"  🔗 URL added: {url[:50]}")
                        await asyncio.sleep(2)
                    except RPCError as e:
                        print(f"  ⚠ URL failed: {e}")

                # Generate video
                print("  🎬 Generating video (5–15 min)…")
                status = await client.artifacts.generate_video(
                    nb.id,
                    video_format=VIDEO_FORMAT,
                    video_style=VIDEO_STYLE,
                )
                await client.artifacts.wait_for_completion(nb.id, status.task_id)
                print("  ✅ Video generated!")

                # Download video locally then upload to Supabase Storage
                video_filename = f"{post_id}_overview.mp4"
                local_video = os.path.join(tmpdir, video_filename)
                await client.artifacts.download_video(nb.id, local_video)

                # Upload to Supabase Storage: classroom-videos/{user_id}/{course_id}/file.mp4
                storage_path = f"{user_id}/{course_id}/{video_filename}"
                with open(local_video, "rb") as vf:
                    sb.storage.from_("classroom-videos").upload(
                        path=storage_path,
                        file=vf,
                        file_options={"content-type": "video/mp4", "upsert": "true"},
                    )

                public_url = sb.storage.from_("classroom-videos").get_public_url(storage_path)
                print(f"  💾 Uploaded to Supabase: {storage_path}")

                # Save video record
                sb.table("videos").insert({
                    "post_id": post_id,
                    "course_id": course_id,
                    "user_id": user_id,
                    "title": title,
                    "video_style": VIDEO_STYLE.name,
                    "storage_path": storage_path,
                    "public_url": public_url,
                    "status": "ready",
                }).execute()

                # Mark post as done
                sb.table("posts").update({
                    "status": "done",
                    "notebook_id": nb.id,
                    "notebook_name": nb_name,
                    "processed_at": datetime.utcnow().isoformat(),
                }).eq("id", post_id).execute()

                print(f"  🎉 Done! Post {post_id} complete.")

        except Exception as e:
            print(f"  ❌ Error processing {post_id}: {e}")
            sb.table("posts").update({
                "status": "error",
                "error_message": str(e)[:500],
            }).eq("id", post_id).execute()


async def main():
    print("╔══════════════════════════════════════════════╗")
    print("║  Slide2Learn Worker  🔄                    ║")
    print("╚══════════════════════════════════════════════╝")
    print(f"Polling every {POLL_INTERVAL}s for pending posts…\n")

    sb = get_supabase()

    while True:
        try:
            result = sb.table("posts") \
                .select("*") \
                .eq("status", "pending") \
                .order("created_at") \
                .limit(3) \
                .execute()

            pending = result.data or []
            if pending:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] {len(pending)} pending post(s) found")
                for post in pending:
                    await process_post(sb, post)
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] No pending posts. Waiting…")

        except KeyboardInterrupt:
            print("\n👋 Worker stopped.")
            break
        except Exception as e:
            print(f"⚠ Worker error: {e}")

        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
