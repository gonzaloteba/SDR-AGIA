-- Migration: 006_seed_real_client_data.sql
-- Generated: 2026-03-13
-- Seeds real client data from CSV exports (BdD Nueva, Onboarding, Check-ins, Auditoría)
-- Matching strategy: LOWER(TRIM(first_name)) + LOWER(TRIM(last_name)) on existing clients
-- ============================================
-- STEP 1: Add missing columns to clients table
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS height_cm DECIMAL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS initial_weight_kg DECIMAL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS initial_body_fat_pct DECIMAL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS initial_photo_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_experience TEXT;
-- Extend plan_type to support all plans from CSV
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_plan_type_check;
-- (plan_type is TEXT DEFAULT '3_months' with no explicit CHECK, so no constraint to drop)
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10);
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS phase TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS cravings BOOLEAN;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS digestion TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS carb_sensation TEXT;
-- ============================================
-- STEP 2: Update clients from BdD Nueva
-- (status, plan, phase, dates, closer, timezone)
-- ============================================
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 3,
    start_date = '2026-01-07',
    renewal_date = '2026-07-07',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Elías')
  AND LOWER(TRIM(last_name)) = LOWER('Fernandez');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 3,
    start_date = '2026-01-07',
    renewal_date = '2026-04-07',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Israel')
  AND LOWER(TRIM(last_name)) = LOWER('Villa');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 2,
    start_date = '2026-01-12',
    renewal_date = '2026-07-12',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Santiago')
  AND LOWER(TRIM(last_name)) = LOWER('Arce');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 2,
    start_date = '2026-01-12',
    renewal_date = '2026-05-12',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Kelvin')
  AND LOWER(TRIM(last_name)) = LOWER('Iribe');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 2,
    start_date = '2026-01-19',
    renewal_date = '2026-04-19',
    closer = 'Facundo C',
    timezone = 'America/Santo_Domingo'
WHERE LOWER(TRIM(first_name)) = LOWER('Miguel')
  AND LOWER(TRIM(last_name)) = LOWER('Lendoff');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 2,
    start_date = '2026-01-19',
    renewal_date = '2026-07-19',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Carlos')
  AND LOWER(TRIM(last_name)) = LOWER('Rivera');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 3,
    start_date = '2025-09-29',
    renewal_date = '2026-01-29',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Cristian')
  AND LOWER(TRIM(last_name)) = LOWER('Pacheco');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 2,
    start_date = '2025-09-29',
    renewal_date = '2026-03-29',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Jesús')
  AND LOWER(TRIM(last_name)) = LOWER('Demuner');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 3,
    start_date = '2025-09-29',
    renewal_date = '2026-01-29',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Jesús')
  AND LOWER(TRIM(last_name)) = LOWER('Romero');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 3,
    start_date = '2025-10-20',
    renewal_date = '2026-02-20',
    closer = 'Facundo C',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Nacho')
  AND LOWER(TRIM(last_name)) = LOWER('Porcar');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 1,
    start_date = '2025-10-20',
    renewal_date = '2026-02-20',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Juan Pablo')
  AND LOWER(TRIM(last_name)) = LOWER('Martinez A');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 1,
    start_date = '2025-10-27',
    renewal_date = '2026-02-27',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Alejandro')
  AND LOWER(TRIM(last_name)) = LOWER('Barron');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 2,
    start_date = '2025-11-24',
    renewal_date = '2026-03-24',
    closer = 'Facundo C',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('José')
  AND LOWER(TRIM(last_name)) = LOWER('Palma');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 1,
    start_date = '2026-01-05',
    renewal_date = '2026-05-05',
    closer = 'Felipe S',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Eduardo')
  AND LOWER(TRIM(last_name)) = LOWER('Medina');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 3,
    start_date = '2026-01-05',
    renewal_date = '2026-05-05',
    closer = 'Felipe S',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Ernesto')
  AND LOWER(TRIM(last_name)) = LOWER('Castañeda');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months_1on1',
    current_phase = 3,
    start_date = '2026-01-05',
    renewal_date = '2026-07-05',
    closer = 'Andrés T',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Mauro')
  AND LOWER(TRIM(last_name)) = LOWER('Gonzalez');
UPDATE clients SET
    status = 'active',
    plan_type = '4_months',
    current_phase = 3,
    start_date = '2025-12-15',
    renewal_date = '2026-04-15',
    closer = 'Felipe S',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Hector')
  AND LOWER(TRIM(last_name)) = LOWER('Flores Lara');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 2,
    start_date = '2026-01-12',
    renewal_date = '2026-04-12',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('André')
  AND LOWER(TRIM(last_name)) = LOWER('Bilse');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 2,
    start_date = '2026-01-05',
    renewal_date = '2026-07-05',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Leonel Alejandro')
  AND LOWER(TRIM(last_name)) = LOWER('Vizcaino');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 3,
    start_date = '2026-01-12',
    renewal_date = '2026-04-12',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Hermes Octavio')
  AND LOWER(TRIM(last_name)) = LOWER('Contla Gutiérrez');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 3,
    start_date = '2026-01-12',
    renewal_date = '2026-07-12',
    closer = 'Andrés T',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Davide')
  AND LOWER(TRIM(last_name)) = LOWER('Fedrizzi');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 1,
    start_date = '2026-01-12',
    renewal_date = '2026-07-12',
    closer = 'Andrés T',
    timezone = 'America/Bogota'
WHERE LOWER(TRIM(first_name)) = LOWER('Christian')
  AND LOWER(TRIM(last_name)) = LOWER('Lopez');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 3,
    start_date = '2026-01-12',
    renewal_date = '2026-07-12',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Elvis')
  AND LOWER(TRIM(last_name)) = LOWER('Rodriguez');
UPDATE clients SET
    status = 'active',
    plan_type = '12_months',
    current_phase = 2,
    start_date = '2026-01-12',
    renewal_date = '2027-01-12',
    closer = 'Santiago L',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Abdi')
  AND LOWER(TRIM(last_name)) = LOWER('Campos');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 2,
    start_date = '2026-02-02',
    renewal_date = '2026-08-02',
    closer = 'Santiago L',
    timezone = 'Atlantic/Canary'
WHERE LOWER(TRIM(first_name)) = LOWER('Alejandro')
  AND LOWER(TRIM(last_name)) = LOWER('Ramones Iacoviello');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 2,
    start_date = '2026-02-09',
    renewal_date = '2026-05-09',
    closer = 'Santiago L',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Christian')
  AND LOWER(TRIM(last_name)) = LOWER('Garcia');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 2,
    start_date = '2026-02-09',
    renewal_date = '2026-05-09',
    closer = 'Santiago L',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Pablo')
  AND LOWER(TRIM(last_name)) = LOWER('Lozano');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 2,
    start_date = '2026-02-09',
    renewal_date = '2026-05-09',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Pablo')
  AND LOWER(TRIM(last_name)) = LOWER('Aviles');
UPDATE clients SET
    status = 'active',
    plan_type = '6_months',
    current_phase = 1,
    start_date = '2026-02-09',
    renewal_date = '2026-08-09',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Rafael')
  AND LOWER(TRIM(last_name)) = LOWER('Pineda');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 1,
    start_date = '2026-02-16',
    renewal_date = '2026-05-16',
    closer = 'Santiago L',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Guillem')
  AND LOWER(TRIM(last_name)) = LOWER('Ribas');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 1,
    start_date = '2026-02-26',
    renewal_date = '2026-05-26',
    closer = 'Santiago L',
    timezone = 'America/Santo_Domingo'
WHERE LOWER(TRIM(first_name)) = LOWER('Elvis')
  AND LOWER(TRIM(last_name)) = LOWER('Florentino');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 2,
    start_date = '2026-02-23',
    renewal_date = '2026-05-23',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Juan Pablo')
  AND LOWER(TRIM(last_name)) = LOWER('Cordero');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 1,
    start_date = '2026-03-23',
    renewal_date = '2026-06-23',
    closer = 'Santiago L',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Eduardo')
  AND LOWER(TRIM(last_name)) = LOWER('Lom');
UPDATE clients SET
    status = 'active',
    plan_type = '3_months',
    current_phase = 1,
    start_date = '2026-03-16',
    renewal_date = '2026-06-16',
    closer = 'Santiago L',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Erick')
  AND LOWER(TRIM(last_name)) = LOWER('Ortega');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-04-03',
    closer = 'Diego E',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Yefry')
  AND LOWER(TRIM(last_name)) = LOWER('Colindres');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-04-29',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Daniel')
  AND LOWER(TRIM(last_name)) = LOWER('Monroy');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-05-09',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Carlos Andrés')
  AND LOWER(TRIM(last_name)) = LOWER('Lopez');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-05-09',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Aldo')
  AND LOWER(TRIM(last_name)) = LOWER('Castillo');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-05-23',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('José')
  AND LOWER(TRIM(last_name)) = LOWER('Atoche');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-06-10',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Daniela')
  AND LOWER(TRIM(last_name)) = LOWER('Gonzalez');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-06-23',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Alfonso')
  AND LOWER(TRIM(last_name)) = LOWER('Torres');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-03-10',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Emiliano')
  AND LOWER(TRIM(last_name)) = LOWER('Camacho');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-07-17',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Maria')
  AND LOWER(TRIM(last_name)) = LOWER('Noda');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-07-21',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Mauro')
  AND LOWER(TRIM(last_name)) = LOWER('Palasi');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-07-21',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Miguel')
  AND LOWER(TRIM(last_name)) = LOWER('Rey');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-07-21',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Daniel')
  AND LOWER(TRIM(last_name)) = LOWER('Toledo');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-07-24',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('José')
  AND LOWER(TRIM(last_name)) = LOWER('Villar');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-09-15',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Kiara')
  AND LOWER(TRIM(last_name)) = LOWER('Salomé');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-10-20',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Jon Ander')
  AND LOWER(TRIM(last_name)) = LOWER('Atutxa');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-10-20',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Oscar')
  AND LOWER(TRIM(last_name)) = LOWER('Latorre');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '4_months',
    start_date = '2025-12-01',
    renewal_date = '2026-04-01',
    closer = 'Facundo C',
    timezone = 'America/Bogota'
