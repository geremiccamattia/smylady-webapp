import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Square, RectangleHorizontal, RectangleVertical, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

type AspectRatioOption = 'original' | 'square' | 'portrait' | 'landscape'

interface AspectRatioConfig {
  label: string
  value: number
  icon: React.ReactNode
}

interface ImageCropModalProps {
  open: boolean
  imageUrl: string
  onClose: () => void
  onCropComplete: (croppedFile: File) => void
  aspectRatio?: number
  freeStyle?: boolean
  title?: string
}

// Create cropped image from canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputType = 'image/jpeg'
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to the crop area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Convert canvas to blob and then to File
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        // Generate unique filename with timestamp to prevent caching issues
        const uniqueFileName = `event_image_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`
        const file = new File([blob], uniqueFileName, {
          type: outputType,
        })
        resolve(file)
      },
      outputType,
      0.95
    )
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}

export function ImageCropModal({
  open,
  imageUrl,
  onClose,
  onCropComplete,
  aspectRatio: initialAspectRatio,
  freeStyle = true,
  title = 'Bild zuschneiden',
}: ImageCropModalProps) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioOption>(
    initialAspectRatio ? 'square' : 'original'
  )
  const [originalAspect, setOriginalAspect] = useState<number>(1)

  // Aspect ratio configurations
  const aspectRatios: Record<AspectRatioOption, AspectRatioConfig> = {
    original: { label: 'Original', value: originalAspect, icon: <Maximize2 className="h-4 w-4" /> },
    square: { label: '1:1', value: 1, icon: <Square className="h-4 w-4" /> },
    portrait: { label: '4:5', value: 4 / 5, icon: <RectangleVertical className="h-4 w-4" /> },
    landscape: { label: '16:9', value: 16 / 9, icon: <RectangleHorizontal className="h-4 w-4" /> },
  }

  const currentAspectRatio = initialAspectRatio || aspectRatios[selectedAspectRatio].value

  const onCropChange = useCallback((location: Point) => {
    setCrop(location)
  }, [])

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom)
  }, [])

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const onMediaLoaded = useCallback((mediaSize: { naturalWidth: number; naturalHeight: number }) => {
    setOriginalAspect(mediaSize.naturalWidth / mediaSize.naturalHeight)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return

    try {
      setIsProcessing(true)
      const croppedFile = await getCroppedImg(imageUrl, croppedAreaPixels)
      onCropComplete(croppedFile)
      onClose()
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Cropper Area */}
        <div className="relative h-[400px] bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={currentAspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            onMediaLoaded={onMediaLoaded}
            showGrid
            style={{
              containerStyle: {
                backgroundColor: '#000',
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4 border-t">
          {/* Zoom Slider */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground min-w-16">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Aspect Ratio Options */}
          {freeStyle && !initialAspectRatio && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground min-w-16">Format</span>
              <div className="flex gap-2">
                {(Object.keys(aspectRatios) as AspectRatioOption[]).map((option) => (
                  <Button
                    key={option}
                    variant={selectedAspectRatio === option ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'gap-1.5',
                      selectedAspectRatio === option && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => setSelectedAspectRatio(option)}
                  >
                    {aspectRatios[option].icon}
                    <span className="text-xs">{aspectRatios[option].label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 pt-0">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing || !croppedAreaPixels}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verarbeite...
              </>
            ) : (
              'Übernehmen'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
