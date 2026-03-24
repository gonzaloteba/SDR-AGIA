'use client'

import { useState } from 'react'
import { fixOrphanCalls } from './actions'

export function FixOrphanCallsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fixOrphanCalls()
      setResult(res)
    } catch (err) {
      setResult({ success: false, message: `Error: ${(err as Error).message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {loading ? 'Reparando...' : 'Reparar llamadas sin coach'}
      </button>
      {result && (
        <p className={`mt-2 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </p>
      )}
    </div>
  )
}
