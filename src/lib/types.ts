export type ClientStatus = 'active' | 'cancelled' | 'completed' | 'renewed' | 'success_case'
export type NutritionPhase = 1 | 2 | 3
export type AlertType =
  | 'missed_checkin'
  | 'phase_change'
  | 'renewal_approaching'
  | 'training_plan_expiring'
  | 'no_call_logged'
  | 'onboarding_incomplete'
  | 'program_ending'
export type AlertSeverity = 'low' | 'medium' | 'high'
export type UserRole = 'coach' | 'admin'
export type HealthScore = 'green' | 'red'

export interface Client {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  timezone: string
  status: ClientStatus
  plan_type: string
  start_date: string
  end_date: string
  renewal_date: string
  current_phase: NutritionPhase
  phase_change_date: string | null
  custom_phase_duration_days: number | null
  closer: string | null
  drive_folder_url: string | null
  birth_date: string | null
  height_cm: number | null
  initial_weight_kg: number | null
  initial_body_fat_pct: number | null
  location: string | null
  training_level: string | null
  motivation: string | null
  medical_notes: string | null
  goals: string | null
  diagnosis: string | null
  diagnosis_detail: string | null
  has_event: boolean
  event_name: string | null
  event_date: string | null
  training_days_per_week: number | null
  sleep_hours_avg: number | null
  energy_level_initial: number | null
  stress_level_initial: number | null
  initial_photo_url: string | null
  wake_time: string | null
  bed_time: string | null
  sleep_quality_initial: number | null
  wakes_at_night: boolean | null
  feels_rested: boolean | null
  work_schedule: string | null
  work_modality: string | null
  work_activity_level: string | null
  training_time: string | null
  training_location: string | null
  training_cardio: string | null
  trains_fasted: boolean | null
  training_notes: string | null
  meals_per_day: string | null
  first_meal_time: string | null
  dinner_time: string | null
  night_hunger: boolean | null
  coffee_intake: string | null
  food_intolerances: string | null
  energy_dips: string | null
  onboarding_notes: string | null
  onboarding_submitted_at: string | null
  onboarding_trainingpeaks: boolean
  onboarding_whatsapp_group: boolean
  onboarding_community_group: boolean
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  client_id: string
  submitted_at: string
  typeform_response_id: string | null
  weight: number | null
  body_fat_percentage: number | null
  waist_measurement: number | null
  energy_level: number | null
  sleep_quality: number | null
  mood: number | null
  nutrition_adherence: number | null
  training_adherence: number | null
  notes: string | null
  photo_urls: string[] | null
  phase: number | null
  protocol_adherence: string | null
  daily_energy: string | null
  cravings: string | null
  digestion: string | null
  difficulties: string | null
  stress_level: number | null
  sleep_hours: number | null
  carb_performance: string | null
  carb_sensation: string | null
  post_carb_symptoms: string | null
  carb_strategy: string | null
  loss_of_control: boolean | null
  loss_of_control_detail: string | null
  craving_details: string | null
  unused_optimizers: string | null
  unused_supplements: string | null
  main_limiter: string | null
  priority_objective: string | null
  created_at: string
}

export interface Call {
  id: string
  client_id: string
  call_date: string
  duration_minutes: number
  notes: string | null
  created_at: string
}

export interface TrainingPlan {
  id: string
  client_id: string
  start_date: string
  end_date: string
  plan_name: string | null
  notes: string | null
  created_at: string
}

export interface Alert {
  id: string
  client_id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
  client?: Client
}

export interface Coach {
  id: string
  full_name: string
  role: UserRole
  created_at: string
}

// Composite types for the dashboard
export interface ClientWithHealth extends Client {
  health_score: HealthScore
  last_checkin_date: string | null
  calls_this_month: number
  days_remaining: number
}
