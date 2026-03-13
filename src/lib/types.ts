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
export type HealthScore = 'green' | 'yellow' | 'red'

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
  closer: string | null
  drive_folder_url: string | null
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
