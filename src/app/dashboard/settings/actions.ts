'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { getCurrentCoach, isAdmin } from '@/lib/auth'
import type { Coach, UserRole } from '@/lib/types'

// ── List all coaches ──────────────────────────────────────────────────
export async function getUsers(): Promise<{ users: Coach[]; error: string | null }> {
  const coach = await getCurrentCoach()
  if (!coach || !isAdmin(coach)) {
    return { users: [], error: 'No autorizado' }
  }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('coaches')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return { users: [], error: error.message }
  return { users: data as Coach[], error: null }
}

// ── Create user ───────────────────────────────────────────────────────
export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<{ success: boolean; error: string | null }> {
  const coach = await getCurrentCoach()
  if (!coach || !isAdmin(coach)) {
    return { success: false, error: 'No autorizado' }
  }

  if (!email || !password || !fullName) {
    return { success: false, error: 'Todos los campos son obligatorios' }
  }

  if (password.length < 6) {
    return { success: false, error: 'La contrasena debe tener al menos 6 caracteres' }
  }

  const admin = getAdminClient()

  // Create auth user via Supabase Admin API
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      return { success: false, error: 'Ya existe un usuario con ese email' }
    }
    return { success: false, error: authError.message }
  }

  // Insert into coaches table
  const { error: insertError } = await admin.from('coaches').insert({
    id: authData.user.id,
    full_name: fullName,
    role,
  })

  if (insertError) {
    // Rollback: delete the auth user if coach insert fails
    await admin.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: `Error al crear perfil de coach: ${insertError.message}` }
  }

  return { success: true, error: null }
}

// ── Delete user ───────────────────────────────────────────────────────
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const coach = await getCurrentCoach()
  if (!coach || !isAdmin(coach)) {
    return { success: false, error: 'No autorizado' }
  }

  if (userId === coach.id) {
    return { success: false, error: 'No puedes eliminarte a ti mismo' }
  }

  const admin = getAdminClient()

  // Delete from coaches table first
  const { error: deleteCoachError } = await admin
    .from('coaches')
    .delete()
    .eq('id', userId)

  if (deleteCoachError) {
    return { success: false, error: `Error al eliminar coach: ${deleteCoachError.message}` }
  }

  // Delete auth user
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId)

  if (deleteAuthError) {
    return { success: false, error: `Coach eliminado pero error al eliminar cuenta: ${deleteAuthError.message}` }
  }

  return { success: true, error: null }
}

// ── Update user role ──────────────────────────────────────────────────
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error: string | null }> {
  const coach = await getCurrentCoach()
  if (!coach || !isAdmin(coach)) {
    return { success: false, error: 'No autorizado' }
  }

  if (userId === coach.id) {
    return { success: false, error: 'No puedes cambiar tu propio rol' }
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from('coaches')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
