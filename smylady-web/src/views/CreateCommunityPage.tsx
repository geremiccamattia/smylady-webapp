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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, ArrowLeft, Upload, Settings } from 'lucide-react'
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
    category: '',
    visibility: 'public',
    location: '',
    settings: {
      requireApproval: false,
      allowMemberEvents: true,
    },
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

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
    if (files.length + selectedFiles.length > 5) {
      toast({ variant: 'destructive', title: t('community.maxImages', { defaultValue: 'Maximal 5 Bilder erlaubt' }) })
      return
    }
    const newFiles = [...selectedFiles, ...files].slice(0, 5)
    setSelectedFiles(newFiles)
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
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
    if (!form.category) {
      toast({ variant: 'destructive', title: t('community.categoryRequired', { defaultValue: 'Kategorie ist erforderlich' }) })
      return
    }

    setIsLoading(true)
    try {
      let result
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        formData.append('name', form.name.trim())
        formData.append('description', form.description.trim())
        formData.append('category', form.category)
        formData.append('visibility', form.visibility)
        if (form.location.trim()) formData.append('location', form.location.trim())
        formData.append('settings', JSON.stringify(form.settings))
        selectedFiles.forEach((file) => formData.append('files', file))
        result = await communityService.createWithFiles(formData)
      } else {
        result = await communityService.create({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          visibility: form.visibility,
          location: form.location.trim() || undefined,
          settings: form.settings,
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
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('community.descriptionPlaceholder', { defaultValue: 'Beschreibung der Community' })}
                maxLength={2000}
                rows={4}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                {t('community.categoryLabel', { defaultValue: 'Kategorie der Community' })} *
              </Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('community.selectCategory', { defaultValue: 'Kategorie wählen' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Music">{t('categories.music', { defaultValue: 'Musik' })}</SelectItem>
                  <SelectItem value="Clubbing">{t('categories.clubbing', { defaultValue: 'Clubbing' })}</SelectItem>
                  <SelectItem value="Business">{t('categories.business', { defaultValue: 'Business' })}</SelectItem>
                  <SelectItem value="Nature">{t('categories.outdoor', { defaultValue: 'Outdoor' })}</SelectItem>
                  <SelectItem value="Sports">{t('categories.sport', { defaultValue: 'Sport' })}</SelectItem>
                  <SelectItem value="Workshop">{t('categories.workshop', { defaultValue: 'Workshop' })}</SelectItem>
                  <SelectItem value="Gastronomy">{t('categories.gastronomy', { defaultValue: 'Gastronomie' })}</SelectItem>
                  <SelectItem value="Yoga">{t('categories.yoga', { defaultValue: 'Yoga' })}</SelectItem>
                  <SelectItem value="Theme">{t('categories.theme', { defaultValue: 'Themenparty' })}</SelectItem>
                  <SelectItem value="On the Roof">{t('categories.onTheRoof', { defaultValue: 'Auf dem Dach' })}</SelectItem>
                  <SelectItem value="Other">{t('categories.other', { defaultValue: 'Sonstiges' })}</SelectItem>
                </SelectContent>
              </Select>
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
              {t('community.maxImagesHint', { defaultValue: 'Du kannst bis zu 5 Bilder hochladen' })}
            </p>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
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
    </div>
  )
}
