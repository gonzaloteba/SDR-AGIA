'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PHASE_LABELS } from '@/lib/constants'
import type { NutritionPhase } from '@/lib/types'

interface PhaseDropdownProps {
  clientId: string
  currentPhase: NutritionPhase
}

const ALL_PHASES: NutritionPhase[] = [1, 2, 3]

const PHASE_COLORS: Record<NutritionPhase, string> = {
  1: 'bg-orange-100 text-orange-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-green-100 text-green-800',
}

export function PhaseDropdown({ clientId, currentPhase }: PhaseDropdownProps) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [phase, setPhase] = useState(currentPhase)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function changePhase(newPhase: NutritionPhase) {
    if (newPhase === phase) {
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/phase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: newPhase }),
      })

      if (res.ok) {
        setPhase(newPhase)
        router.refresh()
      }
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            setOpenUp(spaceBelow < 200)
          }
          setOpen(!open)
        }}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-opacity cursor-pointer',
          PHASE_COLORS[phase],
          loading && 'opacity-50'
        )}
      >
        {PHASE_LABELS[phase]}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className={cn(
          'absolute left-0 z-50 min-w-[220px] rounded-lg border bg-popover p-1 shadow-lg',
          openUp ? 'bottom-full mb-1' : 'top-full mt-1'
        )}>
          {ALL_PHASES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => changePhase(p)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-muted',
                p === phase && 'bg-muted font-medium'
              )}
            >
              <span className={cn('inline-block h-2 w-2 rounded-full', PHASE_COLORS[p].split(' ')[0])} />
              {PHASE_LABELS[p]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
