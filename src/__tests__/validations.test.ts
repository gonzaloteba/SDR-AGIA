import {
  phaseUpdateSchema,
  clientFormSchema,
  callFormSchema,
  trainingPlanFormSchema,
  loginSchema,
  updateEndDateSchema,
  toggleBadgeSchema,
  typeformWebhookSchema,
  validateOrThrow,
  ValidationError,
} from '@/lib/validations'

// ============================================
// phaseUpdateSchema
// ============================================
describe('phaseUpdateSchema', () => {
  it('accepts valid phase update', () => {
    expect(phaseUpdateSchema.safeParse({ phase: 1 }).success).toBe(true)
    expect(phaseUpdateSchema.safeParse({ phase: 2 }).success).toBe(true)
    expect(phaseUpdateSchema.safeParse({ phase: 3 }).success).toBe(true)
  })

  it('accepts custom_phase_duration_days', () => {
    expect(phaseUpdateSchema.safeParse({ custom_phase_duration_days: 30 }).success).toBe(true)
    expect(phaseUpdateSchema.safeParse({ custom_phase_duration_days: -1 }).success).toBe(true)
    expect(phaseUpdateSchema.safeParse({ custom_phase_duration_days: null }).success).toBe(true)
  })

  it('accepts both fields', () => {
    expect(phaseUpdateSchema.safeParse({ phase: 2, custom_phase_duration_days: 14 }).success).toBe(true)
  })

  it('rejects invalid phase', () => {
    expect(phaseUpdateSchema.safeParse({ phase: 4 }).success).toBe(false)
    expect(phaseUpdateSchema.safeParse({ phase: 0 }).success).toBe(false)
    expect(phaseUpdateSchema.safeParse({ phase: 'two' }).success).toBe(false)
  })

  it('rejects empty object', () => {
    expect(phaseUpdateSchema.safeParse({}).success).toBe(false)
  })
})

// ============================================
// clientFormSchema
// ============================================
describe('clientFormSchema', () => {
  const validClient = {
    first_name: 'Juan',
    last_name: 'García',
    timezone: 'America/Mexico_City',
    start_date: '2024-01-15',
    plan_type: '3_months' as const,
  }

  it('accepts valid minimal client', () => {
    expect(clientFormSchema.safeParse(validClient).success).toBe(true)
  })

  it('accepts full client data', () => {
    const full = {
      ...validClient,
      email: 'juan@example.com',
      phone: '+52123456789',
      closer: 'Ana',
      drive_folder_url: 'https://drive.google.com/folder',
      status: 'active' as const,
      current_phase: 2 as const,
      birth_date: '1990-06-15',
      height_cm: 180,
      initial_weight_kg: 80.5,
      initial_body_fat_pct: 20.0,
      location: 'CDMX',
      training_level: 'Avanzado',
      motivation: 'Rendimiento',
      medical_notes: 'None',
      goals: 'Gain muscle',
    }
    expect(clientFormSchema.safeParse(full).success).toBe(true)
  })

  it('rejects missing first_name', () => {
    const { first_name, ...rest } = validClient
    expect(clientFormSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid plan_type', () => {
    expect(clientFormSchema.safeParse({ ...validClient, plan_type: '2_months' }).success).toBe(false)
  })

  it('rejects invalid date format', () => {
    expect(clientFormSchema.safeParse({ ...validClient, start_date: '01-15-2024' }).success).toBe(false)
    expect(clientFormSchema.safeParse({ ...validClient, start_date: '2024/01/15' }).success).toBe(false)
  })

  it('rejects height out of range', () => {
    expect(clientFormSchema.safeParse({ ...validClient, height_cm: 10 }).success).toBe(false)
    expect(clientFormSchema.safeParse({ ...validClient, height_cm: 400 }).success).toBe(false)
  })

  it('rejects body fat out of range', () => {
    expect(clientFormSchema.safeParse({ ...validClient, initial_body_fat_pct: -1 }).success).toBe(false)
    expect(clientFormSchema.safeParse({ ...validClient, initial_body_fat_pct: 101 }).success).toBe(false)
  })

  it('allows empty strings for optional fields', () => {
    expect(clientFormSchema.safeParse({ ...validClient, email: '' }).success).toBe(true)
    expect(clientFormSchema.safeParse({ ...validClient, phone: '' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(clientFormSchema.safeParse({ ...validClient, email: 'not-email' }).success).toBe(false)
  })

  it('rejects invalid status', () => {
    expect(clientFormSchema.safeParse({ ...validClient, status: 'pending' }).success).toBe(false)
  })
})

// ============================================
// callFormSchema
// ============================================
describe('callFormSchema', () => {
  it('accepts valid call', () => {
    expect(callFormSchema.safeParse({
      call_date: '2024-06-15',
      duration_minutes: 30,
    }).success).toBe(true)
  })

  it('accepts full call data', () => {
    expect(callFormSchema.safeParse({
      call_date: '2024-06-15',
      duration_minutes: 60,
      notes: 'Good progress',
      transcript: 'Long transcript...',
      meet_link: 'https://meet.google.com/abc-def-ghi',
      coach_actions: 'Update plan',
    }).success).toBe(true)
  })

  it('rejects invalid date', () => {
    expect(callFormSchema.safeParse({ call_date: '15/06/2024', duration_minutes: 15 }).success).toBe(false)
  })

  it('rejects negative duration', () => {
    expect(callFormSchema.safeParse({ call_date: '2024-06-15', duration_minutes: -1 }).success).toBe(false)
  })

  it('rejects excessive duration', () => {
    expect(callFormSchema.safeParse({ call_date: '2024-06-15', duration_minutes: 500 }).success).toBe(false)
  })

  it('rejects invalid meet_link', () => {
    expect(callFormSchema.safeParse({ call_date: '2024-06-15', duration_minutes: 15, meet_link: 'not-a-url' }).success).toBe(false)
  })
})

// ============================================
// trainingPlanFormSchema
// ============================================
describe('trainingPlanFormSchema', () => {
  it('accepts valid plan', () => {
    expect(trainingPlanFormSchema.safeParse({
      start_date: '2024-01-01',
      end_date: '2024-03-31',
    }).success).toBe(true)
  })

  it('accepts plan with name and notes', () => {
    expect(trainingPlanFormSchema.safeParse({
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      plan_name: 'Strength phase',
      notes: 'Focus on compound lifts',
    }).success).toBe(true)
  })

  it('rejects invalid date format', () => {
    expect(trainingPlanFormSchema.safeParse({
      start_date: 'Jan 1, 2024',
      end_date: '2024-03-31',
    }).success).toBe(false)
  })
})

// ============================================
// loginSchema
// ============================================
describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'test@example.com', password: 'secret' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-email', password: 'secret' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false)
  })
})

