import { useState, useEffect, useRef } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Check if a URL points to a HEIC/HEIF image */
function isHeicUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0]
  return lower.endsWith('.heic') || lower.endsWith('.heif')
}

/** Hook that converts HEIC URLs to displayable blob URLs */
function useHeicImage(src: string | undefined): string | undefined {
  const [displaySrc, setDisplaySrc] = useState(src)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    if (!src) {
      setDisplaySrc(undefined)
      return
    }

    if (!isHeicUrl(src)) {
      setDisplaySrc(src)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(src)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        const heic2any = (await import('heic2any')).default
        const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.85 })
        if (cancelled) return
        const resultBlob = Array.isArray(converted) ? converted[0] : converted
        const objectUrl = URL.createObjectURL(resultBlob)
        objectUrlRef.current = objectUrl
        setDisplaySrc(objectUrl)
      } catch {
        if (!cancelled) setDisplaySrc(src) // fallback to original
      }
    })()

    return () => { cancelled = true }
  }, [src])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  return displaySrc
}

interface ImageViewerProps {
  images: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  alt?: string
}

export function ImageViewer({ images, initialIndex = 0, isOpen, onClose, alt = 'Image' }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    setZoom(1)
    setRotation(0)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    setZoom(1)
    setRotation(0)
  }

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom((prev) => Math.min(prev + 0.5, 4))
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom((prev) => Math.max(prev - 0.5, 0.5))
  }

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(images[currentIndex])
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `image-${currentIndex + 1}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && images.length > 1) {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
      setZoom(1)
      setRotation(0)
    } else if (e.key === 'ArrowRight' && images.length > 1) {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
      setZoom(1)
      setRotation(0)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!images.length) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/95" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none"
          onKeyDown={handleKeyDown}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 h-10 w-10"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-white/30 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={handleRotate}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 rounded-full px-4 py-2">
              <span className="text-white text-sm">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <div
            className="flex items-center justify-center w-full h-full p-16 cursor-zoom-out"
            onClick={onClose}
          >
            <HeicAwareImage
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className={cn(
                "max-w-full max-h-full object-contain transition-transform duration-200",
                "cursor-default"
              )}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

/** Image component that handles HEIC/HEIF conversion transparently */
function HeicAwareImage({ src, alt, onError, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const displaySrc = useHeicImage(src || undefined)

  return (
    <img
      src={displaySrc || ''}
      alt={alt || ''}
      onError={onError || ((e) => {
        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+not+found'
      })}
      {...props}
    />
  )
}

// Simple wrapper for single clickable images
interface ClickableImageProps {
  src: string
  alt?: string
  className?: string
  containerClassName?: string
}

export function ClickableImage({ src, alt = 'Image', className, containerClassName }: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div 
        className={cn("cursor-pointer", containerClassName)}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-full object-cover", className)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image'
          }}
        />
      </div>
      <ImageViewer
        images={[src]}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        alt={alt}
      />
    </>
  )
}

// Avatar with fullscreen view
interface ClickableAvatarProps {
  src?: string
  alt?: string
  fallback?: React.ReactNode
  className?: string
  avatarClassName?: string
}

export function ClickableAvatar({ src, alt = 'Profile', fallback, className, avatarClassName }: ClickableAvatarProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!src) {
    return <div className={className}>{fallback}</div>
  }

  return (
    <>
      <div 
        className={cn("cursor-pointer", className)}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
      >
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-full object-cover rounded-full", avatarClassName)}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
      <ImageViewer
        images={[src]}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        alt={alt}
      />
    </>
  )
}

export default ImageViewer
