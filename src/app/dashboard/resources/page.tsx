'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Plus, Copy, Trash2, ExternalLink, X } from 'lucide-react'

interface Resource {
  id: string
  title: string
  url: string
  category: string
  description: string | null
  created_at: string
}

const CATEGORIES = [
  { value: 'loom', label: 'Loom / Video' },
  { value: 'formulario', label: 'Formulario' },
  { value: 'trainingpeaks', label: 'TrainingPeaks' },
  { value: 'general', label: 'General' },
]

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  const supabase = createClient()

  async function fetchResources() {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('category')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching resources:', error)
      toast('Error al cargar recursos', 'error')
      setLoading(false)
      return
    }
    setResources(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return

    setSaving(true)
    const { error } = await supabase.from('resources').insert({
      title: title.trim(),
      url: url.trim(),
      category,
      description: description.trim() || null,
    })

    if (error) {
      console.error('Error saving resource:', error)
      toast('Error al guardar el recurso: ' + error.message, 'error')
      setSaving(false)
      return
    }

    toast('Recurso añadido correctamente', 'success')
    setTitle('')
    setUrl('')
    setCategory('general')
    setDescription('')
    setShowForm(false)
    setSaving(false)
    fetchResources()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (error) {
      toast('Error al eliminar el recurso', 'error')
      return
    }
    toast('Recurso eliminado', 'success')
    setResources(prev => prev.filter(r => r.id !== id))
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url)
    toast('URL copiada al portapapeles', 'success')
  }

  // Group resources by category
  const grouped = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    const cat = r.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {})

  const categoryLabel = (key: string) =>
    CATEGORIES.find(c => c.value === key)?.label || key

  return (
    <div>
      <Header title="Recursos" />
      <div className="p-6">
        <div className="max-w-3xl space-y-6">
          {/* Add button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Añadir recurso
                </>
              )}
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border bg-card p-6 shadow-sm space-y-4"
            >
              <h3 className="font-medium">Nuevo recurso</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej: Loom Plan Alimentación Fase 1"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.loom.com/share/..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Breve descripción del recurso"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar recurso'}
                </button>
              </div>
            </form>
          )}

          {/* Resources list */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Cargando recursos...
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
              <p className="text-muted-foreground text-sm">
                No hay recursos todavía. Añade el primero con el botón de arriba.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabel(cat)}
                </h3>
                <div className="space-y-2">
                  {items.map(resource => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {resource.title}
                        </p>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {resource.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {resource.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(resource.url)}
                          title="Copiar URL"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir enlace"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          title="Eliminar"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
