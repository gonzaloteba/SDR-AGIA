-- Create resources table for coach-accessible links (looms, forms, etc.)
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read resources
CREATE POLICY "Authenticated users can read resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete resources (enforced at app level)
CREATE POLICY "Authenticated users can insert resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete resources"
  ON resources FOR DELETE
  TO authenticated
  USING (true);
