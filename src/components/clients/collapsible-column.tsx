'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleColumnProps {
  children: React.ReactNode
  collapsedHeight?: number
}

export function CollapsibleColumn({ children, collapsedHeight = 280 }: CollapsibleColumnProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative">
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? 'none' : `${collapsedHeight}px` }}
      >
        {children}
      </div>
      {!expanded && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent" />
      )}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="relative z-10 mt-1 flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {expanded ? (
          <>
            Ocultar detalles
            <ChevronUp className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            Ver más detalles
            <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  )
}
