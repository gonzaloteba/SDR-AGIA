-- Add coach_actions fields to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS coach_actions TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS coach_actions_completed BOOLEAN NOT NULL DEFAULT false;

-- Add index for quick lookup of pending coach actions
CREATE INDEX IF NOT EXISTS idx_calls_pending_coach_actions
  ON calls (client_id)
  WHERE coach_actions IS NOT NULL AND coach_actions_completed = false;
