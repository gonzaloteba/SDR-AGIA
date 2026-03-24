'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { CheckIn } from '@/lib/types'

interface ProgressChartsProps {
  checkIns: CheckIn[]
}

export function ProgressCharts({ checkIns }: ProgressChartsProps) {
  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  )

  const data = sorted.map((ci) => ({
    date: new Date(ci.submitted_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    peso: ci.weight,
    energia: ci.energy_level,
    estres: ci.stress_level,
  }))

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        No hay check-ins registrados aún
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Peso */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          Peso (kg)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Energía y Estrés */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          Energía y Estrés (1-10)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="energia" name="Energía" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="estres" name="Estrés" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
