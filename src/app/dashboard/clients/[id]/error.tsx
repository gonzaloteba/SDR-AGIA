'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

const log = logger('error-boundary:client-detail')

export default function ClientDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    log.error('Client detail error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center max-w-md">
        <h2 className="text-lg font-semibold text-destructive mb-2">
          Error al cargar el cliente
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          No se pudieron cargar los datos de este cliente.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Reintentar
          </button>
          <Link
            href="/dashboard/clients"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Volver a clientes
          </Link>
        </div>
      </div>
    </div>
  )
}
