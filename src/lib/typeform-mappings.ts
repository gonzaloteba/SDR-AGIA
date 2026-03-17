// ============================================
// Typeform Form IDs
// ============================================
export const CHECKIN_FORM_ID = 'Q7cGBOIU'
export const AUDIT_FORM_ID = 'WLlcHS3L'

// ============================================
// Check-In Form (Q7cGBOIU) → check_ins table
// ============================================

// Contact info field refs (for client identification)
export const CHECKIN_FIRST_NAME_REF = 'fe8kfbpstoWV'
export const CHECKIN_LAST_NAME_REF = 'qKZ62Lxtabc2'

// Field ref → check_ins column mapping
export const CHECKIN_FIELD_MAP: Record<string, string> = {
  'C3NytKcPJB6X': 'phase',
  '7iFQN18y8SM3': 'nutrition_adherence',
  'MBwJGqKgs0N5': 'daily_energy',
  '6mKvdn1ABqaQ': 'cravings',
  'IAjyJDDjrsjs': 'craving_details',
  'LIDRdEvA9PJU': 'digestion',
  'LceUfk13aYHy': 'difficulties',
  '3O0S9XT2j7uQ': 'carb_performance',
  'aFSwEU0h4UBg': 'carb_sensation',
  'GeYLEuAHIgn7': 'post_carb_symptoms',
  '1Nx4DDVdSLXh': 'carb_strategy',
  '1XQAVs05cAIm': 'loss_of_control',
  'tPTdHC1B1X1r': 'loss_of_control_detail',
  'PrmWIlOWpFOO': 'protocol_adherence',
  'IVyAGQeOtynK': 'unused_optimizers',
  'sLqpWKnMlqzj': 'unused_supplements',
  'LQ17vjUdARWn': 'main_limiter',
  '48RqkdQr49Nu': 'priority_objective',
  'M46bbdMNe9hL': 'weight',
  'ZnYK2v678JoL': 'body_fat_percentage',
  'Hv5aBHfyAWhF': 'sleep_hours',
  'Vn2AOcLqqvyx': 'energy_level',
  'ZVnGSixUUuNd': 'stress_level',
  'Ub0gnxSOEQJE': 'photo_urls',
}

// ============================================
// Auditoría Inicial Form (WLlcHS3L) → clients table
// ============================================

// Contact info field refs (for client identification)
export const AUDIT_FIRST_NAME_REF = 'fM3FtE87nQfJ'
export const AUDIT_LAST_NAME_REF = 'dnzUUrbR3JVS'

// Field ref → clients column mapping
export const AUDIT_FIELD_MAP: Record<string, string> = {
  // Datos personales
  'RMR9kpDvd7vV': 'phone',
  '9g73SStTdLDo': 'email',
  'IWDqcgtfz5T0': 'birth_date',
  '7aawMA8puX6z': 'location',
  '4o0iFaaEluKG': 'height_cm',
  'eYWMW1Gcpn9a': 'initial_weight_kg',
  // Trabajo
  'V99wnpCMVzsg': 'occupation',
  'ZZQc4LwuAJUe': 'work_schedule',
  'FALZFy42ixAK': 'work_modality',
  'pkAk345ecQb7': 'work_activity_level',
  // Sueño
  'qjpKWLKozFoF': 'wake_time',
  '2bwoY0dWlcTk': 'bed_time',
  '7cZDeEaVwh7B': 'sleep_hours_avg',
  'RndHdZQ2ENMg': 'sleep_quality_initial',
  'eGHFZoOH76tY': 'wakes_at_night',
  'KFsbPuTelnms': 'feels_rested',
  // Entrenamiento
  'uwAyyPRPU0B2': 'has_event',
  'IhSv0XBjza25': 'event_name',
  'n5h069M9qeNA': 'training_days_per_week',
  'bZBYbUafgHdZ': 'training_time',
  'mC2vnwv80CSh': 'training_location',
  'rzfWYJvTXAHK': 'training_level',
  'A2s7B1KU37oC': 'training_cardio',
  'NlZETnU4Rebd': 'trains_fasted',
  'jKdo6np8SchI': 'training_notes',
  // Alimentación
  '8qOK4Ho304hd': 'meals_per_day',
  'X1eJ2GBOHoza': 'first_meal_time',
  'ysz7RUqtr3nH': 'dinner_time',
  'J8mUk1SFA5ht': 'night_hunger',
  '4fpG0rkdUdwR': 'coffee_intake',
  'POmiHAX5jBUT': 'food_intolerances',
  // Energía
  'PPTeB980IRSG': 'energy_level_initial',
  'C81kAIbZpBjk': 'energy_dips',
  // Objetivos
  'hb5qLuFJOdEq': 'goals',
  'mAEszxpMGLqQ': 'onboarding_notes',
  // Foto
  '1BGJgXqDAcqc': 'initial_photo_url',
}

// ============================================
// Value transformers
// ============================================

/** Parse phase choice label to number: "Fase 1" → "1" */
export function parsePhase(value: string): string {
  const match = value.match(/(\d)/)
  return match ? match[1] : value
}

/** Convert Typeform rating (1-5) to 1-10 scale */
export function ratingToTen(value: number): number {
  return Math.min(10, value * 2)
}

/** Parse sleep hours choice to numeric text */
export function parseSleepHours(value: string): string {
  const map: Record<string, string> = {
    'Menos de 5h': '< 5',
    'Entre 5h y 6h': '5-6',
    'Entre 6h y 7h': '6-7',
    'Entre 7h y 8h': '7-8',
    '+8h': '> 8',
  }
  return map[value] || value
}

/** Parse "Si"/"No" choice to boolean */
export function parseYesNoChoice(value: string): boolean {
  return value.toLowerCase() === 'si' || value.toLowerCase() === 'sí'
}

/** Infer IANA timezone from free-text location */
export function inferTimezone(location: string): string | null {
  const l = location.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const map: [RegExp, string][] = [
    [/lima|peru/, 'America/Lima'],
    [/bogota|colombia|medellin|cali|barranquilla/, 'America/Bogota'],
    [/buenos aires|argentina/, 'America/Argentina/Buenos_Aires'],
    [/santiago|chile/, 'America/Santiago'],
    [/montevideo|uruguay/, 'America/Montevideo'],
    [/quito|ecuador|guayaquil/, 'America/Guayaquil'],
    [/caracas|venezuela/, 'America/Caracas'],
    [/mexico|cdmx|guadalajara|monterrey/, 'America/Mexico_City'],
    [/madrid|barcelona|espana|spain|sevilla|valencia/, 'Europe/Madrid'],
    [/miami|new york|estados unidos|usa|united states/, 'America/New_York'],
    [/los angeles|california/, 'America/Los_Angeles'],
    [/panama/, 'America/Panama'],
    [/costa rica|san jose/, 'America/Costa_Rica'],
    [/la paz|bolivia/, 'America/La_Paz'],
    [/asuncion|paraguay/, 'America/Asuncion'],
    [/santo domingo|dominicana/, 'America/Santo_Domingo'],
    [/guatemala/, 'America/Guatemala'],
    [/honduras|tegucigalpa/, 'America/Tegucigalpa'],
    [/el salvador|san salvador/, 'America/El_Salvador'],
    [/managua|nicaragua/, 'America/Managua'],
    [/la habana|cuba/, 'America/Havana'],
    [/puerto rico/, 'America/Puerto_Rico'],
  ]
  for (const [regex, tz] of map) {
    if (regex.test(l)) return tz
  }
  return null
}
