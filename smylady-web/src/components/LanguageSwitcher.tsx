'use client'

import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { navigateToPath } from '@/lib/navigation'

const languages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    // 1. i18next-Sprache umstellen. Der languageChanged-Handler in src/i18n/index.ts
    //    schreibt syp_language synchron in den localStorage — steht also vor dem Reload.
    i18n.changeLanguage(langCode)

    // 2. Navigieren über window.location statt router.push: der harte Reload verlässt die
    //    Seite sofort. Ein Client-Side-Push hat den React-Baum stattdessen weiterlaufen
    //    lassen, während das Menü noch offen war — Folge-Events konnten dann noch auf
    //    Elementen landen, die durch den Sprachwechsel neu gerendert wurden.
    const { pathname, search, hash } = window.location

    let newPath: string
    if (langCode === 'en') {
      newPath = pathname.startsWith('/en') ? pathname : `/en${pathname}`
    } else {
      newPath = pathname.startsWith('/en') ? (pathname.replace(/^\/en/, '') || '/') : pathname
    }

    // Nur navigieren wenn sich der Pfad ändert
    if (newPath !== pathname) {
      // search + hash mitnehmen, sonst geht z.B. /explore?search=techno beim Wechsel verloren.
      // navigateToPath lässt ausschließlich origin-interne Pfade durch — pathname kann per
      // Adresszeile "//evil.com" lauten und wäre als Redirect-Ziel sonst protokoll-relativ.
      navigateToPath(`${newPath}${search}${hash}`)
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
