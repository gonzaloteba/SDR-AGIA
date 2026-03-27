-- Add 'paused' to the allowed client statuses
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_status_check
  CHECK (status IN ('active', 'paused', 'cancelled', 'completed'));
