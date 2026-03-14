-- Add transcript and Google Meet fields to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS meet_link TEXT;

-- Index for deduplication when syncing from Google Calendar
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_google_event ON calls(google_event_id) WHERE google_event_id IS NOT NULL;
