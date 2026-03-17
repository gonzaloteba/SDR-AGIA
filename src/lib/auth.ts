import { createClient } from '@/lib/supabase/server'
import type { Coach } from '@/lib/types'

/**
 * Get the currently authenticated coach.
 * Returns the coach record (id, full_name, role) or null if not found.
 */
export async function getCurrentCoach(): Promise<Coach | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return null

    const { data: coach, error: queryError } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', user.id)
      .single()

    if (queryError || !coach) return null

    return coach
  } catch {
    return null
  }
}

/**
 * Check if a coach has admin role.
 */
export function isAdmin(coach: Coach): boolean {
  return coach.role === 'admin'
}
