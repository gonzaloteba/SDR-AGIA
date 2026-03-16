'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completeCoachActions(callId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('complete_coach_actions', {
    call_id: callId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients', 'layout')
  revalidatePath('/dashboard', 'layout')

  return { success: true }
}
