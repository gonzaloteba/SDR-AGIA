-- Migration: 007_typeform_integration.sql
-- Adds columns needed for real Typeform form integration
-- Check-In form (Q7cGBOIU) → check_ins table
-- Auditoría Inicial form (WLlcHS3L) → clients table

-- ============================================
-- STEP 1: New check_ins columns
-- ============================================
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS craving_details TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS carb_performance TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS post_carb_symptoms TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS carb_strategy TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS loss_of_control BOOLEAN;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS loss_of_control_detail TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS protocol_adherence TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS daily_energy TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS difficulties TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS unused_optimizers TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS unused_supplements TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS main_limiter TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS priority_objective TEXT;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS sleep_hours TEXT;

-- ============================================
-- STEP 2: New clients columns (auditoría data)
-- ============================================

-- Sueño
ALTER TABLE clients ADD COLUMN IF NOT EXISTS wake_time TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bed_time TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sleep_quality_initial INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS wakes_at_night BOOLEAN;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS feels_rested BOOLEAN;

-- Trabajo
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_schedule TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_modality TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_activity_level TEXT;

-- Entrenamiento (extended)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_time TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_location TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_cardio TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS trains_fasted BOOLEAN;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_notes TEXT;

-- Alimentación
ALTER TABLE clients ADD COLUMN IF NOT EXISTS meals_per_day TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_meal_time TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dinner_time TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS night_hunger BOOLEAN;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS coffee_intake TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS food_intolerances TEXT;

-- Energía
ALTER TABLE clients ADD COLUMN IF NOT EXISTS energy_dips TEXT;

-- Fields referenced in types.ts but missing from migrations
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_event BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sleep_hours_avg DECIMAL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS energy_level_initial INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stress_level_initial INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS diagnosis_detail TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_submitted_at TIMESTAMPTZ;

-- ============================================
-- STEP 3: RLS policy for service_role updates
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can update clients'
  ) THEN
    CREATE POLICY "Service role can update clients" ON clients
      FOR UPDATE TO service_role USING (true);
  END IF;
END $$;
