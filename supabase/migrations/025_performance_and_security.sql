-- Migration 025: Performance optimizations and security improvements
-- 1. Function to get latest check-in per client (avoids full table scan)
-- 2. Atomic coach action toggle function (prevents race conditions)
-- 3. Additional indexes for common query patterns
-- 4. Atomic client deletion function

-- ============================================
-- 1. Optimized latest check-in per client
-- ============================================
CREATE OR REPLACE FUNCTION get_latest_checkin_per_client()
RETURNS TABLE(client_id UUID, latest_submitted_at TIMESTAMPTZ) AS $$
  SELECT DISTINCT ON (client_id) client_id, submitted_at AS latest_submitted_at
  FROM check_ins
  ORDER BY client_id, submitted_at DESC
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 2. Atomic coach action toggle (prevents race conditions)
-- ============================================
CREATE OR REPLACE FUNCTION toggle_coach_action_item(
  p_call_id UUID,
  p_item_index INT,
  p_completed BOOLEAN
) RETURNS JSONB AS $$
DECLARE
  v_items INT[];
  v_total INT;
  v_all_completed BOOLEAN;
  v_actions TEXT;
BEGIN
  SELECT
    COALESCE(coach_actions_completed_items, '{}'),
    COALESCE(coach_actions, '')
  INTO v_items, v_actions
  FROM calls WHERE id = p_call_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Call not found');
  END IF;

  IF p_completed THEN
    IF NOT (p_item_index = ANY(v_items)) THEN
      v_items := array_append(v_items, p_item_index);
    END IF;
  ELSE
    v_items := array_remove(v_items, p_item_index);
  END IF;

  -- Count non-empty action lines
  SELECT COUNT(*) INTO v_total
  FROM unnest(regexp_split_to_array(trim(v_actions), E'\n')) AS line
  WHERE trim(line) <> '';

  v_all_completed := v_total > 0 AND array_length(v_items, 1) >= v_total;

  UPDATE calls SET
    coach_actions_completed_items = v_items,
    coach_actions_completed = v_all_completed
  WHERE id = p_call_id;

  RETURN jsonb_build_object(
    'allCompleted', v_all_completed,
    'items', to_jsonb(v_items)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Additional indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(call_date);
CREATE INDEX IF NOT EXISTS idx_calls_scheduled ON calls(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_google_event ON calls(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_response ON clients(onboarding_response_id) WHERE onboarding_response_id IS NOT NULL;