WHERE LOWER(TRIM(first_name)) = LOWER('Diego')
  AND LOWER(TRIM(last_name)) = LOWER('Molano');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '6_months',
    current_phase = 2,
    start_date = '2026-01-05',
    renewal_date = '2026-07-05',
    closer = 'Andrés T',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Juan Miguel')
  AND LOWER(TRIM(last_name)) = LOWER('Yago');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '6_months',
    current_phase = 2,
    start_date = '2026-01-12',
    renewal_date = '2026-07-12',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Gerardo')
  AND LOWER(TRIM(last_name)) = LOWER('Solis');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '6_months',
    current_phase = 2,
    start_date = '2026-01-12',
    renewal_date = '2026-07-12',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Fidel')
  AND LOWER(TRIM(last_name)) = LOWER('Yam');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-05',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Alejandro')
  AND LOWER(TRIM(last_name)) = LOWER('Bastidas');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-07',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Ana Pau')
  AND LOWER(TRIM(last_name)) = LOWER('Zaldaña');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-11-03',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Erick')
  AND LOWER(TRIM(last_name)) = LOWER('Contreras');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-10',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Paloma')
  AND LOWER(TRIM(last_name)) = LOWER('Sanchez');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-10',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Héctor')
  AND LOWER(TRIM(last_name)) = LOWER('Pérez');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-10',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Luis Alfredo')
  AND LOWER(TRIM(last_name)) = LOWER('Sanchez');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-11',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Gabriela')
  AND LOWER(TRIM(last_name)) = LOWER('Sotelo');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-11',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Gerardo')
  AND LOWER(TRIM(last_name)) = LOWER('Urbiola');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-13',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Ricardo')
  AND LOWER(TRIM(last_name)) = LOWER('Arredondo');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-19',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('José')
  AND LOWER(TRIM(last_name)) = LOWER('Chami');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-20',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Iñigo')
  AND LOWER(TRIM(last_name)) = LOWER('López');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-03-23',
    closer = 'Andrés T',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Andoni')
  AND LOWER(TRIM(last_name)) = LOWER('Perea');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-06-13',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('María')
  AND LOWER(TRIM(last_name)) = LOWER('Heredia');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-07-24',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Pablo')
  AND LOWER(TRIM(last_name)) = LOWER('Sánchez');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-07-24',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Rodrigo')
  AND LOWER(TRIM(last_name)) = LOWER('Castañeda');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-07-25',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Erick')
  AND LOWER(TRIM(last_name)) = LOWER('Carranza');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-07-28',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Ana')
  AND LOWER(TRIM(last_name)) = LOWER('Fernández');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    start_date = '2025-08-02',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Christian')
  AND LOWER(TRIM(last_name)) = LOWER('Gastelum');
UPDATE clients SET
    status = 'completed',
    plan_type = '4_months',
    start_date = '2025-09-08',
    renewal_date = '2026-01-08',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Jesús')
  AND LOWER(TRIM(last_name)) = LOWER('Garza');
UPDATE clients SET
    status = 'completed',
    plan_type = '4_months',
    start_date = '2025-09-15',
    renewal_date = '2026-01-15',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Miguel')
  AND LOWER(TRIM(last_name)) = LOWER('Arnoldo');
UPDATE clients SET
    status = 'completed',
    plan_type = '4_months',
    current_phase = 2,
    start_date = '2025-10-01',
    renewal_date = '2026-02-01',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Eduardo Lalo')
  AND LOWER(TRIM(last_name)) = LOWER('Hernandez');
UPDATE clients SET
    status = 'completed',
    plan_type = '4_months',
    current_phase = 2,
    start_date = '2025-10-20',
    renewal_date = '2026-02-20',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Diego')
  AND LOWER(TRIM(last_name)) = LOWER('Ballesteros');
UPDATE clients SET
    status = 'completed',
    plan_type = '3_months',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Janira')
  AND LOWER(TRIM(last_name)) = LOWER('Rodriguez');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '12_months',
    current_phase = 2,
    start_date = '2025-07-22',
    renewal_date = '2026-07-22',
    closer = 'Facundo C',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Jaime')
  AND LOWER(TRIM(last_name)) = LOWER('Walfisch');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '3_months',
    start_date = '2025-07-30',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Llorián Alvaro')
  AND LOWER(TRIM(last_name)) = LOWER('Bello');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '4_months',
    current_phase = 2,
    start_date = '2025-08-18',
    renewal_date = '2025-12-18',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Victor')
  AND LOWER(TRIM(last_name)) = LOWER('Recinos');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '4_months',
    start_date = '2025-09-29',
    renewal_date = '2026-01-29',
    closer = 'Facundo C',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Tomás')
  AND LOWER(TRIM(last_name)) = LOWER('Rodríguez');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '12_months',
    current_phase = 2,
    start_date = '2025-10-20',
    renewal_date = '2026-10-20',
    closer = 'Facundo C',
    timezone = 'Europe/Madrid'
WHERE LOWER(TRIM(first_name)) = LOWER('Victor')
  AND LOWER(TRIM(last_name)) = LOWER('Blanquez');
UPDATE clients SET
    status = 'cancelled',
    plan_type = '4_months',
    current_phase = 1,
    start_date = '2025-11-11',
    renewal_date = '2026-03-11',
    closer = 'Facundo C',
    timezone = 'America/Mexico_City'
WHERE LOWER(TRIM(first_name)) = LOWER('Eduardo')
  AND LOWER(TRIM(last_name)) = LOWER('Gonzalez');
-- ============================================
-- STEP 3: Update clients from Onboarding Antiguo
-- (phone, email, birth_date, height, weight, body_fat, motivation, medical)
-- ============================================
UPDATE clients SET
    phone = COALESCE(phone, '+524492126117'),
    email = COALESCE(email, 'abdii.campos@gmail.com'),
    birth_date = COALESCE(birth_date, '1991-10-08'),
    height_cm = COALESCE(height_cm, 185.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 105.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 34.0),
    motivation = COALESCE(motivation, 'Rendimiento — Energía y enfoque, Estética — Verme fuerte y definido, Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/3aadcc1048079a1e21568b1edf9a0437eb4b12da6bc8a5182e8f8861be1cc634/IMG_0454_2.HEIC')
