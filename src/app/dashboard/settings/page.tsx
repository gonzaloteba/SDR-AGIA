import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { getCurrentCoach, isAdmin } from '@/lib/auth'
import { getUsers } from './actions'
import { UsersPanel } from './users-panel'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const coach = await getCurrentCoach()
  if (!coach || !isAdmin(coach)) {
    redirect('/dashboard')
  }

  const { users } = await getUsers()

  return (
    <div>
      <Header title="Usuarios" />
      <div className="p-6">
        <div className="max-w-3xl space-y-6">
          <UsersPanel users={users} currentUserId={coach.id} />
        </div>
      </div>
    </div>
  )
}
