'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, User, Trash2, Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { createUser, deleteUser, updateUserRole } from './actions'
import type { Coach, UserRole } from '@/lib/types'

interface Props {
  users: Coach[]
  currentUserId: string
}

export function UsersPanel({ users, currentUserId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* User list */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-medium">Usuarios registrados</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
        </div>

        {showForm && (
          <div className="border-b px-6 py-4">
            <CreateUserForm
              onSuccess={() => {
                setShowForm(false)
                toast('Usuario creado correctamente', 'success')
                router.refresh()
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <div className="divide-y">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {user.role === 'admin' ? (
                    <Shield className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Creado: {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user.id === currentUserId ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Tu cuenta
                  </span>
                ) : (
                  <>
                    <RoleToggle userId={user.id} currentRole={user.role} />
                    {confirmDeleteId === user.id ? (
                      <ConfirmDelete
                        userId={user.id}
                        userName={user.full_name}
                        onDone={(ok) => {
                          setConfirmDeleteId(null)
                          if (ok) {
                            toast('Usuario eliminado', 'success')
                            router.refresh()
                          }
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No hay usuarios registrados
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Create User Form ──────────────────────────────────────────────────
function CreateUserForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('coach')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createUser(email, password, fullName, role)
      if (result.success) {
        onSuccess()
      } else {
        toast(result.error || 'Error al crear usuario', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre completo</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Nombre Apellido"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="usuario@ejemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contrasena</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Min. 6 caracteres"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear usuario
        </button>
      </div>
    </form>
  )
}

// ── Role Toggle ───────────────────────────────────────────────────────
function RoleToggle({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(newRole: UserRole) {
    if (newRole === currentRole) return
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if (result.success) {
        toast('Rol actualizado', 'success')
        router.refresh()
      } else {
        toast(result.error || 'Error al actualizar rol', 'error')
      }
    })
  }

  return (
    <select
      value={currentRole}
      onChange={(e) => handleChange(e.target.value as UserRole)}
      disabled={isPending}
      className="rounded-lg border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
    >
      <option value="coach">Coach</option>
      <option value="admin">Admin</option>
    </select>
  )
}

// ── Confirm Delete ────────────────────────────────────────────────────
function ConfirmDelete({
  userId,
  userName,
  onDone,
}: {
  userId: string
  userName: string
  onDone: (deleted: boolean) => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.success) {
        onDone(true)
      } else {
        toast(result.error || 'Error al eliminar usuario', 'error')
        onDone(false)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-red-600">Eliminar a {userName}?</span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Si'}
      </button>
      <button
        onClick={() => onDone(false)}
        disabled={isPending}
        className="rounded-lg border px-2 py-1 text-xs font-medium hover:bg-muted transition-colors"
      >
        No
      </button>
    </div>
  )
}
