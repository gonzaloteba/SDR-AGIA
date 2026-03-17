'use client'

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), 4000)
    return () => clearTimeout(timer)
  }, [t.id, onDismiss])

  const colors: Record<ToastType, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-right-full duration-200',
        colors[t.type]
      )}
    >
      <p className="text-sm flex-1">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
