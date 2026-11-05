'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/**
 * Kurzhinweis an Upload-Stellen (M8): Recht am eigenen Bild (§ 78 UrhG,
 * Art. 6 DSGVO) und Urheberrecht. Text zentral in `upload.rightsNotice`.
 */
export function UploadRightsNotice({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {t('upload.rightsNotice', {
        defaultValue:
          'Lade nur Fotos/Videos hoch, mit deren Veröffentlichung die abgebildeten Personen einverstanden sind und an denen du die Rechte hast.',
      })}
    </p>
  )
}
