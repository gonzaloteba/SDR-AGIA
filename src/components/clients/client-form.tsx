'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Client } from '@/lib/types'

interface ClientFormProps {
  client?: Client
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const isEditing = !!client
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const startDate = formData.get('start_date') as string
    const planType = formData.get('plan_type') as string
    const planMonths: Record<string, number> = {
      '3_months': 3, '4_months': 4, '6_months': 6, '12_months': 12,
    }
    const months = planMonths[planType] || 3
    const start = new Date(startDate)
    const end = new Date(start)
    end.setMonth(end.getMonth() + months)
    const endDate = end.toISOString().split('T')[0]

    const data = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      timezone: formData.get('timezone') as string,
      start_date: startDate,
      end_date: endDate,
      renewal_date: endDate,
      plan_type: planType,
      closer: (formData.get('closer') as string) || null,
      drive_folder_url: (formData.get('drive_folder_url') as string) || null,
      status: (formData.get('status') as string) || 'active',
      current_phase: parseInt(formData.get('current_phase') as string) || 1,
    }

    const supabase = createClient()

    if (isEditing) {
      const { error: err } = await supabase
        .from('clients')
        .update(data)
        .eq('id', client.id)
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
    } else {
      const { error: err } = await supabase.from('clients').insert(data)
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard/clients')
    router.refresh()
  }

  const inputClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Nombre *</label>
          <input
            name="first_name"
            defaultValue={client?.first_name}
            required
            className={inputClass}
            placeholder="Nombre"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Apellido *</label>
          <input
            name="last_name"
            defaultValue={client?.last_name}
            required
            className={inputClass}
            placeholder="Apellido"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={client?.email || ''}
            className={inputClass}
            placeholder="email@ejemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Teléfono</label>
          <input
            name="phone"
            defaultValue={client?.phone || ''}
            className={inputClass}
            placeholder="+52 ..."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Fecha de inicio *</label>
          <input
            name="start_date"
            type="date"
            defaultValue={client?.start_date}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Plan *</label>
          <select
            name="plan_type"
            defaultValue={client?.plan_type || '3_months'}
            className={inputClass}
          >
            <option value="3_months">3 Meses</option>
            <option value="4_months">4 Meses</option>
            <option value="6_months">6 Meses</option>
            <option value="12_months">12 Meses</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Zona horaria</label>
          <select
            name="timezone"
            defaultValue={client?.timezone || 'America/Mexico_City'}
            className={inputClass}
          >
            <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
            <option value="America/Mazatlan">Los Cabos / Mazatlán (UTC-7)</option>
            <option value="America/Cancun">Cancún (UTC-5)</option>
            <option value="America/Bogota">Bogotá (UTC-5)</option>
            <option value="America/Santo_Domingo">República Dominicana (UTC-4)</option>
            <option value="America/Lima">Lima (UTC-5)</option>
            <option value="America/Santiago">Santiago (UTC-3)</option>
            <option value="America/Buenos_Aires">Buenos Aires (UTC-3)</option>
            <option value="Europe/Madrid">Madrid (UTC+1)</option>
            <option value="Atlantic/Canary">Canarias (UTC+0)</option>
            <option value="America/New_York">Nueva York (UTC-5)</option>
            <option value="America/Los_Angeles">Los Ángeles (UTC-8)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Closer</label>
          <input
            name="closer"
            defaultValue={client?.closer || ''}
            className={inputClass}
            placeholder="Nombre del closer"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Carpeta de Drive</label>
        <input
          name="drive_folder_url"
          type="url"
          defaultValue={client?.drive_folder_url || ''}
          className={inputClass}
          placeholder="https://drive.google.com/..."
        />
      </div>

      {isEditing && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">Estado</label>
            <select
              name="status"
              defaultValue={client.status}
              className={inputClass}
            >
              <option value="active">Activo</option>
              <option value="completed">Concluido</option>
              <option value="renewed">Renovado</option>
              <option value="cancelled">Cancelado</option>
              <option value="success_case">Caso de Éxito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Fase actual</label>
            <select
              name="current_phase"
              defaultValue={client.current_phase}
              className={inputClass}
            >
              <option value="1">Fase 1 - Detox</option>
              <option value="2">Fase 2 - Reintroducción</option>
              <option value="3">Fase 3 - Low-Carb Flexible</option>
            </select>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear cliente'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 items-center rounded-md border px-6 text-sm font-medium hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
