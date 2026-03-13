'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ClientProfileSummary } from './client-profile-summary'
import { ProgressCharts } from './progress-charts'
import { CheckinHistory } from './checkin-history'
import { CallsLog } from './calls-log'
import { TrainingPlanCard } from './training-plan-card'
import { OnboardingChecklist } from './onboarding-checklist'
import type { CheckIn, Call, TrainingPlan, Client } from '@/lib/types'

interface ClientDetailTabsProps {
  checkIns: CheckIn[]
  calls: Call[]
  trainingPlans: TrainingPlan[]
  clientId: string
  client: Client
}

const tabs = [
  { id: 'overview', label: 'Resumen' },
  { id: 'checkins', label: 'Check-ins' },
  { id: 'calls', label: 'Llamadas' },
  { id: 'training', label: 'Entrenamiento' },
]

export function ClientDetailTabs({
  checkIns,
  calls,
  trainingPlans,
  clientId,
  client,
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <ClientProfileSummary client={client} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProgressCharts checkIns={checkIns} />
            </div>
            <div className="space-y-6">
              <OnboardingChecklist
                clientId={clientId}
                trainingpeaks={client.onboarding_trainingpeaks}
                whatsappGroup={client.onboarding_whatsapp_group}
                communityGroup={client.onboarding_community_group}
              />
              <TrainingPlanCard plans={trainingPlans} clientId={clientId} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'checkins' && (
        <CheckinHistory checkIns={checkIns} />
      )}

      {activeTab === 'calls' && (
        <CallsLog calls={calls} clientId={clientId} />
      )}

      {activeTab === 'training' && (
        <TrainingPlanCard plans={trainingPlans} clientId={clientId} />
      )}
    </div>
  )
}
