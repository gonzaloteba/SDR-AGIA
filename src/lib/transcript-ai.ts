import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

const log = logger('transcript:ai')

/**
 * Analyze a coaching call transcript and extract actionable items for the coach.
 * Returns a string with the coach actions, or null if analysis fails.
 */
export async function generateCoachActions(
  transcript: string,
  clientName?: string
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    log.warn('ANTHROPIC_API_KEY not configured, skipping coach actions generation')
    return null
  }

  try {
    const client = new Anthropic({ apiKey })

    const clientContext = clientName
      ? `El cliente se llama ${clientName}.`
      : 'No se conoce el nombre del cliente.'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Eres un asistente para un coach de salud y nutrición. Analiza el siguiente transcript de una llamada de coaching y extrae las acciones concretas que el coach debe tomar después de la llamada.

${clientContext}

Reglas:
- Lista solo acciones concretas y accionables para el coach (NO para el cliente)
- Formato: una acción por línea, empezando con "•"
- Ejemplos de acciones: enviar plan de alimentación, ajustar macros, programar siguiente llamada, enviar recetas, revisar progreso de peso, etc.
- Si no hay acciones claras, escribe "• Sin acciones pendientes"
- Sé conciso, máximo 5 acciones
- Responde SOLO con la lista de acciones, sin introducción ni explicación

Transcript:
${transcript.substring(0, 15000)}`,
        },
      ],
    })

    const result = message.content[0]
    if (result.type === 'text' && result.text.trim()) {
      log.info('Coach actions generated successfully', {
        clientName,
        actionsLength: result.text.length,
      })
      return result.text.trim()
    }

    return null
  } catch (error) {
    log.error('Failed to generate coach actions', {
      error: (error as Error).message,
      clientName,
    })
    return null
  }
}
