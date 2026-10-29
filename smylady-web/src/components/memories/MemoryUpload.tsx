'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { X, Upload, Image, Video, Loader2, Globe, Lock, Users, Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { memoriesService, type Memory } from '@/services/memories'
import { apiClient } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import MentionInput, { type MentionUser } from '@/components/mentionInput/MentionInput'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, resolveImageUrl, cn } from '@/lib/utils'

interface MemoryUploadProps {
  ticketId: string
  eventId: string
  onClose: () => void
  onSuccess: () => void
  isPublicEvent?: boolean
}

type PrivacyOption = 'public' | 'private' | 'custom'

interface UploadOutcome {
  /** Dateien, die beim Hochladen gescheitert sind, mit dem Grund. */
  failed: { name: string; reason: string }[]
  /** Anzahl der Dateien, die (in dieser oder einer früheren Runde) hochgeladen sind. */
  uploadedCount: number
  /** Medien im gerade angelegten Wall-Beitrag; 0 = keiner angelegt. */
  wallPostMedia: number
  /** Grund, falls der Wall-Beitrag scheiterte. */
  wallPostError: string | null
}

/**
 * Lesbarer Grund aus einem Fehler. Bei 429 setzt der Interceptor in
 * services/api.ts die Meldung bereits in error.message; sonst hat die
 * Meldung des Backends Vorrang vor dem rohen Axios-Text.
 */
function errorReason(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.status !== 429) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string' && message) return message
  }
  return error instanceof Error && error.message ? error.message : fallback
}

