import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AlertOctagon,
  AlertCircle,
  UserX,
  Swords,
  MessageSquareWarning,
  EyeOff,
  Copyright,
  MoreHorizontal,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { reportsService, ReportType, ReportReason, CreateReportPayload } from '@/services/reports'
import { cn } from '@/lib/utils'

interface ReportModalProps {
  open: boolean
  onClose: () => void
  contentType: 'memory' | 'comment' | 'post' | 'user' | 'event'
  // Required context based on content type
  ticketId?: string
  eventId?: string
  memoryIndex?: number
  commentId?: string
  postId?: string
  reportedUserId?: string
}

interface ReportReasonOption {
  key: ReportReason
  icon: React.ReactNode
  label: string
  labelEn: string
}

const REPORT_REASONS: ReportReasonOption[] = [
  { key: 'spam', icon: <AlertOctagon className="w-5 h-5" />, label: 'Spam', labelEn: 'Spam' },
  { key: 'inappropriate', icon: <AlertCircle className="w-5 h-5" />, label: 'Unangemessen', labelEn: 'Inappropriate' },
  { key: 'harassment', icon: <UserX className="w-5 h-5" />, label: 'Belästigung', labelEn: 'Harassment' },
  { key: 'violence', icon: <Swords className="w-5 h-5" />, label: 'Gewalt', labelEn: 'Violence' },
  { key: 'hate_speech', icon: <MessageSquareWarning className="w-5 h-5" />, label: 'Hassrede', labelEn: 'Hate Speech' },
  { key: 'nudity', icon: <EyeOff className="w-5 h-5" />, label: 'Nacktheit', labelEn: 'Nudity' },
  { key: 'copyright', icon: <Copyright className="w-5 h-5" />, label: 'Urheberrecht', labelEn: 'Copyright' },
  { key: 'other', icon: <MoreHorizontal className="w-5 h-5" />, label: 'Sonstiges', labelEn: 'Other' },
]

export default function ReportModal({
  open,
  onClose,
  contentType,
  ticketId,
  eventId,
  memoryIndex,
  commentId,
  postId,
  reportedUserId,
}: ReportModalProps) {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')

  // Create report mutation
  const reportMutation = useMutation({
    mutationFn: (payload: CreateReportPayload) => reportsService.createReport(payload),
    onSuccess: () => {
      toast({
        title: t('report.success'),
        description: t('report.successDescription'),
      })
      handleClose()
    },
    onError: () => {
      toast({
        title: t('errors.general'),
        description: t('report.errorDescription'),
        variant: 'destructive',
      })
    },
  })

  const handleClose = () => {
    setSelectedReason(null)
    setDetails('')
    onClose()
  }

  const handleSubmit = () => {
    if (!selectedReason) return

    // Map content type to report type
    const typeMap: Record<typeof contentType, ReportType> = {
      memory: 'memory',
      comment: 'memory_comment',
      post: 'post',
      user: 'user',
      event: 'event',
    }

    const payload: CreateReportPayload = {
      type: typeMap[contentType],
      reason: selectedReason,
      details: details.trim() || undefined,
      ticketId,
      eventId,
      memoryIndex,
      commentId,
      postId,
      reportedUserId,
    }

    reportMutation.mutate(payload)
  }

  const getTitle = () => {
    const titles = {
      memory: { de: 'Foto/Video melden', en: 'Report Photo/Video' },
      comment: { de: 'Kommentar melden', en: 'Report Comment' },
      post: { de: 'Beitrag melden', en: 'Report Post' },
      user: { de: 'Benutzer melden', en: 'Report User' },
      event: { de: 'Event melden', en: 'Report Event' },
    }
    const lang = i18n.language === 'de' ? 'de' : 'en'
    return titles[contentType][lang]
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">{getTitle()}</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Report reason selection */}
          <div>
            <p className="text-sm font-medium mb-3">
              {i18n.language === 'de' ? 'Grund für die Meldung' : 'Reason for Report'}
            </p>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.key}
                  type="button"
                  onClick={() => setSelectedReason(reason.key)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    selectedReason === reason.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted border-border'
                  )}
                >
                  {reason.icon}
                  <span className="flex-1 text-left">
                    {i18n.language === 'de' ? reason.label : reason.labelEn}
                  </span>
                  {selectedReason === reason.key && (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Details textarea */}
          <div>
            <p className="text-sm font-medium mb-2">
              {i18n.language === 'de' ? 'Weitere Details (optional)' : 'Additional Details (optional)'}
            </p>
            <textarea
              value={details}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDetails(e.target.value)}
              placeholder={
                i18n.language === 'de'
                  ? 'Beschreiben Sie das Problem genauer...'
                  : 'Describe the issue in more detail...'
              }
              maxLength={500}
              className="w-full min-h-[100px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {details.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || reportMutation.isPending}
              className="flex-1"
            >
              {reportMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {i18n.language === 'de' ? 'Melden' : 'Report'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
