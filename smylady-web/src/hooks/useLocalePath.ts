'use client'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'

export function useLocalePath() {
  const pathname = usePathname()
  const { i18n } = useTranslation()

  // URL-Prefix ODER i18next-Sprache prüfen
  // So funktioniert es auch auf Seiten ohne /en Prefix (z.B. /chat/...)
  const isEnglish = pathname.startsWith('/en') || i18n.language === 'en'

  return (path: string): string => {
    if (isEnglish && !path.startsWith('/en')) {
      return `/en${path}`
    }
    return path
  }
}
