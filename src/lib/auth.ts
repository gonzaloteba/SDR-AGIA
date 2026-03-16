import { createClient } from '@/lib/supabase/server'
import type { Coach } from '@/lib/types'

/**
 * Get the currently authenticated coach.
 * Returns the coach record (id, full_name, role) or null if not found.
 */
export async function getCurrentCoach(): Promise<Coach | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: coach } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', user.id)
    .single()

  return coach
}

/**
 * Build a Supabase query filter that restricts by coach_id.
 * Admins see all clients; coaches only see their own.
 */
export function isAdmin(coach: Coach): boolean {
  return coach.role === 'admin'
}
