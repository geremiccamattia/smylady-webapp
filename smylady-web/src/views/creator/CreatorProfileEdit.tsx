'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AtSign, Plus, Tag, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { CREATOR_PROFILE_QUERY_KEY, useCreatorProfile } from '@/hooks/useCreatorProfile'
import {
  CREATOR_CATEGORIES,
  CREATOR_FOLLOWER_RANGES,
  CREATOR_PLATFORMS,
  creatorAreaService,
  readCreatorError,
  type CreatorChannel,
  type CreatorPlatform,
} from '@/services/creator'
import { CreatorGate, CreatorStatusBadge, useCreatorLabels } from '@/components/creator/creatorShared'

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

/** Obergrenze von PATCH /creators/me für `bio`. */
const BIO_MAX_LENGTH = 500

interface ChannelRow {
  platform: CreatorPlatform
  username: string
  url: string
  followerRange: string
}

const emptyChannel = (): ChannelRow => ({ platform: 'Instagram', username: '', url: '', followerRange: '' })

/**
 * Eigenes Creator-Profil bearbeiten: Kanäle, Kategorien, Stadt, Bio und
 * Portfolio. Die Freigabe für Brands sitzt auf der Übersichtsseite, der
 * Status gehört allein uns.
 *
 * Auch für ein Profil in Prüfung erreichbar, damit Angaben vor der
 * Aktivierung korrigiert werden können.
 */
export default function CreatorProfileEdit() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <CreatorGate allow={['active', 'pending', 'blocked']}>
        <ProfileForm />
      </CreatorGate>
    </div>
  )
}

