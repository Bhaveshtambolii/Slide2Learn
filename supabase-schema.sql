-- ============================================================
-- SUPABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Courses table: stores each Google Classroom course per user
CREATE TABLE IF NOT EXISTS courses (
  id           TEXT PRIMARY KEY,          -- Google Classroom course ID
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  section      TEXT,
  description  TEXT,
  color        TEXT DEFAULT '#4A90D9',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id, user_id)
);

-- Posts table: announcements / assignments / materials
CREATE TABLE IF NOT EXISTS posts (
  id              TEXT PRIMARY KEY,        -- e.g. "announcement_12345"
  course_id       TEXT REFERENCES courses(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  post_type       TEXT NOT NULL,           -- 'Announcement' | 'Assignment' | 'Material'
  created_time    TIMESTAMPTZ,
  attachment_count INT DEFAULT 0,
  status          TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'done' | 'error'
  notebook_id     TEXT,                    -- NotebookLM notebook ID
  notebook_name   TEXT,
  error_message   TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table: generated videos stored per post
CREATE TABLE IF NOT EXISTS videos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      TEXT REFERENCES posts(id) ON DELETE CASCADE,
  course_id    TEXT REFERENCES courses(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  video_style  TEXT DEFAULT 'WHITEBOARD',
  storage_path TEXT,                       -- path in Supabase Storage
  public_url   TEXT,                       -- public URL of the video
  duration_sec INT,
  file_size_mb FLOAT,
  status       TEXT DEFAULT 'generating',  -- 'generating' | 'ready' | 'error'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos  ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users see own courses" ON courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own posts"   ON posts   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own videos"  ON videos  FOR ALL USING (auth.uid() = user_id);

-- ── Storage bucket for videos ───────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('classroom-videos', 'classroom-videos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload their own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'classroom-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Videos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'classroom-videos');

-- ── Add new columns for course management ───────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS custom_name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived     BOOLEAN DEFAULT FALSE;
