import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastProvider } from '@/components/ui/toast'
import { getCurrentCoach } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const coach = await getCurrentCoach()

  return (
    <ToastProvider>
      <div className="flex h-screen">
        <Suspense>
          <Sidebar coachName={coach?.full_name ?? null} coachRole={coach?.role ?? null} />
        </Suspense>
        <main className="flex-1 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