// ============================================
// updateEndDateSchema
// ============================================
describe('updateEndDateSchema', () => {
  it('accepts valid input', () => {
    expect(updateEndDateSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      endDate: '2024-12-31',
    }).success).toBe(true)
  })

  it('rejects non-UUID clientId', () => {
    expect(updateEndDateSchema.safeParse({
      clientId: 'not-a-uuid',
      endDate: '2024-12-31',
    }).success).toBe(false)
  })

  it('rejects invalid date format', () => {
    expect(updateEndDateSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      endDate: '12/31/2024',
    }).success).toBe(false)
  })
})

// ============================================
// toggleBadgeSchema
// ============================================
describe('toggleBadgeSchema', () => {
  it('accepts valid toggle', () => {
    expect(toggleBadgeSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      badge: 'is_renewed',
      value: true,
    }).success).toBe(true)
  })

  it('rejects invalid badge name', () => {
    expect(toggleBadgeSchema.safeParse({
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      badge: 'is_vip',
      value: true,
    }).success).toBe(false)
  })
})

// ============================================
// typeformWebhookSchema
// ============================================
describe('typeformWebhookSchema', () => {
  it('accepts valid webhook payload', () => {
    expect(typeformWebhookSchema.safeParse({
      form_response: {
        form_id: 'Q7cGBOIU',
        token: 'abc123',
        submitted_at: '2024-01-01T00:00:00Z',
        answers: [{ type: 'text', field: { id: 'f1' }, text: 'hello' }],
      },
    }).success).toBe(true)
  })

  it('accepts minimal payload', () => {
    expect(typeformWebhookSchema.safeParse({
      form_response: {
        form_id: 'Q7cGBOIU',
        token: 'abc123',
      },
    }).success).toBe(true)
  })

  it('rejects missing form_response', () => {
    expect(typeformWebhookSchema.safeParse({}).success).toBe(false)
  })

  it('rejects missing form_id', () => {
    expect(typeformWebhookSchema.safeParse({
      form_response: { token: 'abc' },
    }).success).toBe(false)
  })
})

// ============================================
// validateOrThrow
// ============================================
describe('validateOrThrow', () => {
  it('returns parsed data on valid input', () => {
    const result = validateOrThrow(loginSchema, { email: 'a@b.com', password: '123' })
    expect(result).toEqual({ email: 'a@b.com', password: '123' })
  })

  it('throws ValidationError on invalid input', () => {
    expect(() => validateOrThrow(loginSchema, { email: 'bad', password: '' })).toThrow(ValidationError)
  })

  it('includes field path in error message', () => {
    try {
      validateOrThrow(loginSchema, { email: 'bad', password: '' })
    } catch (e) {
      expect((e as Error).message).toContain('email')
    }
  })
})
