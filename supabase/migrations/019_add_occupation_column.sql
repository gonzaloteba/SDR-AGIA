-- Add occupation column to clients table (Typeform field "¿A qué te dedicas?")
ALTER TABLE clients ADD COLUMN IF NOT EXISTS occupation TEXT;
