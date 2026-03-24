-- Assign all clients with NULL coach_id to Antonio Tirado (db4b2870-a7a4-4352-bcd7-02dc533d6866)
-- This fixes clients that were created before DEFAULT_COACH_ID was configured

UPDATE public.clients
SET coach_id = 'db4b2870-a7a4-4352-bcd7-02dc533d6866'
WHERE coach_id IS NULL;

-- Also assign orphaned calls
UPDATE public.calls
SET coach_id = 'db4b2870-a7a4-4352-bcd7-02dc533d6866'
WHERE coach_id IS NULL;
