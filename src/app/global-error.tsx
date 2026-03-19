'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Algo salió mal
          </h2>
          <p className="text-sm text-gray-500">
            Ha ocurrido un error inesperado.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
