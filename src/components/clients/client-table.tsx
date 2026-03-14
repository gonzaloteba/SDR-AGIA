'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PHASE_LABELS, HEALTH_COLORS } from '@/lib/constants'
import { StatusDropdown } from '@/components/clients/status-dropdown'
import type { ClientWithHealth, NutritionPhase } from '@/lib/types'

interface ClientTableProps {
  clients: ClientWithHealth[]
}

export function ClientTable({ clients }: ClientTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [healthFilter, setHealthFilter] = useState<string>('all')

  const filtered = clients.filter((client) => {
    const matchesSearch =
      `${client.first_name} ${client.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    const matchesHealth = healthFilter === 'all' || client.health_score === healthFilter
    return matchesSearch && matchesStatus && matchesHealth
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="completed">Concluido</option>
          <option value="renewed">Renovado</option>
          <option value="cancelled">Cancelado</option>
          <option value="success_case">Caso de Éxito</option>
        </select>
        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todos los semáforos</option>
          <option value="green">Verde</option>
          <option value="red">Rojo</option>
        </select>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Agregar cliente
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-12"></th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Fase</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Días restantes</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Último check-in</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Llamadas/mes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-block h-3 w-3 rounded-full',
                        HEALTH_COLORS[client.health_score]
                      )}
                      title={
                        client.health_score === 'green'
                          ? 'Sin pendientes'
                          : 'Tiene alertas pendientes'
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.first_name} {client.last_name}
                      </Link>
                      {client.pending_coach_actions > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700"
                          title={`${client.pending_coach_actions} acción(es) del coach pendiente(s)`}
                        >
                          <ClipboardList className="h-3 w-3" />
                          {client.pending_coach_actions}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusDropdown
                      clientId={client.id}
                      currentStatus={client.status}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {PHASE_LABELS[client.current_phase as NutritionPhase]}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {client.days_remaining} días
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {client.last_checkin_date
                      ? new Date(client.last_checkin_date).toLocaleDateString('es-ES')
                      : 'Sin check-in'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {client.calls_this_month}/3
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
