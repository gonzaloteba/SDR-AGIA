'use client'

import { useState } from 'react'
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { syncCalendlyNow } from './actions'

interface SyncResult {
  message: string
  success: boolean
  unmatchedNames?: string[]
  debug?: string[]
}

export function CalendlySyncButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    setShowDebug(false)
    try {
      const res = await syncCalendlyNow()
      setResult(res)
    } catch {
      setResult({ message: 'Error al sincronizar con Calendly', success: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Sincronizando...' : 'Sincronizar ahora'}
      </button>
      {result && (
        <div>
          <p className={`text-xs ${result.success ? 'text-muted-foreground' : 'text-red-600'}`}>
            {result.message}
          </p>
          {result.debug && result.debug.length > 0 && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showDebug ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showDebug ? 'Ocultar detalles' : 'Ver detalles'}
            </button>
          )}
          {showDebug && result.debug && (
            <div className="mt-2 rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {result.debug.join('\n')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
