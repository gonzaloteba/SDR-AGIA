'use client'

import { useRouter, usePathname } from 'next/navigation'

interface CoachOption {
  id: string
  full_name: string
}

interface CoachSelectorProps {
  coaches: CoachOption[]
  selectedCoachId: string | null
}

export function CoachSelector({ coaches, selectedCoachId }: CoachSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (value) {
      router.push(`${pathname}?coach=${value}`)
    } else {
      router.push(pathname)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2">
      <label htmlFor="coach-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Vista de coach:
      </label>
      <select
        id="coach-filter"
        value={selectedCoachId ?? ''}
        onChange={handleChange}
        className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Todos los coaches</option>
        {coaches.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name}
          </option>
        ))}
      </select>
    </div>
  )
}
