'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string
}

/**
 * Image component that gracefully handles broken/expired URLs
 * by showing a placeholder instead of a broken image icon.
 */
export function SafeImage({ fallbackClassName, className, alt, ...props }: SafeImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${fallbackClassName || className || ''}`}>
        <div className="text-center text-muted-foreground">
          <ImageOff className="h-6 w-6 mx-auto mb-1" />
          <p className="text-[10px]">No disponible</p>
        </div>
      </div>
    )
  }

  return (
    <img
      {...props}
      className={className}
      alt={alt}
      onError={() => setError(true)}
    />
  )
}
