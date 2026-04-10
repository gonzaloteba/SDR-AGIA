-- Add positive_highlights column to calls table
-- Stores AI-extracted positive points from the coaching session for WhatsApp follow-up
ALTER TABLE calls ADD COLUMN IF NOT EXISTS positive_highlights TEXT;

COMMENT ON COLUMN calls.positive_highlights IS 'AI-extracted positive highlights from the call for WhatsApp follow-up';
