import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function createAdminUser() {
  const email = 'andres@agiaconsulting.ai'
  const password = 'Andreszalud123!'
  const fullName = 'Andres Tirado'

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error('Error creating auth user:', authError.message)
    process.exit(1)
  }

  const userId = authData.user.id
  console.log(`Auth user created: ${userId}`)

  // 2. Insert into coaches table with admin role
  const { error: coachError } = await supabase
    .from('coaches')
    .insert({
      id: userId,
      full_name: fullName,
      role: 'admin',
    })

  if (coachError) {
    console.error('Error inserting coach:', coachError.message)
    process.exit(1)
  }

  console.log(`Admin coach created successfully!`)
  console.log(`  Email: ${email}`)
  console.log(`  Name: ${fullName}`)
  console.log(`  Role: admin`)
  console.log(`  ID: ${userId}`)
}

createAdminUser()
