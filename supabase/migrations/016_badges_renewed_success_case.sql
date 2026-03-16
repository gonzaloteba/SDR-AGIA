-- Add independent badge columns for "Renovado" and "Caso de Éxito"
-- These coexist with the main status (active, completed, cancelled)

ALTER TABLE clients ADD COLUMN is_renewed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN is_success_case BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing data: clients with status 'renewed' or 'success_case' get the badge + become 'active'
UPDATE clients SET is_renewed = true, status = 'active' WHERE status = 'renewed';
UPDATE clients SET is_success_case = true, status = 'active' WHERE status = 'success_case';

-- Update the status constraint to remove 'renewed' and 'success_case'
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_status_check
  CHECK (status IN ('active', 'cancelled', 'completed'));
