'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn, inputClass, textareaClass } from '@/lib/utils'
import { CALLS_PER_MONTH } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'

interface QuickAddCallProps {
  clientId: string
  callsThisMonth: number
}

export function QuickAddCall({ clientId, callsThisMonth }: QuickAddCallProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  async function handleQuickAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()

      const { error } = await supabase.from('calls').insert({
        client_id: clientId,
        call_date: formData.get('call_date') as string,
        duration_minutes: parseInt(formData.get('duration') as string) || 15,
        notes: (formData.get('notes') as string) || null,
      })

      if (error) {
        toast('Error al registrar la llamada.', 'error')
        return
      }

      setOpen(false)
      router.refresh()
    } catch {
      toast('Error al registrar la llamada.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleInstantAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('calls').insert({
        client_id: clientId,
        call_date: new Date().toISOString().split('T')[0],
        duration_minutes: 15,
      })

      if (error) {
        toast('Error al registrar la llamada.', 'error')
        return
      }

      router.refresh()
    } catch {
      toast('Error al registrar la llamada.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <span className="text-sm">{callsThisMonth}/{CALLS_PER_MONTH}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(!open)
        }}
        disabled={loading}
        className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
        title="Sumar llamada"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Plus className="h-3 w-3" />
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-8 z-50 w-72 rounded-lg border bg-card p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium">Registrar llamada</p>
            <button
              type="button"
              onClick={handleInstantAdd}
              disabled={loading}
              className="text-[10px] text-primary hover:underline disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Hoy, rápido'}
            </button>
          </div>
          <form onSubmit={handleQuickAdd} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium mb-0.5 text-muted-foreground">Fecha</label>
                <input
                  name="call_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className={cn(inputClass, 'h-8 text-xs')}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium mb-0.5 text-muted-foreground">Duración (min)</label>
                <input
                  name="duration"
                  type="number"
                  defaultValue={15}
                  min={1}
                  className={cn(inputClass, 'h-8 text-xs')}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium mb-0.5 text-muted-foreground">Notas (opcional)</label>
              <textarea
                name="notes"
                rows={2}
                className={cn(textareaClass, 'text-xs')}
                placeholder="Breve nota..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
