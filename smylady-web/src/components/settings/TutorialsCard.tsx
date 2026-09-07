'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronRight, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useTutorials } from '@/hooks/useTutorials'

/**
 * Der Einstieg zu den Video-Tutorials in den Kontoeinstellungen.
 *
 * Rendert `null`, solange nicht bestätigt ist, dass dieses Konto freigeschaltet
 * ist — kein ausgegrauter Eintrag, kein Hinweis zum Freischalten, kein
 * Platzhalter während des Ladens. Wer keinen Zugang hat, sieht an dieser Stelle
 * nichts und erfährt auch nicht, dass hier etwas fehlt.
 *
 * Der Zugang lässt sich nur über die Anfrage selbst feststellen: Am Nutzerobjekt
 * aus `GET /users/me` steht `tutorialAccess` nicht. Die Anfrage läuft deshalb
 * beim Öffnen der Einstellungen mit — einmal, ohne Wiederholung, und für fünf
 * Minuten aus dem Cache (siehe useTutorials).
 */
export function TutorialsCard() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { hasAccess } = useTutorials()

  if (hasAccess !== true) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          {t('tutorials.title', { defaultValue: 'Video-Tutorials' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="ghost" className="w-full justify-between" asChild>
          <Link href={localePath('/tutorials')}>
            {t('tutorials.settingsEntry', { defaultValue: 'Videos ansehen' })}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default TutorialsCard
