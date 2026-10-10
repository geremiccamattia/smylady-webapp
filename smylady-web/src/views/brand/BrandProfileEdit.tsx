'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building2, Contact, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { BRAND_PROFILE_QUERY_KEY, useBrandProfile } from '@/hooks/useBrandProfile'
import { brandService, readBrandError, type BrandProfile } from '@/services/brand'
import { isValidEmail } from '@/lib/utils'
import { BRAND_INDUSTRY_OPTIONS } from '@/views/auth/BrandRegister'
import { BrandGate, ProfileStatusBadge } from '@/components/brand/brandShared'

/** Obergrenze von PATCH /brands/me für `description`. */
const DESCRIPTION_MAX_LENGTH = 1000

/** Leere Optionalfelder gar nicht erst mitschicken — Muster wie in BrandRegister. */
function optional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Eigenes Brand-Profil bearbeiten.
 *
 * Auch für eine Brand in Prüfung erreichbar: Wer sich vertippt hat, soll das
 * korrigieren können, bevor wir freischalten. Nur die Felder aus
 * UpdateBrandProfileDto — Status und Review-Spuren setzt allein das Backend.
 */
export default function BrandProfileEdit() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BrandGate allow={['active', 'pending', 'blocked']}>
        <ProfileForm />
      </BrandGate>
    </div>
  )
}

function ProfileForm() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()
  const { profile } = useBrandProfile()

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPosition, setContactPosition] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [otherLink, setOtherLink] = useState('')

  // Felder einmal aus dem Profil vorbelegen. Das Profil ist bereits geladen,
  // sonst hätte BrandGate die Kinder nicht gerendert.
  useEffect(() => {
    if (!profile) return
    setCompanyName(profile.companyName)
    setContactName(profile.contactName)
    setContactEmail(profile.contactEmail)
    setContactPosition(profile.contactPosition)
    setIndustry(profile.industry)
    setDescription(profile.description)
    setLogoUrl(profile.logoUrl)
    setWebsite(profile.website)
    setInstagram(profile.instagram)
    setTiktok(profile.tiktok)
    setOtherLink(profile.otherLink)
  }, [profile])

  const mutation = useMutation({
    mutationFn: () => {
      const socialLinks = {
        instagram: optional(instagram),
        tiktok: optional(tiktok),
        other: optional(otherLink),
      }
      const hasSocialLinks = Object.values(socialLinks).some(Boolean)
      return brandService.updateMyProfile({
        companyName: companyName.trim(),
        contactPerson: {
          name: contactName.trim(),
          email: contactEmail.trim(),
          position: optional(contactPosition),
        },
        industry,
        description: optional(description),
        logoUrl: optional(logoUrl),
        website: optional(website),
        socialLinks: hasSocialLinks ? socialLinks : undefined,
      })
    },
    onSuccess: (updated: BrandProfile) => {
      queryClient.setQueryData(BRAND_PROFILE_QUERY_KEY, updated)
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('brandDashboard.profileSaved', { defaultValue: 'Dein Profil wurde gespeichert.' }),
      })
      router.push(localePath('/brand'))
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: readBrandError(
          error,
          t('brandDashboard.profileSaveFailed', { defaultValue: 'Das Profil konnte nicht gespeichert werden.' }),
        ),
      })
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValidEmail(contactEmail.trim())) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description: t('brandRegister.invalidContactEmail', {
          defaultValue: 'Bitte gib eine gültige E-Mail-Adresse für die Ansprechperson an.',
        }),
      })
      return
    }
    mutation.mutate()
  }

  if (!profile) return null

  const selectClassName =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  return (
    <>
      <div>
        <Link
          href={localePath('/brand')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('brandDashboard.backToDashboard', { defaultValue: 'Zurück zum Dashboard' })}
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">{t('brandDashboard.editProfile', { defaultValue: 'Profil bearbeiten' })}</h1>
          <ProfileStatusBadge status={profile.status} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('brandDashboard.companySection', { defaultValue: 'Unternehmen' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">{t('brandRegister.companyName', { defaultValue: 'Firmenname' })} *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">{t('brandRegister.industry', { defaultValue: 'Branche' })} *</Label>
              <select
                id="industry"
                className={selectClassName}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              >
                <option value="" disabled>
                  {t('brandRegister.industryPlaceholder', { defaultValue: 'Bitte wählen' })}
                </option>
                {BRAND_INDUSTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey, { defaultValue: option.value })}
                  </option>
                ))}
                {/* Ein gespeicherter Wert, der nicht mehr in der Liste steht, bleibt wählbar. */}
                {industry && !BRAND_INDUSTRY_OPTIONS.some((option) => option.value === industry) && (
                  <option value={industry}>{industry}</option>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('brandRegister.description', { defaultValue: 'Beschreibung' })}</Label>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESCRIPTION_MAX_LENGTH}
                placeholder={t('brandRegister.descriptionPlaceholder', {
                  defaultValue: 'Was macht dein Unternehmen? Was sollen Creator über euch wissen?',
                })}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Contact className="h-5 w-5" />
              {t('brandRegister.contactPerson', { defaultValue: 'Ansprechperson' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">{t('brandRegister.contactName', { defaultValue: 'Name' })} *</Label>
                <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPosition">
                  {t('brandRegister.contactPosition', { defaultValue: 'Position' })}
                </Label>
                <Input
                  id="contactPosition"
                  value={contactPosition}
                  onChange={(e) => setContactPosition(e.target.value)}
                  placeholder={t('brandRegister.contactPositionPlaceholder', { defaultValue: 'z. B. Marketing' })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">{t('brandRegister.contactEmail', { defaultValue: 'E-Mail' })} *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              {t('brandDashboard.linksSection', { defaultValue: 'Links' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">{t('brandRegister.website', { defaultValue: 'Website' })}</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">{t('brandRegister.logoUrl', { defaultValue: 'Logo-URL' })}</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@deinunternehmen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input id="tiktok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@deinunternehmen" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherLink">{t('brandRegister.socialOther', { defaultValue: 'Sonstiges' })}</Label>
                <Input id="otherLink" value={otherLink} onChange={(e) => setOtherLink(e.target.value)} placeholder="https://" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.push(localePath('/brand'))}>
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
