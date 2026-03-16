-- Add missing UPDATE policy for calls table
-- This was missing from 001_initial_schema.sql, causing coach_actions_completed updates to be blocked by RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update calls') THEN
    CREATE POLICY "Authenticated users can update calls" ON calls FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;
