'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn, inputClass, textareaClass, toTitleCase } from '@/lib/utils'
import { SEVERITY_LABELS } from '@/lib/constants'
import { useToast } from '@/components/ui/toast'
import type { AlertSeverity } from '@/lib/types'

interface CreateAlertDialogProps {
  clientId: string
  clientName?: string
  /** List of clients for selection when clientId is not pre-set */
  clients?: { id: string; first_name: string; last_name: string }[]
}

export function CreateAlertDialog({ clientId, clientName, clients }: CreateAlertDialogProps) {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const selectedClientId = clientId || (formData.get('client_id') as string)
      const severity = formData.get('severity') as AlertSeverity
      const message = (formData.get('message') as string).trim()

      if (!selectedClientId || !message) {
        toast('Completa todos los campos obligatorios.', 'error')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.from('alerts').insert({
        client_id: selectedClientId,
        type: 'manual',
        severity,
        message,
        is_resolved: false,
      })

      if (error) {
        toast('Error al crear la alerta.', 'error')
        return
      }

      toast('Alerta creada correctamente.', 'success')
      setOpen(false)
      router.refresh()
    } catch {
      toast('Error al crear la alerta.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Crear alerta
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-10 z-50 w-80 rounded-lg border bg-card p-4 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium mb-3">
            Nueva alerta manual
            {clientName && (
              <span className="text-muted-foreground font-normal"> — {clientName}</span>
            )}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!clientId && clients && clients.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  Cliente
                </label>
                <select
                  name="client_id"
                  required
                  className={cn(inputClass, 'h-9 text-xs')}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {toTitleCase(c.first_name)} {toTitleCase(c.last_name)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                Severidad
              </label>
              <select
                name="severity"
                required
                defaultValue="medium"
                className={cn(inputClass, 'h-9 text-xs')}
              >
                {(Object.entries(SEVERITY_LABELS) as [AlertSeverity, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                Mensaje
              </label>
              <textarea
                name="message"
                required
                rows={3}
                maxLength={500}
                className={cn(textareaClass, 'text-xs')}
                placeholder="Describe la alerta..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                {loading ? 'Creando...' : 'Crear alerta'}
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