export default function MemoryUpload({ ticketId, eventId, onClose, onSuccess, isPublicEvent = false }: MemoryUploadProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  // Die IDs der in der Beschreibung markierten Personen. Wurden bisher
  // eingesammelt und verworfen — das Backend nimmt sie jetzt entgegen.
  const [captionMentions, setCaptionMentions] = useState<string[]>([])
  const [privacy, setPrivacy] = useState<PrivacyOption>('public')
  const [showViewerPicker, setShowViewerPicker] = useState(false)
  const [selectedViewers, setSelectedViewers] = useState<string[]>([])
  const [shareToWall, setShareToWall] = useState(false)
  /*
   * Was in dieser Sitzung schon hochgeladen ist. Ein zweiter Versuch nach
   * einem Teilfehler lädt nur die fehlenden Dateien hoch — sonst entstünden
   * Dubletten der bereits gespeicherten Erinnerungen. Gilt nur, solange das
   * Formular offen ist; das Backend kennt keinen Schutz gegen Dubletten.
   */
  const [uploaded, setUploaded] = useState<Map<File, Memory>>(() => new Map())
  // Der Wall-Beitrag entsteht genau einmal.
  const [wallPosted, setWallPosted] = useState(false)

  // Vorschau-URLs beim Schließen freigeben.
  const previewsRef = useRef<string[]>([])
  useEffect(() => {
    previewsRef.current = previews
  }, [previews])
  useEffect(() => () => previewsRef.current.forEach(url => URL.revokeObjectURL(url)), [])

  // Fetch event participants for custom privacy
  const { data: participants = [] } = useQuery({
    queryKey: ['eventParticipants', eventId],
    queryFn: () => memoriesService.getEventParticipants(eventId),
    enabled: !!eventId,
  })

  /*
   * Dieselben Teilnehmer als Vorschläge für die Markierungen in der
   * Beschreibung — markieren lässt sich nur, wer beim Event dabei war.
   * useMemo, damit die Liste eine stabile Referenz behält: MentionInput führt
   * sie in den Abhängigkeiten seiner Such-Callbacks.
   */
  const participantSuggestions: MentionUser[] = useMemo(
    () =>
      participants.map(p => ({
        id: p._id,
        name: p.name,
        username: p.username,
        profileImage: p.profileImage,
      })),
    [participants],
  )

  /*
   * Erst alle Dateien, dann EIN Wall-Beitrag mit allen Medien. Früher gab es
   * einen Beitrag pro Datei; fünf POST /posts kurz hintereinander liefen in
   * den Sekunden-Zähler des Throttlers (3/s), und ein Teil der Beiträge fehlte.
   *
   * Die Dateien gehen nacheinander hoch, wie bisher — parallel liefe man noch
   * schneller in denselben Zähler. Eine gescheiterte Datei bricht nicht ab.
   */
  const uploadMutation = useMutation({
    mutationFn: async (): Promise<UploadOutcome> => {
      if (!selectedFiles.length) throw new Error('No files selected')

      const done = new Map(uploaded)
      const failed: UploadOutcome['failed'] = []
      for (const file of selectedFiles) {
        if (done.has(file)) continue
        try {
          const memory = await memoriesService.uploadMemory(
            ticketId,
            file,
            caption,
            privacy,
            privacy === 'custom' ? selectedViewers : undefined,
            captionMentions
          )
          done.set(file, memory)
          setUploaded(new Map(done))
        } catch (error) {
          failed.push({ name: file.name, reason: errorReason(error, t('memories.uploadFailed')) })
        }
      }

      // In der Reihenfolge der Auswahl.
      const memories = selectedFiles.flatMap(file => done.get(file) ?? [])
      if (memories.length === 0) {
        throw new Error(failed[0]?.reason || t('memories.uploadFailed'))
      }

      let wallPostMedia = 0
      let wallPostError: string | null = null
      if (shareToWall && privacy === 'public' && !wallPosted) {
        const media = memories.flatMap(memory => {
          const url = memory.url || memory.fileUrl
          return url ? [{ url, type: memory.type === 'video' ? ('video' as const) : ('image' as const) }] : []
        })
        if (media.length > 0) {
          try {
            await apiClient.post('/posts', {
              text: caption || '',
              media,
              visibility: 'public',
              // Dieselben Markierungen wie die Erinnerung, in der Form von Feed und MemoryViewer.
              mentions: captionMentions.length > 0 ? captionMentions : undefined,
            })
            setWallPosted(true)
            wallPostMedia = media.length
          } catch (error) {
            wallPostError = errorReason(error, t('memories.wallPostFailedFallback'))
          }
        }
      }

      return { failed, uploadedCount: memories.length, wallPostMedia, wallPostError }
    },
    onSuccess: ({ failed, uploadedCount, wallPostMedia, wallPostError }) => {
      if (failed.length === 0 && !wallPostError) {
        toast({ title: t('common.success'), description: t('memories.uploadSuccess') })
        onSuccess()
        return
      }

      // Teilerfolg: Formular bleibt offen, damit ein zweiter Versuch nur das
      // Fehlende nachholt. Die Liste trotzdem auffrischen — die gelungenen
      // Erinnerungen sind gespeichert. Dieselben Schlüssel wie in den
      // onSuccess-Handlern von EventMemories und MemoryGallery.
      queryClient.invalidateQueries({ queryKey: ['eventMemories', eventId] })
      queryClient.invalidateQueries({ queryKey: ['memories', ticketId] })

      const lines: string[] = []
      if (failed.length > 0) {
        lines.push(
          t('memories.partialUploadFailed', {
            failed: failed.length,
            total: failed.length + uploadedCount,
            names: failed.map(f => f.name).join(', '),
            reason: failed[0].reason,
          }),
        )
      }
      if (wallPostMedia > 0 && failed.length > 0) {
        lines.push(t('memories.wallPostPartial', { count: wallPostMedia }))
      }
      if (wallPostError) {
        lines.push(t('memories.wallPostFailed', { reason: wallPostError }))
      }
      lines.push(t('memories.retryOnlyMissing'))
      toast({ title: t('common.error'), description: lines.join(' '), variant: 'destructive' })
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t('memories.uploadFailed'),
        variant: 'destructive',
      })
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isValidSize = file.size <= 50 * 1024 * 1024
      return (isImage || isVideo) && isValidSize
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
    // Synchron und in derselben Reihenfolge wie die Dateien. FileReader lieferte
    // asynchron, die Vorschauen konnten dabei die Reihenfolge tauschen — und
    // Entfernen per Index traf dann eine andere Datei als angezeigt.
    setPreviews(prev => [...prev, ...validFiles.map(file => URL.createObjectURL(file))])
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFiles.length) return
    uploadMutation.mutate()
  }

  const handlePrivacyChange = (newPrivacy: PrivacyOption) => {
    setPrivacy(newPrivacy)
    if (newPrivacy === 'custom') {
      setShowViewerPicker(true)
    } else {
      setSelectedViewers([])
    }
  }

  const toggleViewer = (userId: string) => {
    setSelectedViewers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const privacyOptions = [
    {
      value: 'public' as const,
      label: t('memories.privacyPublic'),
      description: t('memories.visibleToAll'),
      icon: Globe,
    },
    {
      value: 'private' as const,
      label: t('memories.privacyPrivate'),
      description: t('memories.onlyYouCanSee'),
      icon: Lock,
    },
    {
      value: 'custom' as const,
      label: t('memories.privacyCustom'),
      description: t('memories.selectedPeople'),
      icon: Users,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">{t('memories.uploadTitle')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    {selectedFiles[index]?.type.startsWith('video/') ? (
                      <video src={preview} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <img src={preview} alt="" className="w-full h-full object-cover rounded-lg" />
                    )}
                    {/* Schon hochgeladen: nicht mehr entfernbar, ein zweiter Versuch überspringt sie. */}
                    {selectedFiles[index] && uploaded.has(selectedFiles[index]) ? (
                      <span
                        title={t('memories.alreadyUploaded')}
                        className="absolute top-1 right-1 bg-green-600 rounded-full p-0.5 text-white"
                      >
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={uploadMutation.isPending}
                        className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary"
                >
                  <span className="text-2xl text-muted-foreground">+</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex justify-center gap-4 mb-4">
                  <Image className="w-8 h-8 text-muted-foreground" />
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t('memories.clickToSelect')}</p>
                <p className="text-xs text-muted-foreground mt-2">{t('memories.maxSize')}</p>
              </div>
            )}
          </div>

          {/* Caption with @Mentions */}
          <div className="space-y-2">
            <Label htmlFor="caption">{t('memories.descriptionLabel')}</Label>
            <MentionInput
              value={caption}
              onChangeText={setCaption}
              onMentionsChange={setCaptionMentions}
              suggestionUsers={participantSuggestions}
              placeholder={t('memories.descriptionPlaceholder')}
              className="text-sm"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              {t('memories.mentionHint')}
            </p>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <Label>{t('memories.visibility')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {privacyOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePrivacyChange(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                      privacy === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:border-muted-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {privacyOptions.find(o => o.value === privacy)?.description}
            </p>
          </div>

          {/* Custom viewers selection */}
          {privacy === 'custom' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('memories.selectedPeopleCount', { count: selectedViewers.length })}</Label>
                <button
                  type="button"
                  onClick={() => setShowViewerPicker(!showViewerPicker)}
                  className="text-sm text-primary hover:underline"
                >
                  {showViewerPicker ? t('common.close') : t('memories.selectViewers')}
                </button>
              </div>

              {showViewerPicker && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {participants.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">
                      {t('memories.noParticipants')}
                    </p>
                  ) : (
                    participants.map((participant) => (
                      <button
                        key={participant._id}
                        type="button"
                        onClick={() => toggleViewer(participant._id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors',
                          selectedViewers.includes(participant._id) && 'bg-primary/10'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center',
                          selectedViewers.includes(participant._id)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground'
                        )}>
                          {selectedViewers.includes(participant._id) && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={resolveImageUrl(participant.profileImage)} />
                          <AvatarFallback className="text-xs">{getInitials(participant.name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-medium">{participant.name}</p>
                          {participant.username && (
                            <p className="text-xs text-muted-foreground">@{participant.username}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected viewers preview */}
              {selectedViewers.length > 0 && !showViewerPicker && (
                <div className="flex flex-wrap gap-2">
                  {selectedViewers.map((viewerId) => {
                    const viewer = participants.find(p => p._id === viewerId)
                    if (!viewer) return null
                    return (
                      <div
                        key={viewerId}
                        className="flex items-center gap-1 bg-muted rounded-full px-2 py-1"
                      >
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={resolveImageUrl(viewer.profileImage)} />
                          <AvatarFallback className="text-xs">{getInitials(viewer.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{viewer.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleViewer(viewerId)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Share to wall — nach dem ersten Beitrag nicht mehr, sonst entstünde ein zweiter. */}
          {isPublicEvent && privacy === 'public' && wallPosted && (
            <p className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <Check className="w-4 h-4" />
              {t('memories.wallPostDone')}
            </p>
          )}
          {isPublicEvent && privacy === 'public' && !wallPosted && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="shareToWall"
                checked={shareToWall}
                onChange={(e) => setShareToWall(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="shareToWall" className="flex items-center gap-2 text-sm cursor-pointer">
                <Share2 className="w-4 h-4" />
                Auch auf der Wall teilen
              </label>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={!selectedFiles.length || uploadMutation.isPending || (privacy === 'custom' && selectedViewers.length === 0)}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('memories.uploading')}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t('memories.uploadPhoto')}
              </>
            )}
          </Button>

          {privacy === 'custom' && selectedViewers.length === 0 && (
            <p className="text-xs text-destructive text-center">
              {t('memories.selectAtLeastOne')}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
