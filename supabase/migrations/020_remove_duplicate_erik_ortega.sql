-- Migration: Remove duplicate cancelled "Erik Ortega" client
-- The active client is "Erick Ortega" (status = 'active')
-- The duplicate is "Erik Ortega" (status = 'cancelled')
-- Transfer any related data from the cancelled duplicate to the active one before deleting.

DO $$
DECLARE
  v_active_id UUID;
  v_cancelled_id UUID;
BEGIN
  -- Find the active Erick Ortega
  SELECT id INTO v_active_id FROM clients
  WHERE LOWER(TRIM(last_name)) = 'ortega'
    AND status = 'active'
    AND LOWER(TRIM(first_name)) IN ('erick', 'erik')
  LIMIT 1;

  -- Find the cancelled Erik Ortega
  SELECT id INTO v_cancelled_id FROM clients
  WHERE LOWER(TRIM(last_name)) = 'ortega'
    AND status = 'cancelled'
    AND LOWER(TRIM(first_name)) IN ('erick', 'erik')
  LIMIT 1;

  -- Only proceed if both exist
  IF v_active_id IS NOT NULL AND v_cancelled_id IS NOT NULL AND v_active_id != v_cancelled_id THEN
    -- Transfer calls from cancelled to active client
    UPDATE calls SET client_id = v_active_id WHERE client_id = v_cancelled_id;

    -- Transfer check-ins from cancelled to active client
    UPDATE check_ins SET client_id = v_active_id WHERE client_id = v_cancelled_id;

    -- Transfer alerts from cancelled to active client
    UPDATE alerts SET client_id = v_active_id WHERE client_id = v_cancelled_id;

    -- Transfer training plans from cancelled to active client
    UPDATE training_plans SET client_id = v_active_id WHERE client_id = v_cancelled_id;

    -- Delete the cancelled duplicate (any remaining related data cascades)
    DELETE FROM clients WHERE id = v_cancelled_id;

    RAISE NOTICE 'Deleted duplicate cancelled Erik Ortega (%) and transferred data to active Erick Ortega (%)', v_cancelled_id, v_active_id;
  ELSE
    RAISE NOTICE 'Could not find both active and cancelled Ortega clients. Active: %, Cancelled: %', v_active_id, v_cancelled_id;
  END IF;
END $$;
