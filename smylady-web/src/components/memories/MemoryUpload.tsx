import { useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X, Upload, Image, Video, Loader2, Globe, Lock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { memoriesService } from '@/services/memories'
import { useToast } from '@/hooks/use-toast'
import MentionInput from '@/components/mentionInput/MentionInput'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, resolveImageUrl, cn } from '@/lib/utils'

interface MemoryUploadProps {
  ticketId: string
  eventId: string
  onClose: () => void
  onSuccess: () => void
}

type PrivacyOption = 'public' | 'private' | 'custom'

export default function MemoryUpload({ ticketId, eventId, onClose, onSuccess }: MemoryUploadProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [, setCaptionMentions] = useState<string[]>([])
  const [privacy, setPrivacy] = useState<PrivacyOption>('public')
  const [showViewerPicker, setShowViewerPicker] = useState(false)
  const [selectedViewers, setSelectedViewers] = useState<string[]>([])

  // Fetch event participants for custom privacy
  const { data: participants = [] } = useQuery({
    queryKey: ['eventParticipants', eventId],
    queryFn: () => memoriesService.getEventParticipants(eventId),
    enabled: !!eventId,
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error('No file selected')
      return memoriesService.uploadMemory(
        ticketId,
        selectedFile,
        caption,
        privacy,
        privacy === 'custom' ? selectedViewers : undefined
      )
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: t('memories.uploadSuccess') })
      onSuccess()
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
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast({
        title: t('memories.invalidFileType'),
        description: t('memories.pleaseSelectImageOrVideo'),
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: t('memories.fileTooLarge'),
        description: t('memories.maxFileSize'),
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
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

  const isVideo = selectedFile?.type.startsWith('video/')

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
              onChange={handleFileSelect}
              className="hidden"
            />

            {!preview ? (
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
            ) : (
              <div className="relative">
                {isVideo ? (
                  <video
                    src={preview}
                    controls
                    className="w-full rounded-lg"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                  }}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
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

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={!selectedFile || uploadMutation.isPending || (privacy === 'custom' && selectedViewers.length === 0)}
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
