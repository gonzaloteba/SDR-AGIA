'use server'

import { revalidatePath } from 'next/cache'
import { getAdminClient } from '@/lib/supabase/admin'
import { updateEndDateSchema, toggleBadgeSchema, callIdSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'

const log = logger('actions:client')

function revalidateDashboard() {
  revalidatePath('/dashboard/clients', 'layout')
  revalidatePath('/dashboard', 'layout')
}

export async function updateClientEndDate(clientId: string, endDate: string) {
  const parsed = updateEndDateSchema.safeParse({ clientId, endDate })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('clients')
      .update({ end_date: parsed.data.endDate })
      .eq('id', parsed.data.clientId)

    if (error) {
      log.error('Failed to update end date', { clientId, error: error.message })
      return { success: false, error: error.message }
    }

    revalidateDashboard()
    return { success: true }
  } catch (e) {
    log.error('Unexpected error updating end date', { clientId, error: (e as Error).message })
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleClientBadge(
  clientId: string,
  badge: 'is_renewed' | 'is_success_case',
  value: boolean
) {
  const parsed = toggleBadgeSchema.safeParse({ clientId, badge, value })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('clients')
      .update({ [parsed.data.badge]: parsed.data.value })
      .eq('id', parsed.data.clientId)

    if (error) {
      log.error('Failed to toggle badge', { clientId, badge, error: error.message })
      return { success: false, error: error.message }
    }

    revalidateDashboard()
    return { success: true }
  } catch (e) {
    log.error('Unexpected error toggling badge', { clientId, error: (e as Error).message })
    return { success: false, error: 'Error inesperado' }
  }
}

export async function completeCoachActions(callId: string) {
  const parsed = callIdSchema.safeParse(callId)
  if (!parsed.success) {
    return { success: false, error: 'Invalid call ID' }
  }

  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('calls')
      .update({ coach_actions_completed: true })
      .eq('id', parsed.data)

    if (error) {
      log.error('Failed to complete coach actions', { callId, error: error.message })
      return { success: false, error: error.message }
    }

    revalidateDashboard()
    return { success: true }
  } catch (e) {
    log.error('Unexpected error completing actions', { callId, error: (e as Error).message })
    return { success: false, error: 'Error inesperado' }
  }
}
