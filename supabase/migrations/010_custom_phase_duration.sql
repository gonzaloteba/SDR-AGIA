-- Add custom_phase_duration_days column for per-client phase interval override
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_phase_duration_days INTEGER;

-- Update trigger to use custom duration when set
CREATE OR REPLACE FUNCTION calculate_phase_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custom_phase_duration_days IS NOT NULL THEN
    -- Custom interval: phase_change_date = today + custom days
    NEW.phase_change_date := CURRENT_DATE + (NEW.custom_phase_duration_days * INTERVAL '1 day');
  ELSIF NEW.current_phase = 1 THEN
    -- Phase 1: 7 days from start
    NEW.phase_change_date := NEW.start_date + INTERVAL '7 days';
  ELSIF NEW.current_phase = 2 THEN
    -- Phase 2: 30 days after Phase 1 ends (day 7 + 30 = day 37)
    NEW.phase_change_date := NEW.start_date + INTERVAL '37 days';
  ELSE
    -- Phase 3: ends at day 90
    NEW.phase_change_date := NEW.start_date + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
