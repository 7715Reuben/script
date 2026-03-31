-- ============================================================
-- Script — Supabase migrations
-- Run this in the Supabase SQL editor (project > SQL editor)
-- Safe to run multiple times — all statements use IF NOT EXISTS
-- ============================================================


-- ── Profiles table additions ─────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS portrait_public  boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS portrait_tags    text[],
  ADD COLUMN IF NOT EXISTS premium          boolean   DEFAULT true,
  ADD COLUMN IF NOT EXISTS name             text;


-- ── Conversations ────────────────────────────────────────────
-- Stores the AI conversation history per user

CREATE TABLE IF NOT EXISTS conversations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations (user_id, created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own conversations" ON conversations;
CREATE POLICY "Users manage own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── Portrait versions ────────────────────────────────────────
-- Snapshot of the portrait before each portrait session addition

CREATE TABLE IF NOT EXISTS portrait_versions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portrait_versions_user_id_idx ON portrait_versions (user_id, created_at DESC);

ALTER TABLE portrait_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own portrait versions" ON portrait_versions;
CREATE POLICY "Users manage own portrait versions"
  ON portrait_versions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── Identity challenges ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS identity_challenges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  duration    integer     NOT NULL CHECK (duration IN (7, 21)),
  days        jsonb       NOT NULL,  -- [{ day: number, action: string }]
  started_at  date        NOT NULL,
  reflection  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS identity_challenges_user_id_idx ON identity_challenges (user_id, created_at DESC);

ALTER TABLE identity_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own challenges" ON identity_challenges;
CREATE POLICY "Users manage own challenges"
  ON identity_challenges FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── Challenge logs ───────────────────────────────────────────
-- One row per completed day per challenge

CREATE TABLE IF NOT EXISTS challenge_logs (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id  uuid    NOT NULL REFERENCES identity_challenges(id) ON DELETE CASCADE,
  day           integer NOT NULL,
  completed_at  date    NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (challenge_id, day)
);

CREATE INDEX IF NOT EXISTS challenge_logs_challenge_idx ON challenge_logs (challenge_id);

ALTER TABLE challenge_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own challenge logs" ON challenge_logs;
CREATE POLICY "Users manage own challenge logs"
  ON challenge_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── Journal entries ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL,
  content     text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS journal_entries_user_date_idx ON journal_entries (user_id, date DESC);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own journal entries" ON journal_entries;
CREATE POLICY "Users manage own journal entries"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── Monthly retrospectives ───────────────────────────────────

CREATE TABLE IF NOT EXISTS monthly_retrospectives (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month        text        NOT NULL,  -- 'YYYY-MM'
  content      text        NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

ALTER TABLE monthly_retrospectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own retrospectives" ON monthly_retrospectives;
CREATE POLICY "Users manage own retrospectives"
  ON monthly_retrospectives FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── Scripting sessions ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS scripting_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  reflection  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scripting_sessions_user_idx ON scripting_sessions (user_id, created_at DESC);

ALTER TABLE scripting_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own scripting sessions" ON scripting_sessions;
CREATE POLICY "Users manage own scripting sessions"
  ON scripting_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
