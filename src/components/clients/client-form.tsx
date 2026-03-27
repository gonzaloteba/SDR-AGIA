'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { inputClass } from '@/lib/utils'
import { clientFormSchema } from '@/lib/validations'
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

    const rawData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      timezone: formData.get('timezone') as string,
      start_date: formData.get('start_date') as string,
      plan_type: formData.get('plan_type') as string,
      closer: (formData.get('closer') as string) || null,
      drive_folder_url: (formData.get('drive_folder_url') as string) || null,
      status: (formData.get('status') as string) || 'active',
      current_phase: parseInt(formData.get('current_phase') as string) || 1,
      birth_date: (formData.get('birth_date') as string) || null,
      height_cm: formData.get('height_cm') ? parseInt(formData.get('height_cm') as string) : null,
      initial_weight_kg: formData.get('initial_weight_kg') ? parseFloat(formData.get('initial_weight_kg') as string) : null,
      initial_body_fat_pct: formData.get('initial_body_fat_pct') ? parseFloat(formData.get('initial_body_fat_pct') as string) : null,
      location: (formData.get('location') as string) || null,
      training_level: (formData.get('training_level') as string) || null,
      motivation: (formData.get('motivation') as string) || null,
      medical_notes: (formData.get('medical_notes') as string) || null,
      goals: (formData.get('goals') as string) || null,
    }

    const parsed = clientFormSchema.safeParse(rawData)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      setError(firstError.message)
      setLoading(false)
      return
    }

    const planMonths: Record<string, number> = {
      '3_months': 3, '4_months': 4, '6_months': 6, '12_months': 12,
    }
    const months = planMonths[parsed.data.plan_type] || 3
    const start = new Date(parsed.data.start_date)
    const end = new Date(start)
    end.setMonth(end.getMonth() + months)
    const endDate = end.toISOString().split('T')[0]

    const data = {
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      closer: parsed.data.closer || null,
      drive_folder_url: parsed.data.drive_folder_url || null,
      birth_date: parsed.data.birth_date || null,
      location: parsed.data.location || null,
      training_level: parsed.data.training_level || null,
      motivation: parsed.data.motivation || null,
      medical_notes: parsed.data.medical_notes || null,
      goals: parsed.data.goals || null,
      end_date: endDate,
      renewal_date: endDate,
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
      // Auto-assign the current user as coach
      const { data: { user } } = await supabase.auth.getUser()
      const { error: err } = await supabase.from('clients').insert({
        ...data,
        coach_id: user?.id || null,
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard/clients')
    router.refresh()
  }

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

      {/* Profile fields */}
      <p className="text-sm font-medium text-muted-foreground border-b pb-2 mt-2">Perfil del cliente</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Fecha de nacimiento</label>
          <input
            name="birth_date"
            type="date"
            defaultValue={client?.birth_date || ''}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Altura (cm)</label>
          <input
            name="height_cm"
            type="number"
            defaultValue={client?.height_cm || ''}
            className={inputClass}
            placeholder="180"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Ubicación</label>
          <input
            name="location"
            defaultValue={client?.location || ''}
            className={inputClass}
            placeholder="Ciudad de México, México"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Peso inicial (kg)</label>
          <input
            name="initial_weight_kg"
            type="number"
            step="0.1"
            defaultValue={client?.initial_weight_kg || ''}
            className={inputClass}
            placeholder="80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">% Grasa inicial</label>
          <input
            name="initial_body_fat_pct"
            type="number"
            step="0.1"
            defaultValue={client?.initial_body_fat_pct || ''}
            className={inputClass}
            placeholder="20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Nivel de entrenamiento</label>
          <select
            name="training_level"
            defaultValue={client?.training_level || ''}
            className={inputClass}
          >
            <option value="">Sin especificar</option>
            <option value="Inicio">Inicio</option>
            <option value="Avanzado">Avanzado</option>
            <option value="Atleta">Atleta</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Motivación</label>
          <input
            name="motivation"
            defaultValue={client?.motivation || ''}
            className={inputClass}
            placeholder="Estética, Rendimiento, Salud..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Objetivos</label>
        <input
          name="goals"
          defaultValue={client?.goals || ''}
          className={inputClass}
          placeholder="Objetivos del cliente..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Notas médicas</label>
        <input
          name="medical_notes"
          defaultValue={client?.medical_notes || ''}
          className={inputClass}
          placeholder="Diagnósticos, lesiones, condiciones..."
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
              <option value="paused">Pausado</option>
              <option value="completed">Concluido</option>
              <option value="cancelled">Cancelado</option>
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
              <option value="3">Fase 3 - Optimización</option>
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
