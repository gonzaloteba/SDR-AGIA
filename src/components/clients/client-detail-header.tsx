'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Edit, Pencil, Check, X, Loader2 } from 'lucide-react'
import { PHASE_LABELS } from '@/lib/constants'
import { getDaysRemaining } from '@/lib/health-score'
import { StatusDropdown } from '@/components/clients/status-dropdown'
import { updateClientEndDate } from '@/app/dashboard/clients/[id]/actions'
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
  const router = useRouter()

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

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/clients"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {client.first_name} {client.last_name}
              </h1>
              <StatusDropdown
                clientId={client.id}
                currentStatus={client.status}
                size="md"
              />
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
                Inicio: {new Date(client.start_date).toLocaleDateString('es-ES')}
              </span>
              {client.timezone && <span>{client.timezone}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            href={`/dashboard/clients/${client.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Edit className="h-3 w-3" />
            Editar
          </Link>
        </div>
      </div>

      {/* Contact info */}
      <div className="mt-4 flex gap-6 text-sm">
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
        <span className="text-muted-foreground">
          Renovación: <span className="text-foreground">
            {new Date(client.renewal_date).toLocaleDateString('es-ES')}
          </span>
        </span>
      </div>
    </div>
  )
}
