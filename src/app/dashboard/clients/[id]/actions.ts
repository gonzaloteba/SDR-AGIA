'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { clientIdSchema, updateEndDateSchema, toggleBadgeSchema, callIdSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'

const log = logger('actions:client')

function revalidateDashboard() {
  revalidatePath('/dashboard/clients', 'layout')
  revalidatePath('/dashboard', 'layout')
}

/** Verify the current user owns the given client (or is admin) */
async function authorizeForClient(clientId: string): Promise<{ authorized: true; isAdmin: boolean } | { authorized: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, error: 'No autenticado' }

  // Check coach role
  const adminSupabase = getAdminClient()
  const { data: coach } = await adminSupabase
    .from('coaches')
    .select('role')
    .eq('id', user.id)
    .single()

  if (coach?.role === 'admin') return { authorized: true, isAdmin: true }

  // Verify ownership
  const { data: client } = await adminSupabase
    .from('clients')
    .select('coach_id')
    .eq('id', clientId)
    .single()

  if (!client || client.coach_id !== user.id) {
    return { authorized: false, error: 'No autorizado para este cliente' }
  }

  return { authorized: true, isAdmin: false }
}

export async function updateClientEndDate(clientId: string, endDate: string) {
  const parsed = updateEndDateSchema.safeParse({ clientId, endDate })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const auth = await authorizeForClient(parsed.data.clientId)
  if (!auth.authorized) return { success: false, error: auth.error }

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

  const auth = await authorizeForClient(parsed.data.clientId)
  if (!auth.authorized) return { success: false, error: auth.error }

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

  // Look up which client this call belongs to for authorization
  const adminSupabase = getAdminClient()
  const { data: call } = await adminSupabase
    .from('calls')
    .select('client_id')
    .eq('id', parsed.data)
    .single()

  if (!call) return { success: false, error: 'Llamada no encontrada' }

  const auth = await authorizeForClient(call.client_id)
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    const { error } = await adminSupabase
      .from('calls')
      .update({ coach_actions_completed: true, coach_actions_completed_items: [] })
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

export async function deleteClient(clientId: string) {
  const parsed = clientIdSchema.safeParse(clientId)
  if (!parsed.success) {
    return { success: false, error: 'ID de cliente inválido' }
  }

  const auth = await authorizeForClient(parsed.data)
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    const supabase = getAdminClient()

    // Delete related records first, then the client
    const tables = ['alerts', 'check_ins', 'calls', 'training_plans'] as const
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('client_id', parsed.data)
      if (error) {
        log.error(`Failed to delete ${table} for client`, { clientId, error: error.message })
        return { success: false, error: `Error eliminando ${table}: ${error.message}` }
      }
    }

    const { error } = await supabase.from('clients').delete().eq('id', parsed.data)
    if (error) {
      log.error('Failed to delete client', { clientId, error: error.message })
      return { success: false, error: error.message }
    }

    revalidateDashboard()
    return { success: true }
  } catch (e) {
    log.error('Unexpected error deleting client', { clientId, error: (e as Error).message })
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleCoachActionItem(callId: string, itemIndex: number, completed: boolean) {
  const parsed = callIdSchema.safeParse(callId)
  if (!parsed.success) {
    return { success: false, error: 'Invalid call ID' }
  }

  const adminSupabase = getAdminClient()
  const { data: call } = await adminSupabase
    .from('calls')
    .select('client_id, coach_actions, coach_actions_completed_items')
    .eq('id', parsed.data)
    .single()

  if (!call) return { success: false, error: 'Llamada no encontrada' }

  const auth = await authorizeForClient(call.client_id)
  if (!auth.authorized) return { success: false, error: auth.error }

  try {
    const currentItems: number[] = (call.coach_actions_completed_items as number[]) || []
    let newItems: number[]

    if (completed) {
      newItems = currentItems.includes(itemIndex) ? currentItems : [...currentItems, itemIndex]
    } else {
      newItems = currentItems.filter((i) => i !== itemIndex)
    }

    // Count total action items to check if all are now completed
    const totalActions = (call.coach_actions || '')
      .split('\n')
      .filter((line: string) => line.trim().length > 0).length
    const allCompleted = totalActions > 0 && newItems.length >= totalActions

    const { error } = await adminSupabase
      .from('calls')
      .update({
        coach_actions_completed_items: newItems,
        coach_actions_completed: allCompleted,
      })
      .eq('id', parsed.data)

    if (error) {
      log.error('Failed to toggle coach action item', { callId, itemIndex, error: error.message })
      return { success: false, error: error.message }
    }

    revalidateDashboard()
    return { success: true, allCompleted }
  } catch (e) {
    log.error('Unexpected error toggling action item', { callId, error: (e as Error).message })
    return { success: false, error: 'Error inesperado' }
  }
}
