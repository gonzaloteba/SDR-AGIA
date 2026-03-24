'use client'

import { useMemo, useCallback, useState, useRef, useDeferredValue } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Search, Plus, ClipboardList, Cake, ArrowRightCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PHASE_LABELS, HEALTH_COLORS, BADGE_CONFIG, CHECKIN_GRACE_DAYS } from '@/lib/constants'
import { StatusDropdown } from '@/components/clients/status-dropdown'
import { QuickAddCall } from '@/components/clients/quick-add-call'
import type { ClientWithHealth, NutritionPhase } from '@/lib/types'

interface ClientTableProps {
  clients: ClientWithHealth[]
}

export function ClientTable({ clients }: ClientTableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const coachParam = searchParams.get('coach')
  const coachSuffix = coachParam ? `?coach=${coachParam}` : ''

  // Read filter values from URL search params (persist across navigation)
  const searchParam = searchParams.get('q') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const healthFilter = searchParams.get('health') ?? 'all'
  const badgeFilter = searchParams.get('badge') ?? 'all'
  const checkinFilter = searchParams.get('checkin') ?? 'all'

  // Local state for the search input — completely decoupled from Next.js router
  const [search, setSearchLocal] = useState(searchParam)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Silently update the URL without triggering Next.js navigation
  const replaceUrl = useCallback((params: URLSearchParams) => {
    const qs = params.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    window.history.replaceState(null, '', url)
  }, [pathname])

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '' || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const setSearch = useCallback((value: string) => {
    setSearchLocal(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (value === '') {
        params.delete('q')
      } else {
        params.set('q', value)
      }
      replaceUrl(params)
    }, 300)
  }, [replaceUrl])
  const setStatusFilter = useCallback((value: string) => setFilter('status', value), [setFilter])
  const setHealthFilter = useCallback((value: string) => setFilter('health', value), [setFilter])
  const setBadgeFilter = useCallback((value: string) => setFilter('badge', value), [setFilter])
  const setCheckinFilter = useCallback((value: string) => setFilter('checkin', value), [setFilter])

  // Defer the search value used for filtering so typing stays responsive
  const deferredSearch = useDeferredValue(search)

  const filtered = useMemo(() => clients.filter((client) => {
    const matchesSearch =
      `${client.first_name} ${client.last_name}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .includes(deferredSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    const matchesHealth = healthFilter === 'all' || client.health_score === healthFilter
    const matchesBadge =
      badgeFilter === 'all' ||
      (badgeFilter === 'renewed' && client.is_renewed) ||
      (badgeFilter === 'success_case' && client.is_success_case)
    const matchesCheckin =
      checkinFilter === 'all' ||
      (checkinFilter === 'yes' && client.has_recent_checkin) ||
      (checkinFilter === 'no' && !client.has_recent_checkin)
    return matchesSearch && matchesStatus && matchesHealth && matchesBadge && matchesCheckin
  }), [clients, deferredSearch, statusFilter, healthFilter, badgeFilter, checkinFilter])

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
          <option value="cancelled">Cancelado</option>
        </select>
        <select
          value={badgeFilter}
          onChange={(e) => setBadgeFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todas las insignias</option>
          <option value="renewed">Renovado</option>
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
        <select
          value={checkinFilter}
          onChange={(e) => setCheckinFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Check-in Quincenal</option>
          <option value="yes">Sí</option>
          <option value="no">No</option>
        </select>
        <Link
          href={`/dashboard/clients/new${coachSuffix}`}
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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Check-in Quincenal</th>
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
                        href={`/dashboard/clients/${client.id}${coachSuffix}`}
                        className="font-medium hover:underline"
                      >
                        {client.first_name} {client.last_name}
                      </Link>
                      {client.is_birthday_today && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-medium text-pink-700"
                          title="¡Hoy es su cumpleaños!"
                        >
                          <Cake className="h-3 w-3" />
                          Cumpleaños
                        </span>
                      )}
                      {client.is_renewed && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', BADGE_CONFIG.renewed.colors)}>
                          {BADGE_CONFIG.renewed.label}
                        </span>
                      )}
                      {client.is_success_case && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', BADGE_CONFIG.success_case.colors)}>
                          {BADGE_CONFIG.success_case.label}
                        </span>
                      )}
                      {client.has_pending_phase_change && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                          title="Cambio de fase pendiente"
                        >
                          <ArrowRightCircle className="h-3 w-3" />
                          Cambio fase
                        </span>
                      )}
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
                  <td className="px-4 py-3 text-sm">
                    {(() => {
                      const daysSince = client.last_checkin_date
                        ? Math.floor((Date.now() - new Date(client.last_checkin_date).getTime()) / (1000 * 60 * 60 * 24))
                        : null
                      const daysLeft = daysSince !== null ? Math.max(0, CHECKIN_GRACE_DAYS - daysSince) : 0
                      return (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            client.has_recent_checkin
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          )}>
                            {client.has_recent_checkin ? 'Sí' : 'No'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {client.has_recent_checkin
                              ? `${daysLeft}d restantes`
                              : daysSince !== null ? `hace ${daysSince}d` : 'Sin check-in'}
                          </span>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <QuickAddCall
                      clientId={client.id}
                      callsThisMonth={client.calls_this_month}
                    />
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
