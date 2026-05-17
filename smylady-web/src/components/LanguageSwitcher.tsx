'use client'

import { useTranslation } from 'react-i18next'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const languages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    // 1. i18next Sprache ändern (setzt Cookie)
    i18n.changeLanguage(langCode)

    // 2. Zur richtigen URL navigieren
    if (langCode === 'en') {
      // Zu /en/... navigieren falls noch nicht dort
      if (!pathname.startsWith('/en')) {
        router.push(`/en${pathname}`)
      }
    } else {
      // /en/... entfernen für Deutsch
      if (pathname.startsWith('/en')) {
        router.push(pathname.replace(/^\/en/, '') || '/')
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline" suppressHydrationWarning>{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden" suppressHydrationWarning>{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={i18n.language === lang.code ? 'bg-muted' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
