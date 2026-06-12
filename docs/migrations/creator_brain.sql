-- docs/migrations/creator_brain.sql
-- Idempotent — safe to run multiple times. No DROP, no destructive changes.
-- Apply in Supabase SQL editor or via CLI: psql -f docs/migrations/creator_brain.sql

CREATE TABLE IF NOT EXISTS creator_brain (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name       TEXT,
  niche              TEXT,
  target_audience    TEXT,
  primary_platforms  TEXT[],
  tone_description   TEXT,
  writing_examples   TEXT,
  brand_notes        TEXT,
  forbidden_phrases  TEXT,
  style_notes        TEXT,
  voice_profile_json JSONB,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT creator_brain_user_id_unique UNIQUE (user_id)
);

ALTER TABLE creator_brain ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_brain' AND policyname = 'creator_brain_select'
  ) THEN
    CREATE POLICY "creator_brain_select" ON creator_brain
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_brain' AND policyname = 'creator_brain_insert'
  ) THEN
    CREATE POLICY "creator_brain_insert" ON creator_brain
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_brain' AND policyname = 'creator_brain_update'
  ) THEN
    CREATE POLICY "creator_brain_update" ON creator_brain
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_brain' AND policyname = 'creator_brain_delete'
  ) THEN
    CREATE POLICY "creator_brain_delete" ON creator_brain
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
