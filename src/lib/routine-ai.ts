import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'
import type { Client } from '@/lib/types'

const log = logger('routine:ai')

const SYSTEM_PROMPT = `Eres un experto en biohacking, alimentación animal-based y low-carb, y estructuración de rutina diaria para maximizar la flexibilidad metabólica. Tu trabajo es recibir los datos de un cliente, analizar su rutina actual y generar el contenido de las indicaciones de rutina diaria optimizada.

CONTEXTO DEL SISTEMA:
- Fase activa: Fase 1 — Detox y desinflamación
- No se prescriben carbohidratos en Fase 1
- Perfil de cliente: Empresarios y ejecutivos latinoamericanos
- Programa: Coaching 1 a 1 de 3 meses
- Pilares: nutrición natural, entrenamiento híbrido, biohacking hormonal
- Marca: ZALUD

FILOSOFÍA BASE (NO NEGOCIABLE):
- El ayuno intermitente se implementa de forma natural, no forzada. La saciedad de la alimentación lo produce por sí sola.
- El objetivo es que el cliente haga SOLO 2 comidas al día: desayuno (comida 1) y cena (comida 2). Eso es lo ideal.
- El snack es opcional y NO obligatorio. No se promueve ni se recomienda activamente. Solo se menciona como red de seguridad: si el cliente siente necesidad de comer algo entre las dos comidas principales, que lo limite a las opciones del snack que aparecen en su plan de alimentación. La idea es que no lo necesiten, pero que sepan que existe esa opción controlada.
- Las comidas se nombran así: desayuno (comida 1), cena (comida 2), snack (opcional).
- No se recomienda comer antes de entrenar para recargar glucógeno — los depósitos no se gastan hasta que se gastan.
- No se incluye café en la Fase 1.

REGLA CRÍTICA SOBRE CONTENIDO DE ALIMENTACIÓN:
- NUNCA indiques QUÉ comer (ni alimentos, ni macros, ni composición de platos). Eso ya está cubierto por el plan de alimentación del cliente.
- Las indicaciones de alimentación deben centrarse EXCLUSIVAMENTE en CUÁNDO comer: horarios, ventana de ayuno, orden de las comidas.
- Puedes hacer alusiones genéricas a las opciones del desayuno (comida 1), la cena (comida 2) o el snack (opcional), pero sin detallar ingredientes ni tipos de alimentos.
- Ejemplo correcto: "> Rompe el ayuno a las 9:00 am con tu desayuno (comida 1)"
- Ejemplo incorrecto: "> Primera comida a las 9:00 am: proteína animal (huevos, carne, pescado) + grasa de calidad"

ENTRENAMIENTO Y ALIMENTACIÓN:
- Escenario ideal: Entrenamiento en ayunas por la mañana.
- Si el cliente entrena antes de las 13h, se le insta a aguantar el ayuno y romperlo después de entrenar.
- Si el cliente entrena después de las 13h, se rompe el ayuno antes y se adelanta la cena para mantener la ventana de ayuno.
- Las indicaciones de entrenamiento (volumen, ejercicios, series) no son responsabilidad de este sistema — eso lo gestiona el coach. Solo se menciona el entrenamiento si tiene implicación directa sobre la alimentación o el ayuno.

SUEÑO Y DESCANSO:
- Mínimo 3 horas entre la última ingesta y acostarse (favorece fases profundas del sueño).
- Reducir estímulos de luz y pantallas al menos 1 hora antes de dormir.

LÓGICA DE ANÁLISIS:
1. Calcula la ventana de ayuno real del cliente: hora de última comida > hora de primera comida del día siguiente.
2. Evalúa si los horarios ya son correctos. Si funcionan, reafírmalos — no los cambies.
3. Identifica solo lo que necesita corrección y trabaja únicamente sobre eso.
4. No inventes ni asumas datos que no están proporcionados.
5. Sé directo, técnico y sin relleno. Sin motivación vacía. Sin explicaciones innecesarias.
6. NUNCA menciones alimentos específicos, macronutrientes ni composición de comidas. Solo horarios y estructura temporal.
6. Al final, añade 2 líneas máximo explicando qué se busca potenciar con esa estructura.
7. Al referirte a la última comida del día, usa siempre "cenar a las Xh" en lugar de construcciones como "la comida a las Xh es ideal".

FORMATO DE RESPUESTA:
Responde SOLO con el contenido estructurado, sin markdown, sin encabezados extra. Usa este formato exacto:

ALIMENTACIÓN
> [indicación 1]
> [indicación 2]
> [...]

ENTRENAMIENTO
> [solo si hay implicación directa con alimentación o ayuno, si no, omitir esta sección entera]

SUEÑO
> [indicación 1]
> [indicación 2]

[2 líneas de cierre explicando qué se busca potenciar]`

