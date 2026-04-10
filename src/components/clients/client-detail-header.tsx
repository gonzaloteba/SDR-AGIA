'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, Edit, Pencil, Check, X, Loader2, FileDown, Trash2 } from 'lucide-react'
import { PHASE_LABELS, BADGE_CONFIG } from '@/lib/constants'
import { getDaysRemaining } from '@/lib/health-score'
import { StatusDropdown } from '@/components/clients/status-dropdown'
import { updateClientEndDate, toggleClientBadge, deleteClient } from '@/app/dashboard/clients/[id]/actions'
import { cn, toTitleCase } from '@/lib/utils'
import type { Client, NutritionPhase } from '@/lib/types'

interface ClientDetailHeaderProps {
  client: Client
  alertCount: number
}

export function ClientDetailHeader({ client, alertCount }: ClientDetailHeaderProps) {
  const daysRemaining = getDaysRemaining(client.end_date)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [endDateValue, setEndDateValue] = useState(client.end_date)
  const [isRenewed, setIsRenewed] = useState(client.is_renewed)
  const [isSuccessCase, setIsSuccessCase] = useState(client.is_success_case)
  const [togglingBadge, setTogglingBadge] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const coachParam = searchParams.get('coach')
  const coachSuffix = coachParam ? `?coach=${coachParam}` : ''

  // Sync local state when server props update (after router.refresh)
  useEffect(() => { setIsRenewed(client.is_renewed) }, [client.is_renewed])
  useEffect(() => { setIsSuccessCase(client.is_success_case) }, [client.is_success_case])

  async function handleSave() {
    setSaving(true)
    const result = await updateClientEndDate(client.id, endDateValue)
    if (result.success) {
      setEditing(false)
      router.refresh()
    }
    setSaving(false)
  }

  function handleCancel() {
    setEndDateValue(client.end_date)
    setEditing(false)
  }

  async function handleToggleBadge(badge: 'is_renewed' | 'is_success_case') {
    const currentValue = badge === 'is_renewed' ? isRenewed : isSuccessCase
    const newValue = !currentValue

    // Optimistic update
    if (badge === 'is_renewed') setIsRenewed(newValue)
    else setIsSuccessCase(newValue)

    setTogglingBadge(badge)
    const result = await toggleClientBadge(client.id, badge, newValue)
    if (!result.success) {
      // Revert on failure
      if (badge === 'is_renewed') setIsRenewed(currentValue)
      else setIsSuccessCase(currentValue)
    } else {
      router.refresh()
    }
    setTogglingBadge(null)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteClient(client.id)
    if (result.success) {
      router.push(`/dashboard/clients${coachSuffix}`)
    } else {
      alert(result.error || 'Error al eliminar el cliente')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/clients${coachSuffix}`}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {toTitleCase(client.first_name)} {toTitleCase(client.last_name)}
              </h1>
              <StatusDropdown
                clientId={client.id}
                currentStatus={client.status}
                size="md"
              />
              {isRenewed && (
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', BADGE_CONFIG.renewed.colors)}>
                  {BADGE_CONFIG.renewed.label}
                </span>
              )}
              {isSuccessCase && (
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', BADGE_CONFIG.success_case.colors)}>
                  {BADGE_CONFIG.success_case.label}
                </span>
              )}
              {alertCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {alertCount} alerta{alertCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{PHASE_LABELS[client.current_phase as NutritionPhase]}</span>
              {editing ? (
                <span className="inline-flex items-center gap-2">
                  <input
                    type="date"
                    value={endDateValue}
                    onChange={(e) => setEndDateValue(e.target.value)}
                    className="rounded border px-2 py-0.5 text-xs"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <span>{daysRemaining} días restantes</span>
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              <span>
                Inicio: {new Date(client.start_date + 'T12:00:00').toLocaleDateString('es-ES')}
              </span>
              {client.location && <span>{client.location}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setGeneratingPdf(true)
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 60_000)

              try {
                const res = await fetch(`/api/clients/${client.id}/plan-pdf`, {
                  method: 'POST',
                  signal: controller.signal,
                })
                if (!res.ok) {
                  const err = await res.json()
                  alert(err.error || 'Error al generar el PDF')
                  return
                }
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `Plan Alimentacion - ${toTitleCase(client.first_name)} ${toTitleCase(client.last_name)}.pdf`
                a.click()
                URL.revokeObjectURL(url)
              } catch (err) {
                if ((err as Error).name === 'AbortError') {
                  alert('La generación del PDF tardó demasiado. Intenta de nuevo.')
                } else {
                  alert('Error de conexión al generar el PDF')
                }
              } finally {
                clearTimeout(timeoutId)
                setGeneratingPdf(false)
              }
            }}
            disabled={generatingPdf}
            className="inline-flex items-center gap-1.5 rounded-md border bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generatingPdf ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileDown className="h-3 w-3" />
            )}
            {generatingPdf ? 'Generando...' : 'Plan PDF'}
          </button>
          {client.drive_folder_url && (
            <a
              href={client.drive_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <ExternalLink className="h-3 w-3" />
              Drive
            </a>
          )}
          <Link
            href={`/dashboard/clients/${client.id}/edit${coachSuffix}`}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Edit className="h-3 w-3" />
            Editar
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Eliminar cliente</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Se eliminará a <strong>{toTitleCase(client.first_name)} {toTitleCase(client.last_name)}</strong> y todos sus datos asociados (check-ins, llamadas, alertas, planes). Esta acción no se puede deshacer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact info + Badge toggles */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-6 text-sm">
          {client.email && (
            <span className="text-muted-foreground">
              Email: <span className="text-foreground">{client.email}</span>
            </span>
          )}
          {client.phone && (
            <span className="text-muted-foreground">
              Tel: <span className="text-foreground">{client.phone}</span>
            </span>
          )}
          {client.closer && (
            <span className="text-muted-foreground">
              Closer: <span className="text-foreground">{client.closer}</span>
            </span>
          )}
          {client.renewal_date && (
            <span className="text-muted-foreground">
              Renovación: <span className="text-foreground">
                {new Date(client.renewal_date + 'T12:00:00').toLocaleDateString('es-ES')}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleBadge('is_renewed')}
            disabled={togglingBadge === 'is_renewed'}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              isRenewed
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-muted/50 text-muted-foreground border-dashed hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300',
              togglingBadge === 'is_renewed' && 'opacity-50'
            )}
          >
            {togglingBadge === 'is_renewed' ? '...' : isRenewed ? '✓ Renovado' : 'Renovado'}
          </button>
          <button
            onClick={() => handleToggleBadge('is_success_case')}
            disabled={togglingBadge === 'is_success_case'}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              isSuccessCase
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : 'bg-muted/50 text-muted-foreground border-dashed hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300',
              togglingBadge === 'is_success_case' && 'opacity-50'
            )}
          >
            {togglingBadge === 'is_success_case' ? '...' : isSuccessCase ? '✓ Caso de Éxito' : 'Caso de Éxito'}
          </button>
        </div>
      </div>
    </div>
  )
}
