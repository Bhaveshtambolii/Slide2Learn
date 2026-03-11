# Slide2Learn

> **"Convert boring PPTs into AI video explanations."**

Slide2Learn automatically syncs your Google Classroom slides and attachments to NotebookLM, generates AI video explanations for each one, and organises everything class by class in Supabase Storage.

---

## The Problem It Solves

You get a lecture slide deck. It's 60 slides. You don't have time to sit through a recording.  
**Slide2Learn converts it into a clear AI video explanation automatically — the moment your teacher uploads it.**

## Taglines
- *"Convert boring PPTs into AI video explanations."*
- *"Understand lectures in minutes, not slides."*
- *"From Classroom slides to AI video summaries."*
- *"Make classroom content actually understandable."*

---

## Architecture

```
Google Classroom API  →  Next.js on Vercel  →  Supabase (Auth + DB + Storage)
                                ↓
                       notebooklm_worker.py (local/server)
                                ↓
                       NotebookLM → AI Video Overview (MP4)
```

## Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 15 (App Router) on Vercel |
| Auth | Supabase Auth + Google OAuth (with Classroom scopes) |
| Database | Supabase Postgres |
| Storage | Supabase Storage (videos by class) |
| Classroom | Google Classroom API (read-only) |
| AI Videos | notebooklm-py → Google NotebookLM |

---

## Setup Guide

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) → Create new project
2. **SQL Editor** → run `supabase-schema.sql`
3. **Authentication → Providers → Google** → enable and add scopes:
   ```
   https://www.googleapis.com/auth/classroom.announcements.readonly
   https://www.googleapis.com/auth/classroom.coursework.me.readonly
   https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly
   https://www.googleapis.com/auth/classroom.courses.readonly
   https://www.googleapis.com/auth/drive.readonly
   ```
4. **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 2. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable: **Google Classroom API** + **Google Drive API**
3. Create OAuth 2.0 Client ID (Web application)
4. Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID + Secret → paste into Supabase Google provider

### 3. Deploy to Vercel

```bash
npm install
npx vercel deploy
```

Set environment variables in Vercel dashboard:

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |

### 4. Run the AI Video Worker

The worker watches Supabase for new `pending` posts and processes them through NotebookLM:

```bash
pip install "notebooklm-py[browser]" supabase google-api-python-client google-auth-oauthlib
playwright install chromium

notebooklm login   # one-time browser login

export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-role-key
export GOOGLE_ACCESS_TOKEN=your-token

python notebooklm_worker.py
```

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your Supabase credentials

npm install
npm run dev
# → http://localhost:3000
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `courses` | Google Classroom courses per user |
| `posts` | Announcements / assignments / materials with processing status |
| `videos` | Generated AI videos with Supabase Storage URLs |

## Storage Structure

```
classroom-videos/
  {user_id}/
    {course_id}/
      {post_id}_overview.mp4
```

---

## Contributing

PRs welcome! This project is open source under MIT.
