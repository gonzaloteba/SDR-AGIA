-- Migration 009: Ensure training_level column exists
-- This was defined in migration 005 and 008 but may not have been applied
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_level TEXT;
