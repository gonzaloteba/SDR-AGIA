-- Add coach_id foreign key to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL;

-- Add coach_id foreign key to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL;

-- Index for filtering clients by coach
CREATE INDEX IF NOT EXISTS idx_clients_coach ON clients(coach_id);

-- Index for filtering calls by coach
CREATE INDEX IF NOT EXISTS idx_calls_coach ON calls(coach_id);

-- Update RLS policies to allow coaches to read all coach profiles (needed for admin views)
DROP POLICY IF EXISTS "Coaches can read own profile" ON coaches;
CREATE POLICY "Authenticated users can read coaches" ON coaches
  FOR SELECT TO authenticated USING (true);
