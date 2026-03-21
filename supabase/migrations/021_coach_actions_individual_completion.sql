-- Allow individual completion of coach action items
-- Stores indices (0-based) of completed items within the coach_actions text
ALTER TABLE calls ADD COLUMN IF NOT EXISTS coach_actions_completed_items JSONB NOT NULL DEFAULT '[]'::jsonb;
