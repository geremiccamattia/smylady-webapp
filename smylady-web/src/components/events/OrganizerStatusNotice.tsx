'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface OrganizerStatusNoticeProps {
  organizerType?: 'business' | 'private' | null
  organizerImprint?: string
  className?: string
}

/**
 * Hinweis auf den Veranstalter-Status (H4) für Eventseite und Kaufdialog:
 * Unternehmer mit aufklappbarem Impressum bzw. Privatperson mit dem Hinweis,
 * dass gegenüber dem Veranstalter keine Verbraucherschutzrechte gelten.
 * Ohne Angabe (null/undefined) rendert die Komponente nichts.
 */
export function OrganizerStatusNotice({ organizerType, organizerImprint, className }: OrganizerStatusNoticeProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const imprint = (organizerImprint ?? '').trim()

  if (organizerType === 'business') {
    return (
      <div className={cn('text-xs text-muted-foreground', className)}>
        <span>{t('organizerStatus.badgeBusiness', { defaultValue: 'Unternehmer' })}</span>
        {imprint && (
          <>
            {' · '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open
                ? t('organizerStatus.hideImprint', { defaultValue: 'Impressum ausblenden' })
                : t('organizerStatus.showImprint', { defaultValue: 'Impressum anzeigen' })}
            </button>
            {open && (
              <p className="mt-1 whitespace-pre-line break-words rounded-md bg-muted/50 p-2 text-foreground">
                {imprint}
              </p>
            )}
          </>
        )}
      </div>
    )
  }

  if (organizerType === 'private') {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        {t('organizerStatus.badgePrivate', {
          defaultValue: 'Privatperson – es gelten keine Verbraucherschutzrechte gegenüber dem Veranstalter',
        })}
      </p>
    )
  }

  return null
}
