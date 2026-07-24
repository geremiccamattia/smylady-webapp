'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useToast } from '@/hooks/use-toast'
import { communityService } from '@/services/community'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { Globe, ArrowLeft, Upload, Settings, Crop, Share2, ChevronDown } from 'lucide-react'
import { generateCommunitySlug } from '@/lib/utils'

export default function CreateCommunityPage() {
  const { isAuthenticated } = useAuth()
  const { showAuthModal } = useAuthModal()
  const router = useRouter()
  const localePath = useLocalePath()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    categories: [] as string[],
    visibility: 'public',
    location: '',
    settings: {
      requireApproval: false,
      allowMemberEvents: true,
    },
    socialLinks: {
      instagram: '',
      facebook: '',
      tiktok: '',
      website: '',
    },
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [cropIndex, setCropIndex] = useState<number | null>(null) // null = neues Bild, number = bestehendes ersetzen
  const [showSocialLinks, setShowSocialLinks] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">{t('community.createCommunity', { defaultValue: 'Community erstellen' })}</h1>
        <p className="text-muted-foreground">{t('community.loginToCreate', { defaultValue: 'Logge dich ein um eine Community zu erstellen.' })}</p>
        <Button variant="gradient" onClick={() => showAuthModal()}>
          {t('common.login', { defaultValue: 'Anmelden' })}
        </Button>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (files.length + selectedFiles.length > 5) {
      toast({ variant: 'destructive', title: t('community.maxImages', { defaultValue: 'Maximal 5 Bilder erlaubt' }) })
      return
    }

    // Bilder werden nacheinander durch den Cropper geschickt
    setPendingFiles(files.slice(1))
    setCropIndex(null)
    setCropImageUrl(URL.createObjectURL(files[0]))
    setCropModalOpen(true)

    // Input zurücksetzen damit dasselbe Bild erneut gewählt werden kann
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
  }

  const handleCropComplete = (croppedFile: File) => {
    if (cropIndex !== null) {
      const newFiles = [...selectedFiles]
      newFiles[cropIndex] = croppedFile
      setSelectedFiles(newFiles)
      setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
    } else {
      const newFiles = [...selectedFiles, croppedFile]
      setSelectedFiles(newFiles)
      setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
    }

    URL.revokeObjectURL(cropImageUrl)

    if (cropIndex === null && pendingFiles.length > 0) {
      // Nächstes ausgewähltes Bild croppen, Modal bleibt offen
      const [nextFile, ...rest] = pendingFiles
      setPendingFiles(rest)
      setCropImageUrl(URL.createObjectURL(nextFile))
    } else {
      setCropModalOpen(false)
      setCropImageUrl('')
      setCropIndex(null)
      setPendingFiles([])
    }
  }

  const handleCropClose = () => {
    setCropModalOpen(false)
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl)
    setCropImageUrl('')
    setCropIndex(null)
    setPendingFiles([])
  }

  const openCropForExisting = (index: number) => {
    setCropIndex(index)
    setCropImageUrl(URL.createObjectURL(selectedFiles[index]))
    setCropModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast({ variant: 'destructive', title: t('community.nameRequired', { defaultValue: 'Name ist erforderlich' }) })
      return
    }
    if (!form.description.trim()) {
      toast({ variant: 'destructive', title: t('community.descriptionRequired', { defaultValue: 'Beschreibung ist erforderlich' }) })
      return
    }
    if (form.categories.length === 0) {
      toast({ variant: 'destructive', title: t('community.categoryRequired', { defaultValue: 'Mindestens eine Kategorie ist erforderlich' }) })
      return
    }

    const hasSocialLinks = Object.values(form.socialLinks).some((v) => v.trim())

    setIsLoading(true)
    try {
      let result
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        formData.append('name', form.name.trim())
        formData.append('description', form.description.trim())
        formData.append('categories', JSON.stringify(form.categories))
        formData.append('visibility', form.visibility)
        if (form.location.trim()) formData.append('location', form.location.trim())
        formData.append('settings', JSON.stringify(form.settings))
        if (hasSocialLinks) {
          formData.append('socialLinks', JSON.stringify(form.socialLinks))
        }
        selectedFiles.forEach((file) => formData.append('files', file))
        result = await communityService.createWithFiles(formData)
      } else {
        result = await communityService.create({
          name: form.name.trim(),
          description: form.description.trim(),
          categories: form.categories,
          visibility: form.visibility,
          location: form.location.trim() || undefined,
          settings: form.settings,
          ...(hasSocialLinks && { socialLinks: form.socialLinks }),
        })
      }
      toast({ title: t('community.createSuccess', { defaultValue: 'Community erstellt!' }) })
      router.push(localePath(`/communities/${generateCommunitySlug(result.name, result._id)}`))
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('community.createFailed', { defaultValue: 'Community konnte nicht erstellt werden.' }),
        description: error.response?.data?.message || '',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{t('community.createCommunity', { defaultValue: 'Community erstellen' })}</h1>
          <p className="text-sm text-muted-foreground">
            {t('community.fillInfo', { defaultValue: 'Informationen ausfüllen' })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Sichtbarkeit */}
        <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-xl text-sm text-muted-foreground">
          <Globe className="h-5 w-5 text-primary shrink-0" />
          {t('community.publicNote', { defaultValue: 'Alle Communities sind derzeit öffentlich und für jeden sichtbar.' })}
        </div>

        {/* Details */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold mb-2">
              {t('community.details', { defaultValue: 'Details der Community' })}
            </h2>

            <div className="space-y-2">
              <Label htmlFor="name">
                {t('community.nameLabel', { defaultValue: 'Name der Community' })} *
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('community.namePlaceholder', { defaultValue: 'Name der Community' })}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t('community.descriptionLabel', { defaultValue: 'Beschreibung der Community' })} *
              </Label>
              <MarkdownEditor
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
                placeholder={t('community.descriptionPlaceholder', { defaultValue: 'Beschreibung der Community' })}
                maxLength={2000}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t('community.categoryLabel', { defaultValue: 'Kategorien der Community' })} *
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('community.categoryHint', { defaultValue: 'Wähle eine oder mehrere Kategorien.' })}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: 'Music', label: t('categories.music', { defaultValue: 'Musik' }), emoji: '🎵' },
                  { value: 'Clubbing', label: t('categories.clubbing', { defaultValue: 'Clubbing' }), emoji: '🎶' },
                  { value: 'Business', label: t('categories.business', { defaultValue: 'Business' }), emoji: '💼' },
                  { value: 'Nature', label: t('categories.outdoor', { defaultValue: 'Outdoor' }), emoji: '🌿' },
                  { value: 'Sports', label: t('categories.sport', { defaultValue: 'Sport' }), emoji: '⚽' },
                  { value: 'Workshop', label: t('categories.workshop', { defaultValue: 'Workshop' }), emoji: '🛠' },
                  { value: 'Gastronomy', label: t('categories.gastronomy', { defaultValue: 'Gastronomie' }), emoji: '🍽' },
                  { value: 'Yoga', label: t('categories.yoga', { defaultValue: 'Yoga' }), emoji: '🧘' },
                  { value: 'Theme', label: t('categories.theme', { defaultValue: 'Themenparty' }), emoji: '🎭' },
                  { value: 'On the Roof', label: t('categories.onTheRoof', { defaultValue: 'Auf dem Dach' }), emoji: '🏙' },
                  { value: 'Other', label: t('categories.other', { defaultValue: 'Sonstiges' }), emoji: '🎉' },
                ].map((cat) => {
                  const isSelected = form.categories.includes(cat.value)
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          categories: isSelected
                            ? form.categories.filter((c) => c !== cat.value)
                            : [...form.categories, cat.value],
                        })
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className={isSelected ? 'font-medium text-primary' : ''}>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                {t('community.locationLabel', { defaultValue: 'Ort der Community' })}
              </Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t('community.locationPlaceholder', { defaultValue: 'Stadt eingeben' })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Community-Einstellungen */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            <h2 className="font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('community.communitySettings', { defaultValue: 'Community-Einstellungen' })}
            </h2>

            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1 mr-4">
                <p className="font-medium text-sm">
                  {t('community.requireApproval', { defaultValue: 'Beitritt nur mit Genehmigung' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('community.requireApprovalDesc', { defaultValue: 'Neue Mitglieder müssen von einem Admin genehmigt werden.' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({
                  ...form,
                  settings: { ...form.settings, requireApproval: !form.settings.requireApproval },
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                  form.settings.requireApproval ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.settings.requireApproval ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1 mr-4">
                <p className="font-medium text-sm">
                  {t('community.allowMemberEvents', { defaultValue: 'Mitglieder dürfen Events erstellen' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('community.allowMemberEventsDesc', { defaultValue: 'Wenn deaktiviert, können nur Admins Community Events erstellen.' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({
                  ...form,
                  settings: { ...form.settings, allowMemberEvents: !form.settings.allowMemberEvents },
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                  form.settings.allowMemberEvents ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.settings.allowMemberEvents ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card>
          <CardContent className="pt-6">
            <button
              type="button"
              onClick={() => setShowSocialLinks(!showSocialLinks)}
              className="flex items-center justify-between w-full"
            >
              <h2 className="font-semibold flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                {t('community.socialLinks', { defaultValue: 'Social Media Links' })}
                <span className="text-xs text-muted-foreground font-normal">
                  ({t('common.optional', { defaultValue: 'optional' })})
                </span>
              </h2>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showSocialLinks ? 'rotate-180' : ''}`} />
            </button>

            {showSocialLinks && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">📸</span>
                  <Input
                    value={form.socialLinks.instagram}
                    onChange={(e) => setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, instagram: e.target.value },
                    })}
                    placeholder="Instagram (@handle oder URL)"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">👤</span>
                  <Input
                    value={form.socialLinks.facebook}
                    onChange={(e) => setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, facebook: e.target.value },
                    })}
                    placeholder="Facebook (Seitenname oder URL)"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">🎵</span>
                  <Input
                    value={form.socialLinks.tiktok}
                    onChange={(e) => setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, tiktok: e.target.value },
                    })}
                    placeholder="TikTok (@handle oder URL)"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">🌐</span>
                  <Input
                    value={form.socialLinks.website}
                    onChange={(e) => setForm({
                      ...form,
                      socialLinks: { ...form.socialLinks, website: e.target.value },
                    })}
                    placeholder="Website (URL)"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Titelbild */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">
              {t('community.coverImage', { defaultValue: 'Titelbild hinzufügen' })}
            </h2>

            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById('community-images')?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('community.uploadImages', { defaultValue: 'Bilder hochladen' })}
              </p>
              <input
                id="community-images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {t('community.maxImagesHint', { defaultValue: 'Du kannst bis zu 5 Bilder hochladen. Ideales Format: 21:9 (z.B. 2100 × 900 px).' })}
            </p>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-[21/9] rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => openCropForExisting(index)}
                  >
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-1">
                      <Crop className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs transition-opacity">
                        {t('community.cropHint', { defaultValue: 'Zuschneiden' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/80"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading
            ? t('common.loading', { defaultValue: 'Wird erstellt...' })
            : t('community.createCommunity', { defaultValue: 'Community erstellen' })
          }
        </Button>

      </form>

      <ImageCropModal
        open={cropModalOpen}
        imageUrl={cropImageUrl}
        onClose={handleCropClose}
        onCropComplete={handleCropComplete}
        aspectRatio={21 / 9}
        freeStyle={false}
        title={t('community.cropCoverImage', { defaultValue: 'Titelbild zuschneiden' })}
      />
    </div>
  )
}
