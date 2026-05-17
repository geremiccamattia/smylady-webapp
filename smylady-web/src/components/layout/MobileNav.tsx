'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, Plus, Ticket, User, Newspaper } from 'lucide-react'
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
]

export default function MobileNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const localePath = useLocalePath()

  // /en Prefix für isActive Vergleich entfernen
  const cleanPath = pathname.replace(/^\/en/, '') || '/'

  const visibleItems = navItems.filter(item =>
    !item.requiresAuth || isAuthenticated
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const isActive = cleanPath === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.key}
              href={localePath(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive
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
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className="text-xs">{item.label}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
