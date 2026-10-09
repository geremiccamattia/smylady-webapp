'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useCreatorStanding } from '@/hooks/useCreatorStanding'

/**
 * Der Einstieg zum Creator Club in den Kontoeinstellungen.
 *
 * Der Eintrag passt sich dem Stand der Bewerbung an: „Creator werden" ohne
 * Bewerbung, „Bewerbung in Prüfung" bei offener, ein Hinweis bei abgelehnter,
 * und für Mitglieder der Weg in den Creator-Bereich. Alle Wege führen auf
 * /creator/apply — die Seite kennt die fünf Zustände und zeigt den passenden.
 * Sobald es ein Creator-Dashboard gibt, zeigt der Mitglieder-Link dorthin.
 *
 * Rendert null, solange der Stand nicht feststeht, und für Brand-Konten:
 * Eine Marke soll sich nicht nebenbei als Creator bewerben (Rollenmischung).
 * `isBrand` kommt aus GET /users/me (Backend ab feature/me-date-of-birth).
 * Ein Nutzerobjekt aus dem localStorage kann das Feld noch nicht haben —
 * dann gilt es als false und der Eintrag ist sichtbar.
 */
export function CreatorCard() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { user } = useAuth()
  const { standing } = useCreatorStanding()

  if (!standing || user?.isBrand) return null

  const label = {
    none: t('influencer.settingsApply', { defaultValue: 'Creator werden' }),
    pending: t('influencer.settingsPending', { defaultValue: 'Bewerbung in Prüfung' }),
    approved: t('influencer.settingsApproved', { defaultValue: 'Bewerbung angenommen' }),
    rejected: t('influencer.settingsRejected', { defaultValue: 'Bewerbung nicht angenommen' }),
    member: t('influencer.settingsMember', { defaultValue: 'Zum Creator-Bereich' }),
  }[standing]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('influencer.settingsTitle', { defaultValue: 'Creator Club' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="ghost" className="w-full justify-between" asChild>
          <Link href={localePath('/creator/apply')}>
            {label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default CreatorCard
