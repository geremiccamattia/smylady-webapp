'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Home, Search, Plus, Ticket, User, Newspaper, LogIn, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'

const navItems = [
  { icon: Home, label: 'Home', path: '/', key: 'home' },
  { icon: Search, label: 'Entdecken', path: '/explore', key: 'explore' },
  { icon: Newspaper, label: 'Feed', path: '/feed', requiresAuth: true, key: 'feed' },
  { icon: Plus, label: 'Erstellen', path: '/create-event', requiresAuth: true, key: 'create' },
  { icon: Ticket, label: 'Tickets', path: '/my-tickets', requiresAuth: true, key: 'tickets' },
  { icon: User, label: 'Profil', path: '/profile', requiresAuth: true, key: 'profile' },
  // Gäste-Einstieg — entspricht den Tabs "Login" und "Sei Dabei" in der Mobile-App.
  // Ohne diese Tabs sieht ein neuer Nutzer auf Mobile keinen Weg zur Anmeldung.
  { icon: LogIn, label: 'Anmelden', path: '/login', guestOnly: true, key: 'login', i18nKey: 'nav.login' },
  { icon: UserPlus, label: 'Sei dabei', path: '/register', guestOnly: true, key: 'register', i18nKey: 'nav.register', highlight: true },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const localePath = useLocalePath()

  // /en Prefix für isActive Vergleich entfernen
  const cleanPath = pathname.replace(/^\/en/, '') || '/'

  const visibleItems = navItems.filter(item =>
    (!item.requiresAuth || isAuthenticated) &&
    (!item.guestOnly || !isAuthenticated)
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const isActive = cleanPath === item.path
          const Icon = item.icon
          const label = item.i18nKey ? t(item.i18nKey, { defaultValue: item.label }) : item.label

          return (
            <Link
              key={item.key}
              href={localePath(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive || item.highlight
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.path === '/create-event' ? (
                <div className="w-12 h-12 -mt-6 rounded-full gradient-bg flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              ) : (
                <>
                  <Icon className={cn("h-5 w-5", (isActive || item.highlight) && "text-primary")} />
                  <span className={cn("text-xs", item.highlight && "font-medium")}>{label}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
