'use client'

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
import { complaintsService } from '@/services/complaints'
import { cn } from '@/lib/utils'

const REPORT_EMAIL = 'office@shareyourparty.de'

type ContentType = 'memory' | 'comment' | 'post' | 'user' | 'event' | 'story'

interface ReportModalProps {
  open: boolean
  onClose: () => void
  contentType: ContentType
  // Required context based on content type
  ticketId?: string
  eventId?: string
  memoryIndex?: number
  commentId?: string
  postId?: string
  reportedUserId?: string
  storyId?: string
}

interface ReportReasonOption {
  key: ReportReason
  icon: React.ReactNode
  fallback: string
}

const REPORT_REASONS: ReportReasonOption[] = [
  { key: 'spam', icon: <AlertOctagon className="w-5 h-5" />, fallback: 'Spam' },
  { key: 'inappropriate', icon: <AlertCircle className="w-5 h-5" />, fallback: 'Unangemessen' },
  { key: 'harassment', icon: <UserX className="w-5 h-5" />, fallback: 'Belästigung' },
  { key: 'violence', icon: <Swords className="w-5 h-5" />, fallback: 'Gewalt' },
  { key: 'hate_speech', icon: <MessageSquareWarning className="w-5 h-5" />, fallback: 'Hassrede' },
  { key: 'nudity', icon: <EyeOff className="w-5 h-5" />, fallback: 'Nacktheit' },
  { key: 'copyright', icon: <Copyright className="w-5 h-5" />, fallback: 'Urheberrecht' },
  { key: 'other', icon: <MoreHorizontal className="w-5 h-5" />, fallback: 'Sonstiges' },
]

const TITLE_DEFAULTS: Record<ContentType, string> = {
  memory: 'Foto/Video melden',
  comment: 'Kommentar melden',
  post: 'Beitrag melden',
  user: 'Nutzer melden',
  event: 'Event melden',
  story: 'Story melden',
}

/**
 * Melde-Dialog (Art. 16 DSA, M7). Alles geht an POST /reports — mit den
 * Pflichtfeldern je Typ: memory/memory_comment → ticketId + eventId,
 * user → reportedUserId, story → storyId, post → postId, event → eventId.
 *
 * Ausnahme Kommentar unter einem Beitrag (postId ohne ticketId): Dafür kennt
 * /reports keinen Typ, er geht wie bisher an /complaints/report-post-comment.
 */
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
  storyId,
}: ReportModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')

  const isPostComment = contentType === 'comment' && !!postId && !ticketId

  const reportMutation = useMutation({
    mutationFn: async (payload: CreateReportPayload) => {
      if (isPostComment) {
        return complaintsService.reportPostComment({
          postId: postId!,
          commentIndex: Number(commentId ?? 0),
          reason: payload.reason,
          details: payload.details,
        })
      }
      return reportsService.createReport(payload)
    },
    onSuccess: () => {
      toast({
        title: t('report.success'),
        description: t('report.successDescription'),
      })
      handleClose()
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { status?: number; data?: { message?: unknown } } })?.response
      const message = typeof response?.data?.message === 'string' ? response.data.message : null
      const selfReport = response?.status === 400 && !!message && /selbst|yourself|own/i.test(message)
      toast({
        title: t('errors.general'),
        description: selfReport
          ? t('report.selfReport', { defaultValue: 'Du kannst dich nicht selbst melden.' })
          : message || t('report.errorDescription'),
        variant: 'destructive',
      })
    },
  })

  const handleClose = () => {
    setSelectedReason(null)
    setDetails('')
    onClose()
  }

  // Ohne die Pflicht-ID für den Typ lehnt das Backend ab — dann gar nicht erst senden.
  const hasRequiredIds = (() => {
    switch (contentType) {
      case 'memory':
        return !!ticketId && !!eventId
      case 'comment':
        return isPostComment || (!!ticketId && !!eventId)
      case 'user':
        return !!reportedUserId
      case 'story':
        return !!storyId
      case 'post':
        return !!postId
      case 'event':
        return !!eventId
    }
  })()

  const handleSubmit = () => {
    if (!selectedReason || !hasRequiredIds) return

    const typeMap: Record<ContentType, ReportType> = {
      memory: 'memory',
      comment: 'memory_comment',
      post: 'post',
      user: 'user',
      event: 'event',
      story: 'story',
    }

    // Nur die Felder des jeweiligen Typs mitsenden.
    const base = {
      type: typeMap[contentType],
      reason: selectedReason,
      details: details.trim() || undefined,
    }
    let payload: CreateReportPayload
    switch (contentType) {
      case 'memory':
      case 'comment':
        payload = { ...base, ticketId, eventId, memoryIndex, commentId }
        break
      case 'user':
        payload = { ...base, reportedUserId }
        break
      case 'story':
        payload = { ...base, storyId }
        break
      case 'post':
        payload = { ...base, postId }
        break
      case 'event':
        payload = { ...base, eventId }
        break
    }

    reportMutation.mutate(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-background rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">
            {t(`report.titles.${contentType}`, { defaultValue: TITLE_DEFAULTS[contentType] })}
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground" aria-label={t('common.close', { defaultValue: 'Schließen' })}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Report reason selection */}
          <div>
            <p className="text-sm font-medium mb-3">{t('report.selectReason')}</p>
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
                    {t(`report.reasons.${reason.key}`, { defaultValue: reason.fallback })}
                  </span>
                  {selectedReason === reason.key && <CheckCircle className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Details textarea */}
          <div>
            <p className="text-sm font-medium mb-2">{t('report.additionalDetails')}</p>
            <textarea
              value={details}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDetails(e.target.value)}
              placeholder={t('report.detailsPlaceholder')}
              maxLength={500}
              className="w-full min-h-[100px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{details.length}/500</p>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('report.emailAlternative', { defaultValue: 'Alternativ per E-Mail an' })}{' '}
            <a href={`mailto:${REPORT_EMAIL}`} className="text-primary hover:underline select-all">
              {REPORT_EMAIL}
            </a>
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || !hasRequiredIds || reportMutation.isPending}
              className="flex-1"
            >
              {reportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t('report.submit')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
