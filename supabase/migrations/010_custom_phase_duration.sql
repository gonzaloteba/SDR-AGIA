-- Add custom_phase_duration_days column for per-client phase interval override
-- Values: NULL = use default, -1 = indefinite (no phase change), positive = custom days
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_phase_duration_days INTEGER;

-- Update trigger to handle custom duration and indefinite (-1)
CREATE OR REPLACE FUNCTION calculate_phase_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custom_phase_duration_days = -1 THEN
    -- Indefinite: no automatic phase change
    NEW.phase_change_date := NULL;
  ELSIF NEW.custom_phase_duration_days IS NOT NULL AND NEW.custom_phase_duration_days > 0 THEN
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
