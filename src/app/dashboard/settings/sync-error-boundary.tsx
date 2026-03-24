'use client'

import { Component, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  name: string
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class SyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>Error cargando sincronización de {this.props.name}</span>
        </div>
      )
    }
    return this.props.children
  }
}
