'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import type { ClientStatus } from '@/lib/types'

interface StatusDropdownProps {
  clientId: string
  currentStatus: ClientStatus
  size?: 'sm' | 'md'
}

const ALL_STATUSES: ClientStatus[] = ['active', 'completed', 'cancelled']

export function StatusDropdown({ clientId, currentStatus, size = 'sm' }: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [status, setStatus] = useState(currentStatus)
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

  async function changeStatus(newStatus: ClientStatus) {
    if (newStatus === status) {
      setOpen(false)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('clients')
      .update({ status: newStatus })
      .eq('id', clientId)

    if (!error) {
      setStatus(newStatus)
      router.refresh()
    }
    setLoading(false)
    setOpen(false)
  }

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-0.5 text-xs'
    : 'px-3 py-1 text-sm'

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
          'inline-flex items-center gap-1 rounded-full font-medium transition-opacity cursor-pointer',
          sizeClasses,
          STATUS_COLORS[status],
          loading && 'opacity-50'
        )}
      >
        {STATUS_LABELS[status]}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className={cn(
          'absolute left-0 z-50 min-w-[160px] rounded-lg border bg-popover p-1 shadow-lg',
          openUp ? 'bottom-full mb-1' : 'top-full mt-1'
        )}>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => changeStatus(s)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-muted',
                s === status && 'bg-muted font-medium'
              )}
            >
              <span className={cn('inline-block h-2 w-2 rounded-full', STATUS_COLORS[s].split(' ')[0])} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
