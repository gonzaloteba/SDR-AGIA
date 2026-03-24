import { z } from 'zod'

/**
 * Server-side environment variable validation.
 * Import this in any server-side code to ensure all required env vars are present.
 * Fails fast at import time if any required variable is missing.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TYPEFORM_WEBHOOK_SECRET: z.string().min(1),
  TYPEFORM_API_TOKEN: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  CALENDLY_API_TOKEN: z.string().min(1),
})

export const env = serverEnvSchema.parse(process.env)
