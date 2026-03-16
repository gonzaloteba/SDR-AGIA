'use server'

import { revalidatePath } from 'next/cache'
import { getAdminClient } from '@/lib/supabase/admin'

export async function updateClientEndDate(clientId: string, endDate: string) {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('clients')
    .update({ end_date: endDate })
    .eq('id', clientId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients', 'layout')
  revalidatePath('/dashboard', 'layout')

  return { success: true }
}

export async function toggleClientBadge(
  clientId: string,
  badge: 'is_renewed' | 'is_success_case',
  value: boolean
) {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from('clients')
    .update({ [badge]: value })
    .eq('id', clientId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clients', 'layout')
  revalidatePath('/dashboard', 'layout')

  return { success: true }
}

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
