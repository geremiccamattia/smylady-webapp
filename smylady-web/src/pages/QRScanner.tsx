import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Html5Qrcode } from 'html5-qrcode'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  ScanLine,
  Loader2,
  User,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventsService } from '@/services/events'
import { ticketsService } from '@/services/tickets'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type ScanStatus = 'valid' | 'invalid' | 'already_scanned' | null

interface ScanResult {
  status: ScanStatus
  message: string
  ticketId?: string
  userName?: string
  scannedAt?: string
}

interface ScanStatistics {
  totalTickets: number
  scannedCount: number
  invalidCount: number
  duplicateCount: number
  pendingCount: number
}

export default function QRScanner() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [isScanning, setIsScanning] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [statistics, setStatistics] = useState<ScanStatistics>({
    totalTickets: 0,
    scannedCount: 0,
    invalidCount: 0,
    duplicateCount: 0,
    pendingCount: 0,
  })

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEventById(eventId!),
    enabled: !!eventId,
  })

  // Fetch backend scan statistics (like mobile app) with 30s auto-refresh
  const { data: backendStats } = useQuery({
    queryKey: ['scanStatistics', eventId],
    queryFn: () => ticketsService.getScanStatistics(eventId!),
    enabled: !!eventId,
    refetchInterval: 30000,
    staleTime: 30000,
  })

  // Sync backend stats into local state on load
  const syncStats = useCallback(() => {
    if (backendStats) {
      setStatistics(prev => ({
        ...prev,
        totalTickets: backendStats.totalTickets || 0,
        scannedCount: backendStats.scannedTickets || 0,
        pendingCount: backendStats.pendingTickets || 0,
      }))
    }
  }, [backendStats])

  useEffect(() => {
    syncStats()
  }, [syncStats])

  // Verify QR code mutation - matches mobile app flow
  const verifyMutation = useMutation({
    mutationFn: async (qrData: { ticketId: string; verificationCode: string; eventId: string }) => {
      // Verify the ticket via backend (backend also handles marking as scanned)
      const verifyResult = await ticketsService.verifyTicket(qrData.ticketId, qrData.verificationCode, qrData.eventId)
      return verifyResult
    },
    onSuccess: (result) => {
      // Backend verify-qr returns: { alreadyScanned, ticketId, userName, scannedAt? }
      const ticketId = result.ticketId || ''
      const userName = result.userName || 'Gast'

      if (result.alreadyScanned) {
        // Already scanned
        setScanResult({
          status: 'already_scanned',
          message: t('qrScanner.alreadyScanned', { defaultValue: 'Ticket bereits gescannt' }),
          ticketId,
          userName,
          scannedAt: result.scannedAt,
        })
        setStatistics(prev => ({ ...prev, duplicateCount: prev.duplicateCount + 1 }))
      } else {
        // Valid ticket - successfully scanned
        setScanResult({
          status: 'valid',
          message: t('qrScanner.validTicket', { defaultValue: 'Ticket gültig' }),
          ticketId,
          userName,
        })
        setStatistics(prev => ({
          ...prev,
          scannedCount: prev.scannedCount + 1,
          pendingCount: Math.max(0, prev.pendingCount - 1),
        }))
      }

      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['scanStatistics', eventId] })
    },
    onError: (error: any) => {
      // Backend returns error response with message for invalid tickets
      const errorMessage = error?.response?.data?.message || t('qrScanner.invalidTicket', { defaultValue: 'Ungültiges Ticket' })
      setScanResult({
        status: 'invalid',
        message: errorMessage,
      })
      setStatistics(prev => ({ ...prev, invalidCount: prev.invalidCount + 1 }))
    },
  })

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission()
  }, [])

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setCameraPermission(result.state as 'granted' | 'denied' | 'prompt')

      result.addEventListener('change', () => {
        setCameraPermission(result.state as 'granted' | 'denied' | 'prompt')
      })
    } catch {
      // Firefox doesn't support camera permission query, assume prompt
      setCameraPermission('prompt')
    }
  }

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
      startScanner()
    } catch (err) {
      setCameraPermission('denied')
      toast({
        title: t('qrScanner.cameraPermissionTitle'),
        description: t('qrScanner.cameraPermissionText'),
        variant: 'destructive',
      })
    }
  }

  const startScanner = async () => {
    if (!containerRef.current) return

    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        undefined
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Scanner start error:', err)
      setCameraPermission('denied')
      toast({
        title: t('qrScanner.cameraPermissionTitle'),
        description: t('qrScanner.cameraPermissionText'),
        variant: 'destructive',
      })
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch {
        // Ignore errors when stopping
      }
    }
    setIsScanning(false)
  }

  const onScanSuccess = (decodedText: string) => {
    // Pause scanning
    if (scannerRef.current) {
      scannerRef.current.pause()
    }

    try {
      const qrData = JSON.parse(decodedText)
      const { ticketId, verificationCode, eventId: qrEventId } = qrData

      // Validate QR code structure
      if (!ticketId || !verificationCode || !qrEventId) {
        setScanResult({
          status: 'invalid',
          message: t('qrScanner.invalidQRCode'),
        })
        return
      }

      // Check if QR code is for this event
      if (qrEventId !== eventId) {
        setScanResult({
          status: 'invalid',
          message: t('qrScanner.wrongEvent'),
        })
        return
      }

      // Verify with backend
      verifyMutation.mutate({ ticketId, verificationCode, eventId: eventId! })
    } catch {
      setScanResult({
        status: 'invalid',
        message: t('qrScanner.invalidQRFormat'),
      })
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    if (scannerRef.current) {
      scannerRef.current.resume()
    }
  }

  const getStatusIcon = () => {
    if (!scanResult) return null

    switch (scanResult.status) {
      case 'valid':
        return <CheckCircle className="w-20 h-20 text-green-500" />
      case 'already_scanned':
        return <AlertTriangle className="w-20 h-20 text-yellow-500" />
      case 'invalid':
        return <XCircle className="w-20 h-20 text-red-500" />
    }
  }

  const getStatusColor = () => {
    if (!scanResult) return ''

    switch (scanResult.status) {
      case 'valid':
        return 'bg-green-500/90'
      case 'already_scanned':
        return 'bg-yellow-500/90'
      case 'invalid':
        return 'bg-red-500/90'
    }
  }

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <XCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Event nicht gefunden</h2>
        <Button onClick={() => navigate(-1)}>Zurück</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <h1 className="text-white font-semibold truncate max-w-[200px]">
          {event.name}
        </h1>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            asChild
          >
            <Link to={`/scan/${eventId}/statistics?name=${encodeURIComponent(event?.name || '')}`}>
              <ExternalLink className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="absolute top-16 left-4 right-4 z-20">
          <Card className="bg-black/80 border-white/20 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t('qrScanner.statistics.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                <div className="border-l-2 border-l-pink-500 pl-2">
                  <p className="text-white/70">{t('scanStatistics.totalTickets', { defaultValue: 'Gesamt' })}</p>
                  <p className="text-2xl font-bold text-pink-400">{statistics.totalTickets}</p>
                </div>
                <div className="border-l-2 border-l-green-500 pl-2">
                  <p className="text-white/70">{t('scanStatistics.scanned', { defaultValue: 'Gescannt' })}</p>
                  <p className="text-2xl font-bold text-green-400">{statistics.scannedCount}</p>
                </div>
                <div className="border-l-2 border-l-orange-500 pl-2">
                  <p className="text-white/70">{t('scanStatistics.pending', { defaultValue: 'Ausstehend' })}</p>
                  <p className="text-2xl font-bold text-orange-400">{statistics.pendingCount}</p>
                </div>
              </div>
              {statistics.totalTickets > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>{t('scanStatistics.progress', { defaultValue: 'Fortschritt' })}</span>
                    <span>{statistics.totalTickets > 0 ? Math.round((statistics.scannedCount / statistics.totalTickets) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all"
                      style={{ width: `${statistics.totalTickets > 0 ? (statistics.scannedCount / statistics.totalTickets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link to={`/scan/${eventId}/statistics?name=${encodeURIComponent(event?.name || '')}`}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t('scanStatistics.title', { defaultValue: 'Alle Scan-Statistiken' })}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Camera View / Permission Request */}
      <div className="relative w-full h-screen" ref={containerRef}>
        {cameraPermission === 'denied' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
            <CameraOff className="w-20 h-20 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('qrScanner.cameraPermissionTitle')}</h2>
            <p className="text-gray-400 mb-6">{t('qrScanner.cameraPermissionText')}</p>
            <Button onClick={requestCameraPermission}>
              {t('qrScanner.grantPermission')}
            </Button>
          </div>
        ) : !isScanning ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
            <Camera className="w-20 h-20 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('qrScanner.title')}</h2>
            <p className="text-gray-400 mb-6">{t('qrScanner.scanInstruction')}</p>
            <Button onClick={cameraPermission === 'granted' ? startScanner : requestCameraPermission}>
              <ScanLine className="w-4 h-4 mr-2" />
              Scanner starten
            </Button>
          </div>
        ) : (
          <>
            {/* QR Reader Container */}
            <div id="qr-reader" className="w-full h-full" />

            {/* Scanner Frame Overlay */}
            {!scanResult && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-64">
                  {/* Corner borders */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary" />
                </div>
              </div>
            )}

            {/* Instruction Text */}
            {!scanResult && (
              <div className="absolute bottom-24 left-0 right-0 text-center">
                <p className="text-white text-lg">{t('qrScanner.scanInstruction')}</p>
              </div>
            )}
          </>
        )}

        {/* Scan Result Overlay */}
        {scanResult && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center z-30',
            getStatusColor()
          )}>
            <div className="text-center text-white p-8">
              {getStatusIcon()}

              <h2 className="text-2xl font-bold mt-4 mb-2">
                {scanResult.message}
              </h2>

              {scanResult.userName && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-lg">{scanResult.userName}</span>
                </div>
              )}

              {scanResult.scannedAt && (
                <p className="text-white/80 text-sm mb-6">
                  {t('qrScanner.scannedAt', {
                    time: new Date(scanResult.scannedAt).toLocaleTimeString('de-DE'),
                  })}
                </p>
              )}

              <div className="space-y-3 mt-8">
                <Button
                  onClick={resetScanner}
                  className="w-full bg-white text-black hover:bg-white/90"
                >
                  {t('qrScanner.scanNext')}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="w-full border-white text-white hover:bg-white/10"
                >
                  {t('qrScanner.done')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {verifyMutation.isPending && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-40">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
            <p className="text-white mt-4">{t('qrScanner.verifying')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
