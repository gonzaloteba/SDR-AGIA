import { User, MapPin, Phone, Mail, Ruler, Weight, Activity, Target, AlertCircle, Calendar, Trophy, Dumbbell, Moon, Zap, Brain, FileText, Image as ImageIcon, Clock, Briefcase, Utensils, Coffee, BedDouble, Sun } from 'lucide-react'
import { PHASE_LABELS } from '@/lib/constants'
import { toTitleCase } from '@/lib/utils'
import { CollapsibleColumn } from '@/components/clients/collapsible-column'
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

function InfoRow({ icon: Icon, label, value, fallback }: { icon: React.ElementType; label: string; value: string | null | undefined; fallback?: string }) {
  const display = value || fallback || null
  if (!display) return null
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm ${!value ? 'text-muted-foreground italic' : ''}`}>{display}</p>
      </div>
    </div>
  )
}

export function ClientProfileSummary({ client }: ClientProfileSummaryProps) {
  const age = client.birth_date ? calculateAge(client.birth_date) : null
  const cleanMotivation = client.motivation?.replace(/\*/g, '') || null

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Perfil del Cliente</h3>
        {client.initial_photo_url && (
          <a
            href={client.initial_photo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Foto inicial
          </a>
        )}
      </div>

      <div className="grid gap-0 divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
        {/* Personal Info */}
        <div className="px-6 py-4 space-y-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Información Personal</p>

          <InfoRow
            icon={User}
            label="Nombre completo"
            value={`${toTitleCase(client.first_name)} ${toTitleCase(client.last_name)}`}
          />
          <InfoRow
            icon={Calendar}
            label="Fecha de nacimiento"
            value={
              client.birth_date
                ? `${new Date(client.birth_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} (${age} años)`
                : null
            }
            fallback="Sin registro"
          />
          <InfoRow icon={Phone} label="Teléfono" value={client.phone} fallback="Sin registro" />
          <InfoRow icon={Mail} label="Email" value={client.email} fallback="Sin registro" />
          <InfoRow icon={MapPin} label="Ubicación" value={client.location} fallback="Sin registro" />

          {(client.height_cm || client.initial_weight_kg || client.initial_body_fat_pct) && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Datos Físicos Iniciales</p>
              <div className="flex flex-wrap gap-3">
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

          {(client.energy_level_initial || client.stress_level_initial || client.sleep_hours_avg) && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Estado Inicial</p>
              <div className="flex flex-wrap gap-3">
                {client.energy_level_initial && (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Energía</p>
                      <p className="text-sm font-medium">{client.energy_level_initial}/10</p>
                    </div>
                  </div>
                )}
                {client.stress_level_initial && (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estrés</p>
                      <p className="text-sm font-medium">{client.stress_level_initial}/10</p>
                    </div>
                  </div>
                )}
                {client.sleep_hours_avg && (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <Moon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sueño</p>
                      <p className="text-sm font-medium">{client.sleep_hours_avg}h</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Program Info */}
        <div className="px-6 py-4 space-y-0">
          <CollapsibleColumn>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Programa y Objetivos</p>

          <InfoRow
            icon={Dumbbell}
            label="Nivel de entrenamiento"
            value={client.training_level}
          />
          <InfoRow
            icon={Target}
            label="Motivación"
            value={cleanMotivation}
          />
          <InfoRow
            icon={Target}
            label="Objetivos"
            value={client.goals}
          />

          {client.has_event && client.event_name && (
            <InfoRow
              icon={Trophy}
              label="Evento objetivo"
              value={
                client.event_date
                  ? `${client.event_name} (${new Date(client.event_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })})`
                  : client.event_name
              }
            />
          )}

          {client.diagnosis === 'TRUE' && client.diagnosis_detail && (
            <div className="flex items-start gap-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Diagnóstico médico</p>
                <p className="text-sm text-amber-700">{client.diagnosis_detail}</p>
              </div>
            </div>
          )}

          {client.medical_notes && (
            <div className="flex items-start gap-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Notas médicas</p>
                <p className="text-sm text-amber-700">{client.medical_notes}</p>
              </div>
            </div>
          )}

          {client.onboarding_notes && (
            <div className="flex items-start gap-3 py-2">
              <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Notas del onboarding</p>
                <p className="text-sm">{client.onboarding_notes}</p>
              </div>
            </div>
          )}

          {/* Sueño */}
          {(client.wake_time || client.bed_time || client.sleep_quality_initial || client.wakes_at_night !== null || client.feels_rested !== null) && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Sueño</p>
              <div className="grid gap-1">
                <InfoRow icon={Sun} label="Hora de despertar" value={client.wake_time} />
                <InfoRow icon={BedDouble} label="Hora de acostarse" value={client.bed_time} />
                {client.sleep_quality_initial && (
                  <InfoRow icon={Moon} label="Calidad de sueño inicial" value={`${client.sleep_quality_initial}/10`} />
                )}
                {client.wakes_at_night !== null && client.wakes_at_night !== undefined && (
                  <InfoRow icon={Moon} label="Se despierta por la noche" value={client.wakes_at_night ? 'Sí' : 'No'} />
                )}
                {client.feels_rested !== null && client.feels_rested !== undefined && (
                  <InfoRow icon={Moon} label="Se siente descansado" value={client.feels_rested ? 'Sí' : 'No'} />
                )}
              </div>
            </>
          )}

          {/* Trabajo */}
          {(client.occupation || client.work_schedule || client.work_modality || client.work_activity_level) && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Trabajo</p>
              <div className="grid gap-1">
                <InfoRow icon={Briefcase} label="Ocupación" value={client.occupation} />
                <InfoRow icon={Briefcase} label="Horarios" value={client.work_schedule} />
                <InfoRow icon={Briefcase} label="Modalidad" value={client.work_modality} />
                <InfoRow icon={Briefcase} label="Nivel de actividad" value={client.work_activity_level} />
              </div>
            </>
          )}

          {/* Entrenamiento extendido */}
          {(client.training_time || client.training_location || client.training_cardio || client.trains_fasted !== null || client.training_notes) && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Entrenamiento (detalle)</p>
              <div className="grid gap-1">
                <InfoRow icon={Clock} label="Momento del día" value={client.training_time} />
                <InfoRow icon={MapPin} label="Lugar" value={client.training_location} />
                <InfoRow icon={Activity} label="Cardio" value={client.training_cardio} />
                {client.trains_fasted !== null && client.trains_fasted !== undefined && (
                  <InfoRow icon={Dumbbell} label="Entrena en ayunas" value={client.trains_fasted ? 'Sí' : 'No'} />
                )}
                <InfoRow icon={FileText} label="Notas entrenamiento" value={client.training_notes} />
              </div>
            </>
          )}

          {/* Alimentación */}
          {(client.meals_per_day || client.first_meal_time || client.dinner_time || client.night_hunger !== null || client.coffee_intake || client.food_intolerances) && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Alimentación</p>
              <div className="grid gap-1">
                <InfoRow icon={Utensils} label="Comidas al día" value={client.meals_per_day} />
                <InfoRow icon={Clock} label="Primera comida" value={client.first_meal_time} />
                <InfoRow icon={Clock} label="Última comida / cena" value={client.dinner_time} />
                {client.night_hunger !== null && client.night_hunger !== undefined && (
                  <InfoRow icon={Utensils} label="Hambre/ansiedad nocturna" value={client.night_hunger ? 'Sí' : 'No'} />
                )}
                <InfoRow icon={Coffee} label="Café" value={client.coffee_intake} />
                {client.food_intolerances && (
                  <div className="flex items-start gap-3 py-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Intolerancias / alergias</p>
                      <p className="text-sm text-amber-700">{client.food_intolerances}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Energía extendida */}
          {client.energy_dips && (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 mt-4">Energía (detalle)</p>
              <InfoRow icon={Zap} label="Bajones de energía" value={client.energy_dips} />
            </>
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
            value={new Date(client.start_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
          <InfoRow
            icon={Calendar}
            label="Fin del programa"
            value={new Date(client.end_date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
          <InfoRow
            icon={User}
            label="Closer"
            value={client.closer}
          />
          </CollapsibleColumn>
        </div>
      </div>
    </div>
  )
}
