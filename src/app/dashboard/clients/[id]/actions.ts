'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completeCoachActions(callId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('calls')
    .update({ coach_actions_completed: true })
    .eq('id', callId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}