function ProfileForm() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()
  const labels = useCreatorLabels()
  const { profile } = useCreatorProfile()

  const [channels, setChannels] = useState<ChannelRow[]>([emptyChannel()])
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [portfolio, setPortfolio] = useState('')

  useEffect(() => {
    if (!profile) return
    const rows = profile.channels.map((channel) => ({
      platform: channel.platform,
      username: channel.username,
      url: channel.url ?? '',
      followerRange: channel.followerRange ?? '',
    }))
    setChannels(rows.length > 0 ? rows : [emptyChannel()])
    const primary = profile.channels.findIndex((channel) => channel.isPrimary)
    setPrimaryIndex(primary >= 0 ? primary : 0)
    setCategories(profile.categories)
    setCity(profile.city)
    setBio(profile.bio)
    setPortfolio(profile.portfolioLinks.join('\n'))
  }, [profile])

  const mutation = useMutation({
    mutationFn: () => {
      const cleanChannels: CreatorChannel[] = channels.map((row, index) => ({
        platform: row.platform,
        username: row.username.trim().replace(/^@/, ''),
        url: row.url.trim() || undefined,
        followerRange: row.followerRange || undefined,
        isPrimary: index === primaryIndex,
      }))
      const links = portfolio
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      return creatorAreaService.updateMyProfile({
        channels: cleanChannels,
        categories,
        city: city.trim(),
        bio: bio.trim(),
        portfolioLinks: links,
      })
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(CREATOR_PROFILE_QUERY_KEY, updated)
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('creatorDashboard.profileSaved', { defaultValue: 'Dein Profil wurde gespeichert.' }),
      })
      router.push(localePath('/creator'))
    },
    onError: (error: unknown) =>
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readCreatorError(error, t('creatorDashboard.profileSaveFailed', { defaultValue: 'Das Profil konnte nicht gespeichert werden.' })),
      }),
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const problem = (message: string) =>
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }), description: message })

    if (channels.some((row) => !row.username.trim())) {
      return problem(t('creatorDashboard.validateChannels', { defaultValue: 'Bitte gib für jeden Kanal einen Benutzernamen an.' }))
    }
    if (categories.length === 0) {
      return problem(t('creatorDashboard.validateCategories', { defaultValue: 'Bitte wähle mindestens eine Kategorie.' }))
    }
    const badLink = portfolio
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .find((line) => !/^https?:\/\/\S+$/i.test(line))
    if (badLink) {
      return problem(t('creatorDashboard.validatePortfolio', { defaultValue: 'Portfolio-Links müssen mit http:// oder https:// beginnen.' }))
    }
    mutation.mutate()
  }

  if (!profile) return null

  const updateChannel = (index: number, patch: Partial<ChannelRow>) =>
    setChannels((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const toggleCategory = (category: string) =>
    setCategories((current) => (current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category]))

  return (
    <>
      <div>
        <Link href={localePath('/creator')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4" />
          {t('creatorDashboard.backToDashboard', { defaultValue: 'Zurück zur Übersicht' })}
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">{t('creatorDashboard.editProfile', { defaultValue: 'Profil bearbeiten' })}</h1>
          <CreatorStatusBadge status={profile.status} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AtSign className="h-5 w-5" />
              {t('creatorDashboard.channelsSection', { defaultValue: 'Kanäle' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.map((row, index) => (
              <div key={index} className="grid md:grid-cols-[8rem_1fr_1fr_10rem_auto_auto] gap-2 items-end rounded-md border p-3">
                <div className="space-y-1">
                  <Label>{t('creatorDashboard.fieldPlatform', { defaultValue: 'Plattform' })}</Label>
                  <select className={SELECT_CLASS} value={row.platform} onChange={(e) => updateChannel(index, { platform: e.target.value as CreatorPlatform })}>
                    {CREATOR_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {labels.platform(platform)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t('creatorDashboard.fieldUsername', { defaultValue: 'Benutzername' })}</Label>
                  <Input
                    value={row.username}
                    onChange={(e) => updateChannel(index, { username: e.target.value })}
                    placeholder={t('creatorDashboard.fieldUsernamePlaceholder', { defaultValue: '@deinprofil' })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('creatorDashboard.fieldChannelUrl', { defaultValue: 'Link' })}</Label>
                  <Input type="url" value={row.url} onChange={(e) => updateChannel(index, { url: e.target.value })} placeholder="https://" />
                </div>
                <div className="space-y-1">
                  <Label>{t('creatorDashboard.fieldFollowers', { defaultValue: 'Follower' })}</Label>
                  <select className={SELECT_CLASS} value={row.followerRange} onChange={(e) => updateChannel(index, { followerRange: e.target.value })}>
                    <option value="">{t('creatorDashboard.followersUnknown', { defaultValue: 'Keine Angabe' })}</option>
                    {CREATOR_FOLLOWER_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {labels.followerRange(range)}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground pb-2 whitespace-nowrap">
                  <input type="radio" name="primaryChannel" checked={primaryIndex === index} onChange={() => setPrimaryIndex(index)} />
                  {t('creatorDashboard.primaryChannel', { defaultValue: 'Hauptkanal' })}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  disabled={channels.length <= 1}
                  onClick={() => {
                    setChannels((rows) => rows.filter((_, i) => i !== index))
                    setPrimaryIndex((current) => (current === index ? 0 : current > index ? current - 1 : current))
                  }}
                  title={t('common.remove', { defaultValue: 'Entfernen' })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setChannels((rows) => [...rows, emptyChannel()])}>
              <Plus className="h-4 w-4" />
              {t('creatorDashboard.addChannel', { defaultValue: 'Kanal hinzufügen' })}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {t('creatorDashboard.categoriesSection', { defaultValue: 'Kategorien' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CREATOR_CATEGORIES.map((category) => {
                const active = categories.includes(category)
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {labels.category(category)}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('creatorDashboard.aboutSection', { defaultValue: 'Über dich' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 md:w-1/2">
              <Label htmlFor="city">{t('creatorDashboard.fieldCity', { defaultValue: 'Stadt' })}</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('creatorDashboard.fieldCityPlaceholder', { defaultValue: 'Wien' })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t('creatorDashboard.fieldBio', { defaultValue: 'Bio' })}</Label>
              <Textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={BIO_MAX_LENGTH}
                placeholder={t('creatorDashboard.fieldBioPlaceholder', { defaultValue: 'Was machst du, wofür stehst du, was sollen Brands wissen?' })}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/{BIO_MAX_LENGTH}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">{t('creatorDashboard.fieldPortfolio', { defaultValue: 'Portfolio-Links' })}</Label>
              <Textarea
                id="portfolio"
                rows={3}
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder={t('creatorDashboard.fieldPortfolioPlaceholder', { defaultValue: 'Ein Link pro Zeile, z. B. https://…' })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.push(localePath('/creator'))}>
            {t('common.cancel', { defaultValue: 'Abbrechen' })}
          </Button>
          <Button type="submit" variant="gradient" className="flex-1" loading={mutation.isPending}>
            {t('common.save', { defaultValue: 'Speichern' })}
          </Button>
        </div>
      </form>
    </>
  )
}
