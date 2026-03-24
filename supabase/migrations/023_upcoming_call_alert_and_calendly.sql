-- =============================================
-- Add upcoming_call alert type + Calendly fields on calls
-- =============================================

-- 1. Allow 'upcoming_call' and 'birthday' in alerts.type check constraint
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_type_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_type_check CHECK (type IN (
  'missed_checkin', 'phase_change', 'renewal_approaching',
  'training_plan_expiring', 'no_call_logged', 'onboarding_incomplete',
  'program_ending', 'birthday', 'upcoming_call'
));

-- 2. Add calendly_event_uri to calls (stores Calendly event URL for reference)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS calendly_event_uri TEXT;

-- 3. Add scheduled_at to calls (full timestamp for scheduled calls from Calendly)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- 4. Index for upcoming scheduled calls lookup
CREATE INDEX IF NOT EXISTS idx_calls_scheduled_at
  ON calls (scheduled_at)
  WHERE scheduled_at IS NOT NULL;