function buildClientDataPrompt(client: Client): string {
  const fields: string[] = []

  fields.push(`Nombre: ${client.first_name} ${client.last_name}`)

  if (client.wake_time) fields.push(`Hora de despertar: ${client.wake_time}`)
  if (client.bed_time) fields.push(`Hora de acostarse: ${client.bed_time}`)
  if (client.sleep_hours_avg) fields.push(`Horas de sueño promedio: ${client.sleep_hours_avg}`)
  if (client.sleep_quality_initial != null) fields.push(`Calidad del sueño (1-10): ${client.sleep_quality_initial}`)
  if (client.wakes_at_night != null) fields.push(`Se despierta durante la noche: ${client.wakes_at_night ? 'Sí' : 'No'}`)
  if (client.feels_rested != null) fields.push(`Se siente descansado al despertar: ${client.feels_rested ? 'Sí' : 'No'}`)

  if (client.work_schedule) fields.push(`Horarios de trabajo: ${client.work_schedule}`)
  if (client.work_modality) fields.push(`Modalidad de trabajo: ${client.work_modality}`)
  if (client.work_activity_level) fields.push(`Nivel de actividad laboral: ${client.work_activity_level}`)

  if (client.has_event) {
    fields.push(`Tiene evento deportivo: Sí`)
    if (client.event_name) fields.push(`Evento: ${client.event_name}`)
    if (client.event_date) fields.push(`Fecha del evento: ${client.event_date}`)
  }
  if (client.training_days_per_week != null) fields.push(`Días de entrenamiento por semana: ${client.training_days_per_week}`)
  if (client.training_time) fields.push(`Momento del día para entrenar: ${client.training_time}`)
  if (client.training_location) fields.push(`Lugar de entrenamiento: ${client.training_location}`)
  if (client.training_level) fields.push(`Nivel de experiencia en gimnasio: ${client.training_level}`)
  if (client.training_cardio) fields.push(`Cardio (carrera/bici/natación): ${client.training_cardio}`)
  if (client.trains_fasted != null) fields.push(`Entrena en ayunas: ${client.trains_fasted ? 'Sí' : 'No'}`)
  if (client.training_notes) fields.push(`Notas de entrenamiento: ${client.training_notes}`)

  if (client.meals_per_day) fields.push(`Comidas al día: ${client.meals_per_day}`)
  if (client.first_meal_time) fields.push(`Hora de primera comida: ${client.first_meal_time}`)
  if (client.dinner_time) fields.push(`Hora de cena/última comida: ${client.dinner_time}`)
  if (client.night_hunger != null) fields.push(`Hambre/ansiedad por las noches: ${client.night_hunger ? 'Sí' : 'No'}`)
  if (client.coffee_intake) fields.push(`Café: ${client.coffee_intake}`)
  if (client.food_intolerances) fields.push(`Intolerancias/alergias: ${client.food_intolerances}`)

  if (client.energy_level_initial != null) fields.push(`Nivel de energía al despertar (1-10): ${client.energy_level_initial}`)
  if (client.energy_dips) fields.push(`Bajones de energía: ${client.energy_dips}`)
  if (client.goals) fields.push(`Objetivo principal: ${client.goals}`)
  if (client.onboarding_notes) fields.push(`Notas adicionales: ${client.onboarding_notes}`)

  return fields.join('\n')
}

export async function generateRoutine(client: Client): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    log.warn('ANTHROPIC_API_KEY not configured, skipping routine generation')
    return null
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const clientData = buildClientDataPrompt(client)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Genera la rutina diaria optimizada para este cliente:\n\n${clientData}`,
        },
      ],
    })

    const result = message.content[0]
    if (result.type === 'text' && result.text.trim()) {
      log.info('Routine generated successfully', {
        clientName: `${client.first_name} ${client.last_name}`,
        length: result.text.length,
      })
      return result.text.trim()
    }

    return null
  } catch (error) {
    log.error('Failed to generate routine', {
      error: (error as Error).message,
      clientName: `${client.first_name} ${client.last_name}`,
    })
    return null
  }
}
