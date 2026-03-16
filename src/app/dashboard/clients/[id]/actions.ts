'use server'

import { revalidatePath } from 'next/cache'
import { getAdminClient } from '@/lib/supabase/admin'

export async function completeCoachActions(callId: string) {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('calls')
    .update({ coach_actions_completed: true })
    .eq('id', callId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients', 'layout')
  revalidatePath('/dashboard', 'layout')

  return { success: true }
}
