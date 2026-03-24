import { Header } from '@/components/layout/header'
import { IntegrationsSection } from './integrations-section'
import { getIntegrationStatus } from './actions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const status = await getIntegrationStatus()

  return (
    <div>
      <Header title="Configuración" />
      <div className="p-6">
        <div className="max-w-2xl space-y-6">
          <IntegrationsSection status={status} />

          {/* Datos de la base de datos */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-medium mb-4">Base de Datos</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{status.supabase.clientCount ?? '—'}</p>
                <p className="text-muted-foreground">Clientes activos</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{status.supabase.callCount ?? '—'}</p>
                <p className="text-muted-foreground">Llamadas registradas</p>
              </div>
            </div>
          </div>

          {/* Variables de entorno */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-medium mb-4">Variables de Entorno</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(status.envVars).map(([key, isSet]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{key}</code>
                  {isSet ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Configurada
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      No configurada
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