WHERE LOWER(TRIM(first_name)) = LOWER('Abdi')
  AND (LOWER(TRIM(last_name)) = LOWER('Campos de Leon')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Campos%'));
UPDATE clients SET
    phone = COALESCE(phone, '+34609305580'),
    email = COALESCE(email, 'ramoalex17@gmail.com'),
    birth_date = COALESCE(birth_date, '1999-06-17'),
    height_cm = COALESCE(height_cm, 186.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 100.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 25.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
    medical_notes = COALESCE(medical_notes, 'Tengo una lesión en el psoas iliaco, dolor lumbar en la parte derecha baja, por falta de movilidad en la cadera y falta de musculatura y fuerza en la zona del core y gluteos y espalda baja, se me pone mal cuando entreno baloncesto o hago muchos saltos, pero no siempre me duele, aun con el dolor puedo entrenar aunque no al 100% , aparte de falta de dorsiflexion de los tobillos y una tendinitis en la rodilla izquierda pero con estas 2 ultimas no me molestan en los entrenamientos mucho'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/ccc66823742a5736e71ddd49a7c202bc8e7ee39d76e4e18b750b2e48cbb4ab05/IMG_2855.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Alejandro')
  AND (LOWER(TRIM(last_name)) = LOWER('Ramones Iacoviello')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Ramones%'));
UPDATE clients SET
    phone = COALESCE(phone, '+525633926201'),
    email = COALESCE(email, 'andrebilsecis@gmail.com'),
    birth_date = COALESCE(birth_date, '1999-10-19'),
    height_cm = COALESCE(height_cm, 181.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 97.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 30.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/ffc0c59f3df0144b6d611e637f117a23fa7cc0f5a88f70dd0c9bf06d6a932395/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Andre')
  AND (LOWER(TRIM(last_name)) = LOWER('Bilse Cisneros')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Bilse%'));
UPDATE clients SET
    phone = COALESCE(phone, '+525543677832'),
    email = COALESCE(email, 'andrestiradog99@gmail.com'),
    birth_date = COALESCE(birth_date, '1999-03-25'),
    height_cm = COALESCE(height_cm, 185.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 85.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 15.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo, Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/1d3d0be055a54135efdd75c97b0ecdcda49470595caf1a99e0aa6f289ab3b112/Foto_de_progreso.png')
WHERE LOWER(TRIM(first_name)) = LOWER('Andres')
  AND LOWER(TRIM(last_name)) = LOWER('Tirado');
UPDATE clients SET
    phone = COALESCE(phone, '+573202466481'),
    email = COALESCE(email, 'christian_cdb@hotmail.com'),
    birth_date = COALESCE(birth_date, '1987-06-04'),
    height_cm = COALESCE(height_cm, 177.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 85.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 22.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
    medical_notes = COALESCE(medical_notes, 'Laminectomia L4-L5, Higado Graso'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/9fdcf584116e28f5103054a85e8438c20dbeabf5a56f0980a2b5b2a3935994a6/Image_2026_01_07_at_9.28.44_PM.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Christian')
  AND LOWER(TRIM(last_name)) = LOWER('Lopez');
UPDATE clients SET
    phone = COALESCE(phone, '+34664027459'),
    email = COALESCE(email, 'christian-alfonso@hotmail.com'),
    birth_date = COALESCE(birth_date, '1990-01-20'),
    height_cm = COALESCE(height_cm, 185.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 83.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 24.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Salud y Longevidad — Largo plazo, Rendimiento — Energía y enfoque'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/10eba2c72181d9277e01abc84977ba13f041e56d8dc0e0adc166a0f6e90ce1ea/WhatsApp_Image_2026_02_03_at_17.35.11.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Christian')
  AND (LOWER(TRIM(last_name)) = LOWER('Garcia Rojas')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Garcia%'));
UPDATE clients SET
    phone = COALESCE(phone, '+15513423464'),
    email = COALESCE(email, 'cristianpachecom@hotmail.com'),
    birth_date = COALESCE(birth_date, '1998-07-23'),
    height_cm = COALESCE(height_cm, 171.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 59.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 11.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/7e94be07c31d9656cb9b18468161688905801fb44fe5fd75cc1ef2558f41399a/IMG_0758.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Cristian')
  AND LOWER(TRIM(last_name)) = LOWER('Pacheco');
UPDATE clients SET
    phone = COALESCE(phone, '+41762366522'),
    email = COALESCE(email, 'davide.fedrizzi@hotmail.it'),
    birth_date = COALESCE(birth_date, '1993-07-09'),
    height_cm = COALESCE(height_cm, 180.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 78.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 15.0),
    motivation = COALESCE(motivation, 'Rendimiento — Energía y enfoque, Estética — Verme fuerte y definido, Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/ba52f05bcfd2c57ee0a174d629474790658d3b0273f7384f8996ca121d85000a/PXL_20260107_224833984.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Davide')
  AND LOWER(TRIM(last_name)) = LOWER('Fedrizzi');
UPDATE clients SET
    phone = COALESCE(phone, '+13853472564'),
    email = COALESCE(email, 'd.peralta2409@icloud.com'),
    birth_date = COALESCE(birth_date, '1991-09-24'),
    height_cm = COALESCE(height_cm, 194.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 90.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 40.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido'),
    medical_notes = COALESCE(medical_notes, 'Convivimos TDAH, Bipolar tipo 1, Borderline, ansiedad generalizada, depresion mayor y uso de sustancias todos en una mismo ser.'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/70767bb704374e2a3626edafcc4deaed9f4c5b43f3308f03192301b47da95a28/IMG_6167.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Diego')
  AND LOWER(TRIM(last_name)) = LOWER('Peralta');
UPDATE clients SET
    phone = COALESCE(phone, '+573134650607'),
    email = COALESCE(email, 'diegomolano8@gmail.com'),
    birth_date = COALESCE(birth_date, '1986-01-18'),
    height_cm = COALESCE(height_cm, 176.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 86.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 24.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/273dd2a2a42128252878b625cee8b29c2b7c41dd262e9d03daea85309c765b8d/IMG_7891.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Diego')
  AND LOWER(TRIM(last_name)) = LOWER('Molano');
UPDATE clients SET
    phone = COALESCE(phone, '+352621835397'),
    email = COALESCE(email, 'l4l01983@gmail.com'),
    birth_date = COALESCE(birth_date, '1983-02-01'),
    height_cm = COALESCE(height_cm, 179.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 97.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 22.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
    medical_notes = COALESCE(medical_notes, 'Riñones, rodillas'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/2cb39a1d4a21e833eb2a4fb2b29081f6f6cef73fda948a7e61449d42fde38ed9/ECA.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Eduardo')
  AND LOWER(TRIM(last_name)) = LOWER('Medina');
UPDATE clients SET
    phone = COALESCE(phone, '+525545453251'),
    email = COALESCE(email, 'rodriguezve1995@gmail.com'),
    birth_date = COALESCE(birth_date, '1995-02-23'),
    height_cm = COALESCE(height_cm, 183.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 83.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 20.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/9e17c9f85a66ad140aa46b548da0f96b552c5bc4c049668dca5b98890fb2b2c9/IMG_0493.HEIC')
WHERE LOWER(TRIM(first_name)) = LOWER('Elvis')
  AND LOWER(TRIM(last_name)) = LOWER('Rodríguez');
UPDATE clients SET
    phone = COALESCE(phone, '+525545220830'),
    email = COALESCE(email, 'efcastanedab@gmail.com'),
    birth_date = COALESCE(birth_date, '1983-01-06'),
    height_cm = COALESCE(height_cm, 185.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 101.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 18.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo'),
    medical_notes = COALESCE(medical_notes, 'resistencia a la insulina'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/07fbfbf4ec4b66baec453f0e4b4264445b14bc9124b896e241101ea64651e7c2/WhatsApp_Image_2025_11_30_at_9.43.06_AM.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Ernesto')
  AND (LOWER(TRIM(last_name)) = LOWER('Castañeda Baños')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Castañeda%'));
UPDATE clients SET
    phone = COALESCE(phone, '+529981473834'),
    email = COALESCE(email, 'fidelo1@icloud.com'),
    birth_date = COALESCE(birth_date, '1989-05-01'),
    height_cm = COALESCE(height_cm, 162.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 92.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 25.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/6766d0db617ba5cc118e7d9f0d90233ed339282b6d996c22d8e2f26d79d7dbdb/IMG_9264.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Fidel')
  AND (LOWER(TRIM(last_name)) = LOWER('Yam Carrillo')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Yam%'));
UPDATE clients SET
    phone = COALESCE(phone, '+528712110035'),
    email = COALESCE(email, 'gerardo.aguero@live.com'),
    birth_date = COALESCE(birth_date, '1992-06-16'),
    height_cm = COALESCE(height_cm, 175.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 75.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 24.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/86c23df441f99475d49a3b421d039e478ac2b0a2edbf4064e41c9c4d5d0c8f3a/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Gerardo')
  AND LOWER(TRIM(last_name)) = LOWER('Solis');
UPDATE clients SET
    phone = COALESCE(phone, '+524811000179'),
    email = COALESCE(email, 'laraemilio@gmail.com'),
    birth_date = COALESCE(birth_date, '1990-05-20'),
    height_cm = COALESCE(height_cm, 180.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 82.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 24.0),
    motivation = COALESCE(motivation, 'Rendimiento — Energía y enfoque'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/c769a4cc753c56baef97c29ae04ef568aad95a8be9d7c985d51c8b9ce8cc777b/Imagen_de_WhatsApp_2025_12_08_a_las_12.38.29_89927b0d.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Héctor Emilio')
  AND (LOWER(TRIM(last_name)) = LOWER('Flores Lara')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Flores%'));
UPDATE clients SET
    phone = COALESCE(phone, '+527712902550'),
    email = COALESCE(email, 'hcontla@icloud.com'),
    birth_date = COALESCE(birth_date, '1987-09-30'),
    height_cm = COALESCE(height_cm, 179.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 62.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 11.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/3f63cdc6faa9e6ed45fd09e005e76f712fbe3bca5c4627023d6be72fa1d3e218/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Hermes Octavio')
  AND (LOWER(TRIM(last_name)) = LOWER('Contla Gutiérrez')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Contla%'));
UPDATE clients SET
    phone = COALESCE(phone, '+525585419350'),
    email = COALESCE(email, 'isravill28@gmail.com'),
    birth_date = COALESCE(birth_date, '1984-03-28'),
    height_cm = COALESCE(height_cm, 163.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 85.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 33.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo, Estética — Verme fuerte y definido'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/a3edb8ed6e9f4c61a294f115330fa4a41988bdd5818571f4e1da442fe65dbf15/IMG_4346.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Israel')
  AND LOWER(TRIM(last_name)) = LOWER('Villa');
UPDATE clients SET
    phone = COALESCE(phone, '+522711230553'),
    email = COALESCE(email, 'jdemuner98@hotmail.com'),
    birth_date = COALESCE(birth_date, '1998-09-12'),
    height_cm = COALESCE(height_cm, 168.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 76.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 20.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo, Rendimiento — Energía y enfoque'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/ee3f7c574551c12280f20f8cd8a4563440cf69571cb95fdbf9335dc29ba0bb8d/d2c644a5_708d_4cfd_81df_bd68c85909a0.JPG')
WHERE LOWER(TRIM(first_name)) = LOWER('Jesús')
  AND (LOWER(TRIM(last_name)) = LOWER('Demuner Chain')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Demuner%'));
UPDATE clients SET
    phone = COALESCE(phone, '+525551061265'),
    email = COALESCE(email, 'jefq27@outlook.com'),
    birth_date = COALESCE(birth_date, '2001-01-27'),
    height_cm = COALESCE(height_cm, 178.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 76.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 12.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo, Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/b32cf5a4c4a405c0662705f82eaf94194fab39932f7b08864f38ab6bbeb1b5eb/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('José Elías')
  AND LOWER(TRIM(last_name)) = LOWER('Fernández');
UPDATE clients SET
    phone = COALESCE(phone, '+34601277591'),
    email = COALESCE(email, 'juanmiyagopedros@gmail.com'),
    birth_date = COALESCE(birth_date, '1998-06-22'),
    height_cm = COALESCE(height_cm, 180.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 65.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 12.0),
    motivation = COALESCE(motivation, 'Rendimiento — Energía y enfoque'),
    medical_notes = COALESCE(medical_notes, 'Tuve un divertículo de Meckel con 14 años, perdí mucha sangre y pese a que es muy bajo el indicador, tengo un poco de anemia'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/6c0863541c7a8fef79cb83ddee909323532307a6227a6dc28cdc57e946a620e1/IMG_3353.HEIC')
WHERE LOWER(TRIM(first_name)) = LOWER('JuanMi')
  AND LOWER(TRIM(last_name)) = LOWER('Yago');
UPDATE clients SET
    phone = COALESCE(phone, '+34657307026'),
    email = COALESCE(email, 'juliangonzalezlopez3@gmail.com'),
    birth_date = COALESCE(birth_date, '1995-08-03'),
    height_cm = COALESCE(height_cm, 180.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 75.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 10.0),
    motivation = COALESCE(motivation, 'Rendimiento — Energía y enfoque, Estética — Verme fuerte y definido, Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/a63271156c862c1554f050ecb220f750c5a9d2933430e5e0ef94a63028fd5b4f/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Julian')
  AND (LOWER(TRIM(last_name)) = LOWER('Gonzalez Lopez')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Gonzalez%'));
UPDATE clients SET
    phone = COALESCE(phone, '+526673050681'),
    email = COALESCE(email, 'kelvin.iribe@hotmail.com'),
    birth_date = COALESCE(birth_date, '1999-02-24'),
    height_cm = COALESCE(height_cm, 181.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 78.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 15.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/d7208f99e28cc21dc8f3df152109e06c2403cfcac4dc9eccc304271c359c296e/IMG_9265.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Kelvin eduardo')
  AND (LOWER(TRIM(last_name)) = LOWER('Iribe avendaño')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Iribe%'));
UPDATE clients SET
    phone = COALESCE(phone, '+526642870521'),
    email = COALESCE(email, 'lvizcainodelmar@gmail.com'),
    birth_date = COALESCE(birth_date, '2006-07-15'),
    height_cm = COALESCE(height_cm, 178.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 90.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 16.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/07070c9665829024dd0a69a408806fca3b59ace6fbd9890f2efcd590b68b59de/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Leonel Alejandro')
  AND LOWER(TRIM(last_name)) = LOWER('Vizcaino');
UPDATE clients SET
    phone = COALESCE(phone, '+15794235724'),
    email = COALESCE(email, 'matthewabrodriguez@gmail.com'),
    birth_date = COALESCE(birth_date, '2006-10-23'),
    height_cm = COALESCE(height_cm, 172.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 92.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 20.0),
    motivation = COALESCE(motivation, 'Rendimiento — Energía y enfoque'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/1b560a2587e17fb2545e58b0eae7e20b8aa2b712b260f696e9be78d93becd571/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Matthew')
  AND LOWER(TRIM(last_name)) = LOWER('Rodriguez');
UPDATE clients SET
    phone = COALESCE(phone, '+525529001425'),
    email = COALESCE(email, 'mauro.gf95@gmail.com'),
    birth_date = COALESCE(birth_date, '1995-02-13'),
    height_cm = COALESCE(height_cm, 170.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 70.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 15.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/7e6f0d8389d5e2e2428b09f86771ccff82ec423b241772e9c404747c24d86893/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Mauro')
  AND LOWER(TRIM(last_name)) = LOWER('Gonzalez');
UPDATE clients SET
    phone = COALESCE(phone, '+18495396155'),
    email = COALESCE(email, 'miguellendof47@gmail.com'),
    birth_date = COALESCE(birth_date, '2004-05-25'),
    height_cm = COALESCE(height_cm, 155.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 80.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 20.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/ec19365a23ed149cf29f70116c8b9d70a20a6deccffea5a57afa447d5334cdd5/IMG_3140.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Miguel')
  AND LOWER(TRIM(last_name)) = LOWER('Lendof');
UPDATE clients SET
    phone = COALESCE(phone, '+34682380270'),
    email = COALESCE(email, 'lozanop89@gmail.com'),
    birth_date = COALESCE(birth_date, '1999-11-06'),
    height_cm = COALESCE(height_cm, 173.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 64.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 12.0),
    motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/c92c16dd58d9fd5107e28f7a5e2dd08fc626bb38e000e65cf284f2b64f972f17/IMG_2542.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Pablo')
  AND (LOWER(TRIM(last_name)) = LOWER('Lozano Rubio')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Lozano%'));
UPDATE clients SET
    phone = COALESCE(phone, '+34687912496'),
    email = COALESCE(email, 'pablo.aviles@gesperbaleares.es'),
    birth_date = COALESCE(birth_date, '1995-07-18'),
    height_cm = COALESCE(height_cm, 170.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 60.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 20.0),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/217dcbe889bc37c739b02677709b9ad6d0d24355945231554b11c64e3193d58e/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Pablo')
  AND (LOWER(TRIM(last_name)) = LOWER('Avilés Sanz')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Avilés%'));
UPDATE clients SET
    phone = COALESCE(phone, '+526622768157'),
    email = COALESCE(email, 'rafa.pq@hotmail.com'),
    birth_date = COALESCE(birth_date, '1995-02-01'),
    height_cm = COALESCE(height_cm, 162.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 75.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 26.0),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/e32f64bae1ffa6a09533cd071e9a5c18b34fc07bc9b618517c5f57fb2e7a2564/76045AA5_BA94_479F_9983_2FC6AD2E6123.png')
WHERE LOWER(TRIM(first_name)) = LOWER('Rafael')
  AND LOWER(TRIM(last_name)) = LOWER('Pineda');
UPDATE clients SET
    phone = COALESCE(phone, '+524422267268'),
    email = COALESCE(email, 'santiarcego@gmail.com'),
    birth_date = COALESCE(birth_date, '1989-09-12'),
    height_cm = COALESCE(height_cm, 176.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 80.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 30.0),
    motivation = COALESCE(motivation, 'Salud y Longevidad — Largo plazo'),
    medical_notes = COALESCE(medical_notes, 'Hernia discal y discos deshidratados'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/1ac000b09edf46e8a15970be8b49fbcdca47e1e06a86871dbfdfcb8b400c816c/image.jpg')
WHERE LOWER(TRIM(first_name)) = LOWER('Santiago')
  AND (LOWER(TRIM(last_name)) = LOWER('Arce Gomez')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Arce%'));
UPDATE clients SET
    phone = COALESCE(phone, '+34648477208'),
    email = COALESCE(email, 'guilliribas05@gmail.com'),
    birth_date = COALESCE(birth_date, '2003-04-25'),
    height_cm = COALESCE(height_cm, 170.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 64.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 19.0),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/5784443dab49618f2f2f886cf0592c6be18d08f754091eb3832534dbc596f67f/IMG_3728.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Guillem')
  AND (LOWER(TRIM(last_name)) = LOWER('Ribas Gris')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Ribas%'));
UPDATE clients SET
    phone = COALESCE(phone, '+18098893251'),
    email = COALESCE(email, 'elvisflorentino@gmail.com'),
    birth_date = COALESCE(birth_date, '1983-07-25'),
    height_cm = COALESCE(height_cm, 175.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 90.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 19.0),
    medical_notes = COALESCE(medical_notes, 'Rinitis alérgica estacional'),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/cc601716a5edd83b34e4b5bcd8be1dc54a2acfebddc10028217a021b054fa9d8/IMG_1084.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Elvis')
  AND LOWER(TRIM(last_name)) = LOWER('Florentino');
UPDATE clients SET
    phone = COALESCE(phone, '+34607757210'),
    email = COALESCE(email, 'naporcare@gmail.com'),
    birth_date = COALESCE(birth_date, '1995-06-26'),
    height_cm = COALESCE(height_cm, 177.0),
    initial_weight_kg = COALESCE(initial_weight_kg, 74.0),
    initial_body_fat_pct = COALESCE(initial_body_fat_pct, 20.0),
    initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/835587fb5ca451da52a7b7a08b6452dc5d0152e457f432d4455d129627904e44/IMG_5436.jpeg')
WHERE LOWER(TRIM(first_name)) = LOWER('Nacho')
  AND LOWER(TRIM(last_name)) = LOWER('Porcar');
-- ============================================
-- STEP 4: Update phone from Auditoría Inicial (new format)
-- ============================================
UPDATE clients SET
    phone = COALESCE(phone, '+17659199218')
WHERE LOWER(TRIM(first_name)) = LOWER('Luis Eduardo')
  AND (LOWER(TRIM(last_name)) = LOWER('Guerrero Arriaga')
    OR LOWER(TRIM(last_name)) LIKE LOWER('Guerrero%'));
UPDATE clients SET
    phone = COALESCE(phone, '+525544781112')
WHERE LOWER(TRIM(first_name)) = LOWER('Erik')
  AND LOWER(TRIM(last_name)) = LOWER('Ortega');
-- ============================================
-- STEP 5: Insert check-ins from Check-Ins CSV
-- ============================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  -- Check-in: Alejandro Ramones Iacoviello @ 2026-02-15T12:28:40
  SELECT id INTO v_client_id FROM clients
  WHERE LOWER(TRIM(first_name)) = LOWER('Alejandro')
    AND (LOWER(TRIM(last_name)) = LOWER('Ramones Iacoviello') OR LOWER(TRIM(last_name)) LIKE LOWER('Ramones%'))
  LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-15T12:28:40'::timestamptz, '3ymxyq9q5t0o32k3ymxyht6yph7fz594', 97.0, 25.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', NULL, ARRAY['https://api.typeform.com/responses/files/a7ce364b34f7422c3c57e96979469cb50e3dd6b46edc5893b899f0ab5ada30f5/IMG_3148.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Check-in: Andoni Perea @ 2025-12-28
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Andoni') AND LOWER(TRIM(last_name)) = LOWER('Perea') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-28T23:39:36'::timestamptz, 'xg9f7b9lbe8osaem8k1vrlxg9f7uo6l0', NULL, 24.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/38b3998918d4fa0591a950c26b2643c938ceac8a004d340e687d449f81e43df0/IMG_0746.png'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Check-in: Andoni Perea @ 2025-12-20
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Andoni') AND LOWER(TRIM(last_name)) = LOWER('Perea') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-20T02:32:52'::timestamptz, 'x4mxso56jdgs2atokl5x4mxspw9660nv', NULL, 20.0, NULL, NULL, NULL, NULL, 'Fase 2', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/e64861ce02ff7bd86f60828ff9ad6a2e581d67bedcfdd23c56b1a3f5f9134f7a/IMG_0362.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Check-in: Andoni Perea @ 2025-12-16
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Andoni') AND LOWER(TRIM(last_name)) = LOWER('Perea') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-16T15:15:10'::timestamptz, '6c73xk4i76nac1dtox86c71acket40ai', NULL, 20.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/52909db1b39841b6ff26ec043a2303403243a031161e82d03109b2ae1b101bd9/IMG_0020.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Check-in: Andre Bilse @ 2026-02-12
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Andre') AND LOWER(TRIM(last_name)) = LOWER('Bilse') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-12T19:53:45'::timestamptz, 'qpsc2hlq7gf0cpbsq4qm8dqpscwaal0l', 95.0, 30.0, NULL, 7, NULL, 5, 'Fase 1', TRUE, 'Peor', NULL, 'Dificultad: Solo el lunes me costó el ejercicio', ARRAY['https://api.typeform.com/responses/files/1253c4ddf11d96e6c8436a780f6c3cbaba7ff906dd67f7018541a099c293d1fd/IMG_1830.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Check-in: Carlos Rivera @ 2026-01-31
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Carlos') AND LOWER(TRIM(last_name)) = LOWER('Rivera') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-31T16:02:17'::timestamptz, 'ypezglzy4s8n9verypezpye85cemoug8', 76.0, 24.0, NULL, 6, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/78df6ad383a29d74a8a2be0a58425e1a8bb272621701856a2a5bc5af76fc6da8/IMG_4895.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Carlos Rivera @ 2026-01-12
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Carlos') AND LOWER(TRIM(last_name)) = LOWER('Rivera') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-12T04:39:21'::timestamptz, 'az2b0drdl326nisn0kaz2bla7lztm84s', NULL, 20.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/84ddcde3a9561ee7287471805d988bf37d01bbb13fe1f62005e28bf765c30e62/IMG_4596.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Carlos Rivera @ 2026-01-06
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Carlos') AND LOWER(TRIM(last_name)) = LOWER('Rivera') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-06T04:28:34'::timestamptz, 'owd819s3m9ttjwr4zn9bz0iowd819s5j', NULL, 20.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/382eb3e299bb0233e465c8f00683ff1342b4d4b03bc383c32c864ce449be0e2a/IMG_4551.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Carlos Rivera @ 2025-12-30
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Carlos') AND LOWER(TRIM(last_name)) = LOWER('Rivera') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-30T06:03:38'::timestamptz, 'sqj2s3qm6ws7sqj2muk297j0pr4w63kl', NULL, 20.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/1b95da89e8e173c7e48ce7103a4418673c29153cfca6b8ca5e7cf56e80816f73/IMG_4265.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Carlos Rivera @ 2025-12-22
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Carlos') AND LOWER(TRIM(last_name)) = LOWER('Rivera') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-22T16:54:25'::timestamptz, 'ntd0o833a7xkxbsd8vntd0orqvnb9077', NULL, 20.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/35495203585dceca8fe4bf7a0c8b0111f5cd015fc5d0a91a68454c9c30ec6865/IMG_3910.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Carlos Rivera @ 2025-12-05
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Carlos') AND LOWER(TRIM(last_name)) = LOWER('Rivera') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-05T16:23:06'::timestamptz, '0u7flbhd4nlhhvsszl0u7flb1mv3aes5', NULL, 24.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/3fa43da095dfc797d0b34451759539d0e9a3416de9f1226b290dc347a70e05e7/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Cristian Pacheco @ 2026-01-31
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Cristian') AND LOWER(TRIM(last_name)) = LOWER('Pacheco') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-31T22:54:33'::timestamptz, '91kqo7ygeohmmin91kqqb0b9dggehu5r', 61.0, 11.0, NULL, 6, NULL, 8, 'Fase 1', TRUE, 'Mejor', NULL, 'Dificultad: Nada todo 100', ARRAY['https://api.typeform.com/responses/files/4698b2f3d8a1b1a467ce8b67e5dfade48e9e4444a74617a4b3e35aca857f6306/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Davide Fedrizzi @ 2026-02-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Davide') AND LOWER(TRIM(last_name)) = LOWER('Fedrizzi') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-02T08:52:19'::timestamptz, 'u8zb0ttrpfsln4w05u8zb0hwd9g465z2', 77.0, 15.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/98a649581fd14435255b9b06ed9fac1923555b73df8a530e64064ccd99854bd5/PXL_20260131_172203494.MP.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Davide Fedrizzi @ 2026-02-13
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Davide') AND LOWER(TRIM(last_name)) = LOWER('Fedrizzi') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-13T20:53:13'::timestamptz, 'qcyp2yxr8fasi6imhm9oxlizqcyp2yx1', 77.0, 14.0, NULL, 5, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/bab9ee4f5aadfca79bdeca74e83cc946197efbe25d970404c4ed85895e99ff29/PXL_20260213_204920246.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Diego Ballesteros @ 2026-02-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Diego') AND (LOWER(TRIM(last_name)) = LOWER('Ballesteros Vega') OR LOWER(TRIM(last_name)) LIKE LOWER('Ballesteros%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-02T14:20:13'::timestamptz, '18qv1pdw1falgcv1xvn18qv1p2sx8gqa', 67.0, 19.0, NULL, 7, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/ff9d19902e03787271b32c5759ab478b27ee62606c2449bf25bf0881f97e3398/20260202_075416.heic'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Diego Ballesteros @ 2026-01-04
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Diego') AND (LOWER(TRIM(last_name)) = LOWER('Ballesteros Vega') OR LOWER(TRIM(last_name)) LIKE LOWER('Ballesteros%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-04T16:51:13'::timestamptz, '93gddpkkjn6dv556kvytr93gdlm12mjk', NULL, 19.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/0e85204303e42f460aa5349ab84bc5ea321428016eac2765746465d77755e721/20260104_104715.heic'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Diego Ballesteros @ 2025-12-22
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Diego') AND (LOWER(TRIM(last_name)) = LOWER('Ballesteros Vega') OR LOWER(TRIM(last_name)) LIKE LOWER('Ballesteros%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-22T01:59:50'::timestamptz, 'bl7tilfw64n457gpkl3bl7tqk0njdyou', NULL, 19.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/ee203b0faea3050d7beb6632a253b4d9c9f9ced0ccf8d8dce49a1ff87423bba8/20251221_195559.heic'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Diego Ballesteros @ 2025-12-03
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Diego') AND (LOWER(TRIM(last_name)) = LOWER('Ballesteros Vega') OR LOWER(TRIM(last_name)) LIKE LOWER('Ballesteros%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-03T03:20:20'::timestamptz, 'e6hast3acusf4wz01qpyre6hamop3thi', NULL, 19.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/a78ddfd92b30dcae18c0ff46f4cfdbf2f6670d0a0b2a66001e22721ae57eb981/20251202_194056.heic'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Diego Ballesteros @ 2026-02-13
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Diego') AND (LOWER(TRIM(last_name)) = LOWER('Ballesteros Vega') OR LOWER(TRIM(last_name)) LIKE LOWER('Ballesteros%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-13T16:30:45'::timestamptz, 'irkc757unaoiwoz49irkcda88zkssp41', 67.0, 19.0, NULL, 7, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/f3665245a526480be7fd51807a131cae105cd6b026a3794a62b9f6f98e6b0be7/20260213_091718.heic'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Diego Molano @ 2025-12-22
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Diego') AND LOWER(TRIM(last_name)) = LOWER('Molano') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-22T18:11:43'::timestamptz, 'nco71hwgautyxnncoixbi1n0rh9ib6fz', NULL, 25.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/0e1a5698676d70a147f41f146e07c10eec575fc5eec16139adfefd01a4d8bf51/IMG_8571.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Eduardo González @ 2026-01-12
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Eduardo') AND (LOWER(TRIM(last_name)) = LOWER('González Salas') OR LOWER(TRIM(last_name)) LIKE LOWER('González%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-12T19:38:30'::timestamptz, 'lfa2milngpr7f2day89jnlfa2milt2wf', NULL, 22.0, NULL, NULL, NULL, NULL, 'Fase 2', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/84905dfa2c457673f220e71371d8fc8d9ee49468c6fb28d5350e272991551fdf/WhatsApp_Image_2026_01_12_at_12.37.51.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Eduardo Hernandez @ 2026-01-09
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Eduardo') AND LOWER(TRIM(last_name)) = LOWER('Hernandez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-09T20:43:13'::timestamptz, 'byi6wj0vtsyzlbvn61u8f9j7vr7yvyvn', NULL, 20.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/76f6c823e77ab9f3e13e9deb08340543d4728e3c15b55abfd4010c0e7c7996ff/IMG_2033.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Eduardo González @ 2025-12-03
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Eduardo') AND (LOWER(TRIM(last_name)) = LOWER('González Salas') OR LOWER(TRIM(last_name)) LIKE LOWER('González%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-03T23:41:26'::timestamptz, 'ue71hxi8zs9wujue7la7es1x21x6yvsu', NULL, 22.0, NULL, NULL, NULL, NULL, 'Fase 2', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/c6a5467681fba8514f4405d5718237ae4a7b01388fa73ee137c1cd1504a0ec6a/WhatsApp_Image_2025_10_31_at_10.39.38.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Elias Fernández @ 2026-02-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Elias') AND LOWER(TRIM(last_name)) = LOWER('Fernández') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-02T21:06:43'::timestamptz, 'ffs8zvi7jkiqnnufggffs8zv1cnmdm2m', 78.0, 11.0, NULL, 5, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', 'Pérdida de control: En la tarde noche, gula', ARRAY['https://api.typeform.com/responses/files/4364e819578948849638a0bc674de043515e7cccd7b2ece78dec0e1e9f1d2c06/IMG_8504.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Elvis Rodriguez @ 2026-02-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Elvis') AND (LOWER(TRIM(last_name)) = LOWER('Rodriguez Velázquez') OR LOWER(TRIM(last_name)) LIKE LOWER('Rodriguez%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-02T16:13:42'::timestamptz, 'i0cs3gusv10dlibii0cs3g5mkeyq3yz9', 83.0, 23.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', 'Pérdida de control: Fui a una boda y durante dos días estuve fuera de la rutina de alimentación y ejercicio', ARRAY['https://api.typeform.com/responses/files/2d81d99e5f1783e4932ea8c4ff3d668b7236d2870f929c8a55abdb393a0ee19e/IMG_0532.HEIC'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Ernesto Castañeda @ 2026-02-01
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Ernesto') AND LOWER(TRIM(last_name)) = LOWER('Castañeda') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-01T19:05:50'::timestamptz, 't98b1zabobk6dexvpfsoy2p8t98b1zab', 99.0, 18.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', 'Pérdida de control: Un para de veces por comidas de trabajo', ARRAY['https://api.typeform.com/responses/files/61e12582ef3d0b8b7489c025d3684bd108c3e18846d525bf5f79f566a50baa5c/IMG_5096.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Ernesto Castañeda @ 2026-01-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Ernesto') AND (LOWER(TRIM(last_name)) = LOWER('Castañeda Baños') OR LOWER(TRIM(last_name)) LIKE LOWER('Castañeda%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-02T18:54:57'::timestamptz, 'ygeub2x571121ulygebsc8t3qxjk26qa', NULL, 19.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/7b825343b0a278f699fa2dd773135b51c8e03efe1e861ab13d22ffae899d8c84/WhatsApp_Image_2026_01_02_at_12.54.14_PM.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Ernesto Castañeda @ 2026-02-14
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Ernesto') AND LOWER(TRIM(last_name)) = LOWER('Castañeda') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-14T16:12:14'::timestamptz, 'vowyhh25v70r4zyg6ndzvowyzw5ikhrc', 100.0, 17.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', 'Pérdida de control: En la comida y porque no pude escoger la comida en una reunión de trabajo', ARRAY['https://api.typeform.com/responses/files/3a1ff549f93fb971e8496bdaa61c60ca0c33cfdbb008ee67f18e52c89c815157/IMG_5143.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Fidel Yam @ 2026-02-01
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Fidel') AND LOWER(TRIM(last_name)) = LOWER('Yam') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-01T02:30:52'::timestamptz, 'jiliieyxc19au7ejilizsofzyvt0m838', 92.0, 25.0, NULL, 5, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', 'Pérdida de control: Me enferme', ARRAY['https://api.typeform.com/responses/files/6c5c4bc7285148c85e35254aa99798a8c1fa9ee05835b71aaccad755b56110ab/IMG_9264.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Gonzalo Teba @ 2026-02-09
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Gonzalo') AND LOWER(TRIM(last_name)) = LOWER('Teba') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-09T13:39:10'::timestamptz, 'fut5cxldx9mpzozmfut5cefa1cksrm24', NULL, NULL, 5, NULL, 5, NULL, 'Acabo de entrar', NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Gonzalo Teba del sol @ 2026-02-09
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Gonzalo') AND (LOWER(TRIM(last_name)) = LOWER('Teba del sol') OR LOWER(TRIM(last_name)) LIKE LOWER('Teba%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-09T13:42:58'::timestamptz, 'd180pbw2pke0zq3s5d180pdgnhat5evi', 58.0, 52.0, NULL, 7, NULL, 10, 'Fase 1', FALSE, 'Igual', NULL, 'Dificultad: Cafe', ARRAY['https://api.typeform.com/responses/files/b65e3a830ccd91675f32555911868d62dbb6cc7afa09172810abd96b059c01f7/a5b15acd_62fa_4734_b889_18fc547215f8.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Hermes Contla @ 2026-02-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Hermes') AND LOWER(TRIM(last_name)) = LOWER('Contla') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-02T01:46:42'::timestamptz, '1sugwuzudnk927k1sugw2mnnct35gn34', 64.0, 11.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', NULL, ARRAY['https://api.typeform.com/responses/files/2b7a86ade2d19659234862edee7a1d9db02aa15eeff32a82d1fc58aaca132e4d/IMG_1547.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Israel Villa @ 2026-02-01
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Israel') AND LOWER(TRIM(last_name)) = LOWER('Villa') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-01T13:57:06'::timestamptz, 'pnrugu7fnep5cy4mh0urgnpnrugu7dnd', 78.0, 30.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/abbbcebde7f144bc583ba56c817801c9e914f449c6ee6f0b1ac270ba6e049f2b/IMG_4549.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Israel Villa @ 2026-01-09
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Israel') AND LOWER(TRIM(last_name)) = LOWER('Villa') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-09T21:20:45'::timestamptz, '5g086nwuxegnlhqykm6es75g086okn2a', NULL, 33.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/5b76326bdedc95de4fb59e80faf0854f9ce59be30908a678c068ed306808021e/IMG_4346.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Israel Villa @ 2026-02-14
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Israel') AND LOWER(TRIM(last_name)) = LOWER('Villa') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-14T16:40:35'::timestamptz, 'co2lb8toifx4q0n3epco8of52ch3mzpi', 77.0, 29.0, NULL, 7, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/8a96996a515016a37c1f81b2a5c514a9fe26f51e6bc29eeab6f22d4eee4bf7bf/IMG_4633.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jaime Walfisch @ 2025-12-24
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jaime') AND LOWER(TRIM(last_name)) = LOWER('Walfisch') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-24T09:40:21'::timestamptz, 's705t6m4oqg9o2dhs705t6maw2oqqrac', NULL, 17.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/ddf7c488de89adb98fc5aefbf836ad14e5147630dd3435dfc26da072ef59fb2d/IMG_0035.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jaime Walfisch @ 2026-01-10
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jaime') AND (LOWER(TRIM(last_name)) = LOWER('walfisch arroyo') OR LOWER(TRIM(last_name)) LIKE LOWER('walfisch%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-10T11:08:20'::timestamptz, 'l9ul5dp5p00j75yl9ul5nmzs9v4dbj3i', NULL, 14.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/eb6a9b5bb024c74899cce357f38df62bddf774e78aaf71260c44bfa7eed8bd01/IMG_0638.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jaime Walfisch @ 2025-12-30
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jaime') AND LOWER(TRIM(last_name)) = LOWER('Walfisch') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-30T20:09:11'::timestamptz, 'rvl7x7sfeiarkyoi4rvl7bja42xwzaxg', NULL, 19.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/497f2388a93710358400e4f96c4fc5a4ba75c3b5adbcc7a32270fbef36ff3849/IMG_0150.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jesús Demuner @ 2026-01-12
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jesús') AND LOWER(TRIM(last_name)) = LOWER('Demuner') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-12T00:03:13'::timestamptz, 'hb4mapt7uhz54u71hb4ma2osqrtoxvvr', NULL, 20.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/fc0af54ca2d4bb36f199006768915313ab5d46e30bbf19bcb619bded58299ed6/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jesus Romero @ 2025-12-06
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jesus') AND LOWER(TRIM(last_name)) = LOWER('Romero') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-06T15:36:01'::timestamptz, 'bh323oiatvk37d1hvbh328qgl1uqg0tn', NULL, 24.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/6389715d7786712ad615b02676e760325f723357075c2bb4bd1eec17cf750b18/5DD7DCF1_49EE_426A_90EC_D2D64128D976.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jesús Romero @ 2026-01-31
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jesús') AND (LOWER(TRIM(last_name)) = LOWER('Romero Vázquez') OR LOWER(TRIM(last_name)) LIKE LOWER('Romero%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-31T12:26:23'::timestamptz, 'lhqwp3h7yflv72ryna2slhqw817rxyji', 89.0, 24.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/b00da0a2ef60de8252fa9c8e4d3e576fbcbc71dd9f3f122965977dcf5bbbdad3/IMG_1886.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- JESÚS ROMERO @ 2026-01-13
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('JESÚS') AND (LOWER(TRIM(last_name)) = LOWER('ROMERO VAZQUEZ') OR LOWER(TRIM(last_name)) LIKE LOWER('ROMERO%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-13T13:41:18'::timestamptz, 'opivq35iahr2oo9opivqpzzgkwzbxr5i', 90.0, 25.0, NULL, 7, NULL, NULL, 'Fase 1', FALSE, NULL, NULL, 'Dificultad: RESET DE CAFE', ARRAY['https://api.typeform.com/responses/files/055817ba00b9be4751810c168352eccc16651b9a3af8c794a493eb6ce2c6aa3b/IMG_1042.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jose Palma @ 2025-12-19
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jose') AND (LOWER(TRIM(last_name)) = LOWER('Palma Rodríguez') OR LOWER(TRIM(last_name)) LIKE LOWER('Palma%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-19T17:42:54'::timestamptz, 'id3r1kbmn6kwwwxid31p0qqv65ucdup1', NULL, 33.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/18918c11bd33df78063c3ecb6a2a4334f21fae639e3639ed8e4003f877c46fb5/17661661528518665545221270438957.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jose Palma @ 2025-12-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jose') AND (LOWER(TRIM(last_name)) = LOWER('Palma Rodríguez') OR LOWER(TRIM(last_name)) LIKE LOWER('Palma%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-02T18:11:07'::timestamptz, '6h3dl39kr3k47284pxuru6h3dlkfxc4e', NULL, 25.0, NULL, NULL, NULL, NULL, 'Fase 2', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/d09cbb2ce23e7fb3b0c42556a0853f98dc78aad3134d4306915ad84d97c1f893/17646990403787938413103532715263.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jose Palma @ 2025-12-30
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jose') AND (LOWER(TRIM(last_name)) = LOWER('Palma Rodríguez') OR LOWER(TRIM(last_name)) LIKE LOWER('Palma%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-30T17:24:09'::timestamptz, 'yufdev5dxwtei899shp9yufde7l23rfe', NULL, 35.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/806d8bf4592196b3e60370d2ce3115f9200bf593937388be015be5ab7da53a17/17671154311811399916903167022442.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jose Palma @ 2026-02-04
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jose') AND (LOWER(TRIM(last_name)) = LOWER('Palma Rodríguez') OR LOWER(TRIM(last_name)) LIKE LOWER('Palma%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-04T10:29:03'::timestamptz, 'ubynv7h0m8w27tpsv1aneubynv7hz7lv', 103.0, 30.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', 'Pérdida de control: Varios días, por "compromisos"', ARRAY['https://api.typeform.com/responses/files/659b2389fd48c41d6f1dadca21359e9e81a0565e597930402153703122debe79/1770200915594..jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jose Manuel Palma @ 2026-02-13
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jose Manuel') AND (LOWER(TRIM(last_name)) = LOWER('Palma Rodríguez') OR LOWER(TRIM(last_name)) LIKE LOWER('Palma%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-13T17:47:19'::timestamptz, 'zdz4514cou5xiqpouelzdz4k5s2ee8vk', 102.0, 25.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', NULL, ARRAY['https://api.typeform.com/responses/files/ef514120273f5a94e5bf05b0a97732aff582b016e8aa883460190f5e7a1cb3fb/IMG_20260213_184300.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Juan Pablo Martínez @ 2026-01-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Juan Pablo') AND (LOWER(TRIM(last_name)) = LOWER('Martínez Andrade') OR LOWER(TRIM(last_name)) LIKE LOWER('Martínez%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-02T19:55:29'::timestamptz, 'eneyn6dgd5e0ptnmfgmeneyn6uhb9z6t', NULL, 35.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/cf4f835ce8207837b4d558714e1e06acbbeb796e00759f7ae78e7b1f665af2c0/IMG_1146.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Kelvin Iribe @ 2026-01-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Kelvin eduardo') AND (LOWER(TRIM(last_name)) = LOWER('Iribe avendaño') OR LOWER(TRIM(last_name)) LIKE LOWER('Iribe%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-02T21:24:00'::timestamptz, 'w6h649mvzupwcovtjbw6h649f6pwc7ni', NULL, 13.0, NULL, NULL, NULL, NULL, 'Fase 2', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/ab3ead5a7121699a8613fc046be1a15702b7f149545689029967004d85422558/IMG_9191.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Kelvin Iribe @ 2026-01-13
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Kelvin Eduardo') AND (LOWER(TRIM(last_name)) = LOWER('Iribe avendaño') OR LOWER(TRIM(last_name)) LIKE LOWER('Iribe%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-13T16:38:57'::timestamptz, 'bctigpsutzs69pbaq1iabt8bctigpsns', 78.0, 15.0, NULL, 6, NULL, 8, 'Fase 2', FALSE, NULL, NULL, 'Dificultad: Dormir temprano', ARRAY['https://api.typeform.com/responses/files/23ece214b7e3d092da321438992fc787c9c856191eaf02d330d3800568be46b9/IMG_9265.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Llorian Bello @ 2026-02-01
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Llorian') AND (LOWER(TRIM(last_name)) = LOWER('Alvaro Bello') OR LOWER(TRIM(last_name)) LIKE LOWER('Alvaro%') OR LOWER(TRIM(last_name)) LIKE LOWER('Bello%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-01T20:20:55'::timestamptz, 'b1xark27tlv5bml1kqb1xark204s6jjz', 75.0, 12.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', 'Pérdida de control: De noche, después de la cena', ARRAY['https://api.typeform.com/responses/files/0331f7fda7184234e219c9cb3fae7a0d3559f35f1e880a979962f04c3bcda3fe/IMG_6969.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Llorián Bello @ 2026-01-05
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Llorián') AND (LOWER(TRIM(last_name)) = LOWER('Álvaro Bello') OR LOWER(TRIM(last_name)) LIKE LOWER('Álvaro%') OR LOWER(TRIM(last_name)) LIKE LOWER('Bello%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-05T22:23:55'::timestamptz, 'aopffcej5poyf40237aopxv9rjwt2zf4', NULL, 10.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/4ffd4de0a8d4d18c80789fa6522832a58141aed701ecb87cf3fde74b46468f83/IMG_5805.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Llorián Bello @ 2025-12-27
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Llorián') AND (LOWER(TRIM(last_name)) = LOWER('Álvaro Bello') OR LOWER(TRIM(last_name)) LIKE LOWER('Álvaro%') OR LOWER(TRIM(last_name)) LIKE LOWER('Bello%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-27T07:40:22'::timestamptz, '9zcw3jo4suyqcmubyu9zcwuntfioa97f', NULL, 10.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/b6a0a0f4a5d0e44f12b3ff4bf86ad62cb629b82caefcb898b206accdac425333/IMG_5166.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Mauro Gonzalez @ 2026-02-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Mauro') AND LOWER(TRIM(last_name)) = LOWER('Gonzalez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-02T19:59:16'::timestamptz, 'ymkflgq23devhasymkfnytjl414aws54', 70.0, 12.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', NULL, ARRAY['https://api.typeform.com/responses/files/3e6ec2ae8225dc14a6258c47c0bb601243eabe5840b2208044a0dad6f0a2fbdd/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Miguel Lendof @ 2025-12-19
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Miguel') AND LOWER(TRIM(last_name)) = LOWER('Lendof') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-19T18:39:50'::timestamptz, '03a1jeplpxpa9uq6ek8v03a1jey27yq3', NULL, 16.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/aa80bdd28db99221a361eb2409bde8ccf14cccd460923a6eddc857befabf3af3/IMG_2658.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Nacho Porcar @ 2026-02-03
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Nacho') AND LOWER(TRIM(last_name)) = LOWER('Porcar') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-03T13:42:11'::timestamptz, 'vqmjmle5w58wuhdccnfjvqmjmeyf41t6', 74.0, 25.0, NULL, 7, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/44c3f14aecfb2806c5d9d3148a16619f66cafb5bed6ac643d9b8c2989136897b/IMG_5194.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Nacho Porcar @ 2025-12-27
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Nacho') AND LOWER(TRIM(last_name)) = LOWER('Porcar') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-27T12:21:57'::timestamptz, 'uxjwyob4ghovogb27svuxjws2aa0zscp', NULL, 19.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/72e1c277519d84d6bb1bad3c483c5451cb59a58dc47f698ce6ca5bc4c279e133/IMG_4437.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Nacho Porcar @ 2025-12-03
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Nacho') AND LOWER(TRIM(last_name)) = LOWER('Porcar') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-03T14:09:15'::timestamptz, 'srnc1alzp1g5zzwkyulsrncamz681524', NULL, 20.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/2feb38336c0001e18b75adf5cf57db1591e6d476e712643a3399a41d591409cc/IMG_3398.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Pablo Lozano @ 2026-02-13
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Pablo') AND LOWER(TRIM(last_name)) = LOWER('Lozano') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-13T12:57:18'::timestamptz, 'lii95vndh93iohzeuvvlii95vnn6vdwk', 64.0, 12.0, NULL, 7, NULL, 9, 'Fase 1', FALSE, 'Mejor', NULL, 'Dificultad: No comer hidratos', ARRAY['https://api.typeform.com/responses/files/baed29ecaa11874824f8611f913ff45ca441e80f6b2dc06a51c18f7a4bed0d60/IMG_2776.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Santiago Arce @ 2026-02-13
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Santiago') AND LOWER(TRIM(last_name)) = LOWER('Arce') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-13T02:14:59'::timestamptz, '6vdynsz5v58120a7ldeof6vdynszuxny', 80.0, 30.0, NULL, 7, NULL, 9, 'Fase 1', TRUE, 'Igual', NULL, 'Dificultad: La comida', ARRAY['https://api.typeform.com/responses/files/e0277b7a2a9d9b5fc42373e5f0251a18b783a1bbd47ec9864e0869de1bb04167/IMG_2366.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Tomás Rodríguez @ 2026-01-09
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Tomás') AND (LOWER(TRIM(last_name)) = LOWER('Rodríguez Roche') OR LOWER(TRIM(last_name)) LIKE LOWER('Rodríguez%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-09T21:47:20'::timestamptz, 'cp230jqyu423wedncp2tpsyf79gb103e', NULL, 21.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/acd1ae58cd85f309e50121aa97a8b4e5d9767140e932f5b96b6b8662550b979c/20260107_124905.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Tomás Rodríguez @ 2026-01-07
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Tomás') AND (LOWER(TRIM(last_name)) = LOWER('Rodríguez Roche') OR LOWER(TRIM(last_name)) LIKE LOWER('Rodríguez%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-07T14:07:41'::timestamptz, '2dwps0g6w3gf30cropjj2dwps0lfng2d', NULL, 23.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/0589c8bdb7953ae2790bd7eff8b550c8d450c83e5934e78d9f3a83523e567ede/20260107_124905.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Tomás Rodríguez @ 2025-12-26
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Tomás') AND (LOWER(TRIM(last_name)) = LOWER('Rodríguez Roche') OR LOWER(TRIM(last_name)) LIKE LOWER('Rodríguez%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-26T16:38:45'::timestamptz, '5bba624ue7ou97hx0kj5bba6jau958tv', NULL, 24.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/35eb23da2dd229a08d8fef82082064e7cbec5d700379593a536fbc06df5430d5/20251226_170834.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Tomás Rodríguez @ 2025-12-20
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Tomás') AND (LOWER(TRIM(last_name)) = LOWER('Rodríguez Roche') OR LOWER(TRIM(last_name)) LIKE LOWER('Rodríguez%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-20T11:15:50'::timestamptz, 'nw59jiw5nywasf9g4phrzjnw59jwjg1g', NULL, 23.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/3af92625d0f58e527e54401050fa3e158a01c2d8054c440820c159b64d83b905/20251220_121236.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Tomás Enrique Rodríguez @ 2025-12-02
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Tomás Enrique') AND (LOWER(TRIM(last_name)) = LOWER('Rodríguez Roche') OR LOWER(TRIM(last_name)) LIKE LOWER('Rodríguez%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-02T21:00:55'::timestamptz, '9zeml44zz99nrosw1sjeb9zeml44i7xm', NULL, 24.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/fc30605ffed4ca368afe188c344728697927f25a0de88e4634e2b5d4f105c939/20251202_215944.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Victor Recinos @ 2026-01-12
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Victor') AND LOWER(TRIM(last_name)) = LOWER('Recinos') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-01-12T17:19:31'::timestamptz, 'nuc559wfjtaj2ea43zgenuc559wrqr8p', NULL, 20.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/bdecd0a1e318e1b96f4151b36c28613fcc0dfd900145f394c850bcfe24ed3178/IMG_2571.png'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Víctor Blánquez @ 2026-02-01
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Víctor') AND LOWER(TRIM(last_name)) = LOWER('Blánquez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-01T11:06:11'::timestamptz, 'l6qusgdaluvovibf61ael6qusg0oc6qy', 64.0, 11.0, NULL, 6, NULL, 8, 'Fase 1', FALSE, 'Mejor', NULL, 'Dificultad: Hacer el cardio porque han echo muchos días de lluvia pero hemos encontrado el hueco para cumplir con toda la semana', ARRAY['https://api.typeform.com/responses/files/9de2c5d1b79461d85841bdbfa79e7a25940903209fd9ab5dfc7760250ec1dfd3/IMG_4811.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Víctor Blánquez @ 2025-12-27
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Víctor') AND LOWER(TRIM(last_name)) = LOWER('Blánquez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-27T08:06:32'::timestamptz, '8v0df07dija17i39n8v0kjrxyxgzetrj', NULL, 12.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/3fc3e3a0fc9ee571ae6e47a7fce3d8f83d8e86081fbcaf0a247a6a9c257d80a3/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Víctor Blánquez @ 2025-12-20
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Víctor') AND LOWER(TRIM(last_name)) = LOWER('Blánquez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-20T12:25:33'::timestamptz, 'd98ularh5iezydkoyd9isxk6pebahjr1', NULL, 12.0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/b87747c6e1126b6c74c759372dfc0c274d252718337207d6f082220000281c72/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Víctor Blánquez @ 2025-12-04
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Víctor') AND LOWER(TRIM(last_name)) = LOWER('Blánquez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2025-12-04T09:38:56'::timestamptz, '73v7oji3w0e6lss3353t73v7ojiaf3cd', NULL, 14.0, NULL, NULL, NULL, NULL, 'Fase 2', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/24d6fbdeebbe981175a48c25c0a7b0d799f807b2e60fb0eb3b196ac65512739c/B6CDC79B_F8FB_46AF_B51E_18A1C56847D6.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Elvis Rodríguez @ 2026-02-16
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Elvis') AND LOWER(TRIM(last_name)) = LOWER('Rodríguez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-16T14:25:03'::timestamptz, 'c5liccipv5dldz8c5lice1ij357w6djk', 81.0, 17.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', 'Pérdida de control: tres tardes estuve comiendo pan dulce con cafe por reuniones con amigos en cafeterías', ARRAY['https://api.typeform.com/responses/files/22802cc9953c6cfbc5d3d209f6aae4fcdafbd1abfc74db2bec81e9b8d29dc02b/IMG_1447.HEIC'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Mauro Gonzalez @ 2026-02-16
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Mauro') AND LOWER(TRIM(last_name)) = LOWER('Gonzalez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-16T20:47:36'::timestamptz, '8cu1zdqgsm0x3cxww8lcdmwe28cu1zdl', 71.0, 13.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', 'Pérdida de control: Comida fuera de casa por trabajo', ARRAY['https://api.typeform.com/responses/files/1bd165c8de722d7dc840c3eb5fa553086f46d88b182e29cea03ace124d255301/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Víctor Blánquez @ 2026-02-17
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Víctor') AND LOWER(TRIM(last_name)) = LOWER('Blánquez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-17T07:41:06'::timestamptz, '5tq88maboe50t6e485tq88md3cr6zn09', 62.0, 11.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', 'Pérdida de control: Al tener pareja y ella no darle tanta importancia a lo que come es más fácil dejarse llevar', ARRAY['https://api.typeform.com/responses/files/2081fbdb1b0ab574c3e93d9bfc3ae9006809931e5dea6d772f7fdedb1dbd0189/IMG_4985.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Héctor Emilio Flores @ 2026-02-19
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Héctor Emilio') AND LOWER(TRIM(last_name)) = LOWER('Flores') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-19T02:01:44'::timestamptz, 'spkwi3zogsrppdbn4bmfa5y2spkwi3z2', 80.0, 23.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/4cd9b18efcc27b9ffc9efc35c3c34cc5f50c2f00ef5b369a6bd1554d858c1b35/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Juan Pablo Cordero @ 2026-02-19
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Juan Pablo') AND (LOWER(TRIM(last_name)) = LOWER('Cordero Chávez') OR LOWER(TRIM(last_name)) LIKE LOWER('Cordero%')) LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-19T12:54:22'::timestamptz, 'vw1uvcgq1ow4ym9dbuqvw1uvehnkpc33', NULL, NULL, 7, NULL, 8, NULL, 'Acabo de entrar', NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jesús Demuner @ 2026-02-22
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jesús') AND LOWER(TRIM(last_name)) = LOWER('Demuner') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-22T03:01:24'::timestamptz, 'xgu8h9k7h0fhy2slsxgu8h9kc6x1klp7', 73.0, 19.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/dc4f3304af6d3dc29c5ec5c661fcae44fc1870e4a496054811f34e8368de665d/IMG_4926.HEIC'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Carlos Rivera @ 2026-02-22
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Carlos') AND LOWER(TRIM(last_name)) = LOWER('Rivera') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-22T15:44:06'::timestamptz, 't9q4yiuupqe4t9lvkt9q7i39ux7dvkr7', 76.0, 24.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', NULL, ARRAY['https://api.typeform.com/responses/files/a7c7934611c5bc85500320491251da546ca74487eef6560ad863e26d6a7fe3b9/IMG_4999.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Guillem Ribas @ 2026-02-27
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Guillem') AND LOWER(TRIM(last_name)) = LOWER('Ribas') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-27T11:43:17'::timestamptz, '47kcbqhu053cznm2r747kcb9fwwidwop', 64.0, 18.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', NULL, ARRAY['https://api.typeform.com/responses/files/8d11ae0e801090b359ed28eea64850396cb11b49d0e12feaae2ad8b0a6a5e255/IMG_3801.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Leonel Vizcaino @ 2026-02-27
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('leonel') AND LOWER(TRIM(last_name)) = LOWER('vizcaino') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-27T14:47:33'::timestamptz, 'j0bvz17v4mkli5vae3xij0bvx6opsvyo', 89.0, 16.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/08262cc4e7c48c4345c896de83bec8c4b1bace68dbe449d6da09d05e0b428df1/image.jpg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
  -- Jesus Marquez @ 2026-02-27
  SELECT id INTO v_client_id FROM clients WHERE LOWER(TRIM(first_name)) = LOWER('Jesus') AND LOWER(TRIM(last_name)) = LOWER('Marquez') LIMIT 1;
  IF v_client_id IS NOT NULL THEN
    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
    VALUES (v_client_id, '2026-02-27T18:05:56'::timestamptz, 'sofnx6829fto9hsofnxd26j2rq5xu7kw', 71.0, 20.0, NULL, 5, NULL, 5, 'Fase 1', TRUE, 'Mejor', NULL, 'Dificultad: Intimida mala concentración inestable pensamiento negativo', ARRAY['https://api.typeform.com/responses/files/0028684f739878884c0365d6ea013ddf3c931099a1be490a9cef5b611aa1c575/IMG_6888.jpeg'])
    ON CONFLICT (typeform_response_id) DO NOTHING;
  END IF;
END $$;
-- ============================================
-- DONE
-- ============================================
