import { z } from 'zod'

// ============================================
// Shared primitives
// ============================================

export const clientIdSchema = z.string().uuid('Invalid client ID')
export const callIdSchema = z.string().uuid('Invalid call ID')

// ============================================
// Phase update endpoint
// ============================================

export const phaseUpdateSchema = z.object({
  phase: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  custom_phase_duration_days: z.number().int().nullable().optional(),
}).refine(
  (data) => data.phase !== undefined || data.custom_phase_duration_days !== undefined,
  { message: 'Either phase or custom_phase_duration_days must be provided' }
)

// ============================================
// Client form (create/update)
// ============================================

export const clientFormSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio').max(100),
  last_name: z.string().min(1, 'El apellido es obligatorio').max(100),
  email: z.string().email('Email inválido').nullable().optional().or(z.literal('')),
  phone: z.string().max(30).nullable().optional().or(z.literal('')),
  timezone: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  plan_type: z.enum(['3_months', '4_months', '6_months', '12_months']),
  closer: z.string().max(100).nullable().optional().or(z.literal('')),
  drive_folder_url: z.string().url('URL inválida').nullable().optional().or(z.literal('')),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
  current_phase: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal('')),
  height_cm: z.number().int().min(50).max(300).nullable().optional(),
  initial_weight_kg: z.number().min(10).max(500).nullable().optional(),
  initial_body_fat_pct: z.number().min(0).max(100).nullable().optional(),
  location: z.string().max(200).nullable().optional().or(z.literal('')),
  training_level: z.string().max(50).nullable().optional().or(z.literal('')),
  motivation: z.string().max(500).nullable().optional().or(z.literal('')),
  medical_notes: z.string().max(2000).nullable().optional().or(z.literal('')),
  goals: z.string().max(2000).nullable().optional().or(z.literal('')),
})

export type ClientFormData = z.infer<typeof clientFormSchema>

// ============================================
// Call form
// ============================================

export const callFormSchema = z.object({
  call_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  duration_minutes: z.number().int().min(1).max(480).default(15),
  notes: z.string().max(5000).nullable().optional(),
  transcript: z.string().max(50000).nullable().optional(),
  meet_link: z.string().url('URL inválida').nullable().optional().or(z.literal('')),
  coach_actions: z.string().max(5000).nullable().optional(),
})

// ============================================
// Training plan form
// ============================================

export const trainingPlanFormSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  plan_name: z.string().max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

// ============================================
// Login form
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

// ============================================
// Server action schemas
// ============================================

export const updateEndDateSchema = z.object({
  clientId: clientIdSchema,
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
})

export const toggleBadgeSchema = z.object({
  clientId: clientIdSchema,
  badge: z.enum(['is_renewed', 'is_success_case']),
  value: z.boolean(),
})

// ============================================
// Typeform webhook payload
// ============================================

export const typeformWebhookSchema = z.object({
  form_response: z.object({
    form_id: z.string(),
    token: z.string(),
    submitted_at: z.string().optional(),
    landed_at: z.string().optional(),
    answers: z.array(z.object({
      type: z.string(),
      field: z.object({ id: z.string() }).optional(),
    }).passthrough()).optional(),
    hidden: z.record(z.string(), z.string()).optional(),
  }),
})

// ============================================
// Cron secret auth
// ============================================

export const cronAuthSchema = z.string().min(1, 'Authorization header required')

// ============================================
// Helpers
// ============================================

/** Validate and return parsed data, or throw with user-friendly message */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    throw new ValidationError(messages)
  }
  return result.data
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
