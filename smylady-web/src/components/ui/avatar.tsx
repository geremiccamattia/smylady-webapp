import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Custom Avatar components that bypass Radix's internal useImageLoadingStatus hook.
 *
 * Radix's AvatarPrimitive.Image creates a new Image() internally to pre-check
 * the image loading status, but does NOT pass crossOrigin to it. This causes
 * S3/cross-origin images to fail the CORS check, showing the fallback instead
 * of the actual image. See: https://github.com/radix-ui/primitives/issues/3312
 *
 * These custom components use a regular <img> with their own load/error state,
 * properly handling cross-origin images from S3.
 *
 * Additionally handles HEIC/HEIF images (iPhone default format) by converting
 * them to JPEG on-the-fly using heic2any, since browsers don't natively support HEIC.
 */

type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

/** Check if a URL points to a HEIC/HEIF image */
function isHeicUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0] // remove query params
  return lower.endsWith('.heic') || lower.endsWith('.heif')
}

const AvatarContext = React.createContext<{
  imageStatus: ImageLoadingStatus
  setImageStatus: (status: ImageLoadingStatus) => void
}>({
  imageStatus: 'idle',
  setImageStatus: () => {},
})

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [imageStatus, setImageStatus] = React.useState<ImageLoadingStatus>('idle')

  return (
    <AvatarContext.Provider value={{ imageStatus, setImageStatus }}>
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, alt, ...props }, ref) => {
  const { setImageStatus } = React.useContext(AvatarContext)
  const [displaySrc, setDisplaySrc] = React.useState<string | undefined>(src)
  const objectUrlRef = React.useRef<string | null>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)

  // Combine refs
  const setRefs = React.useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }, [ref])

  React.useEffect(() => {
    // Clean up previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    if (!src) {
      setDisplaySrc(undefined)
      setImageStatus('idle')
      return
    }

    // HEIC images require fetch() for conversion, which fails without CORS headers on S3.
    // Show fallback immediately for HEIC URLs until they are re-uploaded (backend converts on upload).
    if (isHeicUrl(src)) {
      console.warn('[Avatar] HEIC image detected, showing fallback (CORS blocks fetch):', src)
      setImageStatus('error')
      return
    }

    // For known extensions or data/blob URLs, load directly
    setDisplaySrc(src)
    setImageStatus('loading')
  }, [src, setImageStatus])

  /**
   * When the <img> fails to load (onError), show fallback.
   * HEIC conversion via fetch() is disabled due to S3 CORS restrictions.
   */
  const handleImageError = React.useCallback(() => {
    // Log once for debugging
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      console.warn('[Avatar] Image failed to load (possible HEIC or CORS issue):', src)
    }
    setImageStatus('error')
  }, [src, setImageStatus])

  // Check if image is already loaded (cached) after render
  // Also detect if image loaded but has 0 dimensions (possible HEIC that browser can't render)
  React.useEffect(() => {
    const img = imgRef.current
    if (!img || !displaySrc) return

    // If already complete
    if (img.complete) {
      if (img.naturalWidth > 0) {
        setImageStatus('loaded')
      } else if (!objectUrlRef.current && src && !src.startsWith('data:') && !src.startsWith('blob:')) {
        // Image "loaded" but has no dimensions - likely HEIC that browser can't render
        // Trigger HEIC conversion
        handleImageError()
      }
    }
  }, [displaySrc, setImageStatus, src, handleImageError])

  // Clean up object URL on unmount
  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  if (!displaySrc) {
    return null
  }

  return (
    <img
      ref={setRefs}
      src={displaySrc}
      alt={alt || ""}
      referrerPolicy="no-referrer"
      className={cn("absolute inset-0 aspect-square h-full w-full object-cover", className)}
      onLoad={() => setImageStatus('loaded')}
      onError={handleImageError}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { imageStatus } = React.useContext(AvatarContext)

  // Only show fallback when there's no image src (idle) or image failed to load (error)
  if (imageStatus === 'loaded') {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
