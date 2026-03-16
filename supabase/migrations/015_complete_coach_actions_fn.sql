-- Function to mark coach actions as completed, bypassing RLS
CREATE OR REPLACE FUNCTION complete_coach_actions(call_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE calls
  SET coach_actions_completed = true
  WHERE id = call_id;
END;
$$;
