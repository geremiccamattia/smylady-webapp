'use client'

import { notFound } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { GraduationCap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTutorials } from '@/hooks/useTutorials'
import { safeExternalUrl } from '@/lib/safeUrl'
import type { Tutorial } from '@/services/tutorials'

/**
 * Die Video-Tutorials für freigeschaltete Konten.
 *
 * Ohne Zugang verhält sich die Route wie eine nicht existierende Seite: Sie ruft
 * `notFound()` und erzeugt damit exakt dieselbe Ausgabe wie ein Tippfehler in der
 * URL. Eine eigene, gestaltete „kein Zugang“-Seite wäre selbst der Hinweis — sie
 * unterschiede sich von /irgendwas-erfundenes und würde damit belegen, dass es
 * hier etwas zu holen gibt.
 *
 * Das gilt auch für den unklaren Fall (Netzfehler, 500): Angezeigt wird nur bei
 * einer bestätigten 200. Lieber eine 404 zu viel als ein Bereich, der aufblitzt.
 */

/** Sekunden aus dem Backend als gerundete Minuten. `0` heisst unbekannt. */
function formatDuration(seconds: number): string | null {
  if (!seconds || seconds <= 0) return null
  // Aufgerundet auf mindestens eine Minute: Ein 40-Sekunden-Video als „0 Min.“
  // auszuweisen, liest sich wie ein Fehler.
  return `${Math.max(1, Math.round(seconds / 60))}`
}

function TutorialItem({ tutorial }: { tutorial: Tutorial }) {
  const { t } = useTranslation()
  const minutes = formatDuration(tutorial.duration)
  const src = safeExternalUrl(tutorial.videoUrl)

  return (
    <Card className="overflow-hidden">
      {src && (
        <video
          src={src}
          controls
          playsInline
          // Lädt nur die Kopfdaten, nicht das Video. Bei einer Liste von Videos
          // auf einem Mobilfunkanschluss ist das der Unterschied zwischen ein
          // paar Kilobyte und mehreren hundert Megabyte beim blossen Öffnen.
          preload="metadata"
          className="w-full aspect-video bg-black"
        />
      )}
      <CardContent className="p-4 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold leading-snug">{tutorial.title}</h2>
          {minutes && (
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {t('tutorials.minutes', { minutes, defaultValue: '{{minutes}} Min.' })}
            </span>
          )}
        </div>
        {tutorial.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {tutorial.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function TutorialsPage() {
  const { t } = useTranslation()
  const { tutorials, hasAccess, isLoading } = useTutorials()

  // Solange nichts entschieden ist, wird nichts gezeigt — weder Titel noch Anzahl.
  if (isLoading || hasAccess === undefined) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  if (!hasAccess) notFound()

  const sorted = [...tutorials].sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">
          {t('tutorials.title', { defaultValue: 'Video-Tutorials' })}
        </h1>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('tutorials.empty', { defaultValue: 'Zurzeit sind keine Videos verfügbar.' })}
        </p>
      ) : (
        sorted.map((tutorial) => <TutorialItem key={tutorial._id} tutorial={tutorial} />)
      )}
    </div>
  )
}
