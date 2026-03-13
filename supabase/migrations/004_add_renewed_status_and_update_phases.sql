-- Add 'renewed' to the status CHECK constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_status_check
  CHECK (status IN ('active', 'cancelled', 'completed', 'renewed', 'success_case'));

-- Update trigger: Phase 2 now lasts 30 days (change at day 37 instead of 35)
CREATE OR REPLACE FUNCTION calculate_phase_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_phase = 1 THEN
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

-- Recalculate phase_change_date for all existing clients
UPDATE clients SET current_phase = current_phase WHERE TRUE;
