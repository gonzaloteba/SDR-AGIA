import { User, MapPin, Phone, Mail, Ruler, Weight, Activity, Target, AlertCircle, Calendar } from 'lucide-react'
import { PHASE_LABELS } from '@/lib/constants'
import type { Client, NutritionPhase } from '@/lib/types'

interface ClientProfileSummaryProps {
  client: Client
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  )
}

export function ClientProfileSummary({ client }: ClientProfileSummaryProps) {
  const age = client.birth_date ? calculateAge(client.birth_date) : null

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="text-sm font-medium text-muted-foreground">Perfil del Cliente</h3>
      </div>

      <div className="grid gap-0 divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
        {/* Personal Info */}
        <div className="px-6 py-4 space-y-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Información Personal</p>

          <InfoRow
            icon={User}
            label="Nombre completo"
            value={`${client.first_name} ${client.last_name}`}
          />
          <InfoRow
            icon={Calendar}
            label="Fecha de nacimiento"
            value={
              client.birth_date
                ? `${new Date(client.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} (${age} años)`
                : null
            }
          />
          <InfoRow icon={Phone} label="Teléfono" value={client.phone} />
          <InfoRow icon={Mail} label="Email" value={client.email} />
          <InfoRow icon={MapPin} label="Ubicación" value={client.location} />

          {(client.height_cm || client.initial_weight_kg || client.initial_body_fat_pct) && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Datos Físicos Iniciales</p>
              <div className="flex gap-4">
                {client.height_cm && (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Altura</p>
                      <p className="text-sm font-medium">{client.height_cm} cm</p>
                    </div>
                  </div>
                )}
                {client.initial_weight_kg && (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="text-sm font-medium">{client.initial_weight_kg} kg</p>
                    </div>
                  </div>
                )}
                {client.initial_body_fat_pct && (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">% Grasa</p>
                      <p className="text-sm font-medium">{client.initial_body_fat_pct}%</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Program Info */}
        <div className="px-6 py-4 space-y-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Programa y Objetivos</p>

          <InfoRow
            icon={Activity}
            label="Nivel de entrenamiento"
            value={client.training_level}
          />
          <InfoRow
            icon={Target}
            label="Motivación"
            value={client.motivation}
          />
          <InfoRow
            icon={Target}
            label="Objetivos"
            value={client.goals}
          />
          {client.medical_notes && (
            <div className="flex items-start gap-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Notas médicas</p>
                <p className="text-sm text-amber-700">{client.medical_notes}</p>
              </div>
            </div>
          )}

          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Detalles del Plan</p>
          <InfoRow
            icon={Calendar}
            label="Fase actual"
            value={PHASE_LABELS[client.current_phase as NutritionPhase]}
          />
          <InfoRow
            icon={Calendar}
            label="Inicio"
            value={new Date(client.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
          <InfoRow
            icon={Calendar}
            label="Fin del programa"
            value={new Date(client.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
          <InfoRow
            icon={User}
            label="Closer"
            value={client.closer}
          />
        </div>
      </div>
    </div>
  )
}
