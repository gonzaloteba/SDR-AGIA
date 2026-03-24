'use client'

import { useState } from 'react'
import { ClipboardCheck, Download, Camera, X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SafeImage } from '@/components/ui/safe-image'
import type { CheckIn } from '@/lib/types'

interface CheckinHistoryProps {
  checkIns: CheckIn[]
}

function ScoreBar({ value, max = 10, label }: { value: number; max?: number; label: string }) {
  const pct = (value / max) * 100
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TrendIndicator({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return null
  const diff = current - previous
  if (Math.abs(diff) < 0.1) return <Minus className="h-3 w-3 text-muted-foreground" />
  if (diff > 0) return <TrendUp value={diff} />
  return <TrendDown value={diff} />
}

function TrendUp({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-red-500">
      <TrendingUp className="h-3 w-3" />
      +{value.toFixed(1)}
    </span>
  )
}

function TrendDown({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-emerald-500">
      <TrendingDown className="h-3 w-3" />
      {value.toFixed(1)}
    </span>
  )
}

function PhotoGallery({ photos, date }: { photos: string[]; date: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="mt-3">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Camera className="h-3 w-3" />
          Fotos de progreso ({photos.length})
        </p>
        <div className="flex gap-2 flex-wrap">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="relative group rounded-lg overflow-hidden border hover:border-primary transition-colors"
            >
              <SafeImage
                src={url}
                alt={`Progreso ${date} - ${i + 1}`}
                className="h-24 w-24 object-cover"
                fallbackClassName="h-24 w-24"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <SafeImage
              src={photos[lightboxIndex]}
              alt={`Progreso ${date} - ${lightboxIndex + 1}`}
              className="max-h-[85vh] rounded-lg object-contain"
              fallbackClassName="h-64 w-64 rounded-lg"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <a
                href={photos[lightboxIndex]}
                download={`progreso-${date}-${lightboxIndex + 1}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-4 w-4 text-gray-700" />
              </a>
              <button
                onClick={() => setLightboxIndex(null)}
                className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
              >
                <X className="h-4 w-4 text-gray-700" />
              </button>
            </div>
            {photos.length > 1 && (
              <>
                {lightboxIndex > 0 && (
                  <button
                    onClick={() => setLightboxIndex(lightboxIndex - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                )}
                {lightboxIndex < photos.length - 1 && (
                  <button
                    onClick={() => setLightboxIndex(lightboxIndex + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                )}
              </>
            )}
            <p className="text-center text-white/70 text-sm mt-2">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function CheckinCard({ checkIn, previousCheckIn }: { checkIn: CheckIn; previousCheckIn: CheckIn | null }) {
  const dateStr = new Date(checkIn.submitted_at).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const photos = checkIn.photo_urls || []

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium capitalize">{dateStr}</p>
        </div>
      </div>

      {/* Peso */}
      {checkIn.weight && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Peso</p>
              <div className="flex items-center gap-1">
                <span className="font-medium">{checkIn.weight} kg</span>
                <TrendIndicator current={checkIn.weight} previous={previousCheckIn?.weight ?? null} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Horas de sueño */}
      {checkIn.sleep_hours && (
        <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">Horas de sueño</p>
          <p className="font-medium">{checkIn.sleep_hours}</p>
        </div>
      )}

      {/* Score bars - Energía y Estrés */}
      {(checkIn.energy_level || checkIn.stress_level) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {checkIn.energy_level && <ScoreBar value={checkIn.energy_level} label="Energía" />}
          {checkIn.stress_level && <ScoreBar value={checkIn.stress_level} label="Estrés" />}
        </div>
      )}

      {/* Photo gallery */}
      <PhotoGallery
        photos={photos}
        date={new Date(checkIn.submitted_at).toISOString().split('T')[0]}
      />
    </div>
  )
}

export function CheckinHistory({ checkIns }: CheckinHistoryProps) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)

  if (checkIns.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        No hay check-ins registrados aún
      </div>
    )
  }

  // Check-ins come sorted by submitted_at DESC from the server
  const allPhotos = checkIns.flatMap((ci) => (ci.photo_urls || []).map((url) => ({
    url,
    date: ci.submitted_at,
  })))

  // First photo ever (oldest) for comparison — last in the array since sorted DESC
  const firstPhoto = allPhotos.length > 0 ? allPhotos[allPhotos.length - 1] : null
  const selectedPhoto = galleryIndex !== null ? allPhotos[galleryIndex] : null
  const isFirstPhoto = galleryIndex === allPhotos.length - 1

  return (
    <div className="space-y-6">
      {/* Photo timeline (all photos across check-ins) */}
      {allPhotos.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Galería de Progreso ({allPhotos.length} fotos)
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {allPhotos.map((photo, i) => (
              <div key={i} className="shrink-0">
                <button
                  onClick={() => setGalleryIndex(i)}
                  className="block rounded-lg overflow-hidden border hover:border-primary transition-colors relative group"
                >
                  <SafeImage
                    src={photo.url}
                    alt={`Progreso ${i + 1}`}
                    className="h-32 w-32 object-cover"
                    fallbackClassName="h-32 w-32"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {new Date(photo.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Lightbox with comparison */}
      {galleryIndex !== null && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setGalleryIndex(null)}
        >
          <div className="relative mx-4 max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Top bar */}
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-between">
              <p className="text-white/70 text-sm">
                {galleryIndex + 1} / {allPhotos.length}
              </p>
              <div className="flex gap-2">
                <a
                  href={selectedPhoto.url}
                  download={`progreso-${new Date(selectedPhoto.date).toISOString().split('T')[0]}-${galleryIndex + 1}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                  title="Descargar"
                >
                  <Download className="h-4 w-4 text-gray-700" />
                </a>
                <button
                  onClick={() => setGalleryIndex(null)}
                  className="rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                  title="Cerrar"
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Comparison view */}
            <div className={`flex items-center justify-center gap-1 ${!isFirstPhoto && firstPhoto ? '' : ''}`}>
              {/* Selected photo (left) */}
              <div className="flex-1 flex flex-col items-center">
                <p className="text-white/70 text-xs mb-2">
                  {isFirstPhoto ? 'Primera foto — ' : ''}
                  {new Date(selectedPhoto.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <SafeImage
                  src={selectedPhoto.url}
                  alt={`Progreso ${galleryIndex + 1}`}
                  className="max-h-[75vh] rounded-lg object-contain w-full"
                  fallbackClassName="h-64 w-full rounded-lg"
                />
              </div>
              {/* First photo (reference, right) — only show when viewing a different photo */}
              {!isFirstPhoto && firstPhoto && (
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-white/70 text-xs mb-2">
                    Primera foto — {new Date(firstPhoto.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <SafeImage
                    src={firstPhoto.url}
                    alt="Primera foto de progreso"
                    className="max-h-[75vh] rounded-lg object-contain w-full"
                    fallbackClassName="h-64 w-full rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Navigation arrows */}
            {allPhotos.length > 1 && (
              <>
                {galleryIndex > 0 && (
                  <button
                    onClick={() => setGalleryIndex(galleryIndex - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                )}
                {galleryIndex < allPhotos.length - 1 && (
                  <button
                    onClick={() => setGalleryIndex(galleryIndex + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Check-in cards */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          Historial de Check-ins ({checkIns.length})
        </h3>
        <div className="space-y-4">
          {checkIns.map((ci, index) => (
            <CheckinCard
              key={ci.id}
              checkIn={ci}
              previousCheckIn={index < checkIns.length - 1 ? checkIns[index + 1] : null}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
