import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Plus, Ticket, User, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Entdecken', path: '/explore' },
  { icon: Newspaper, label: 'Feed', path: '/feed', requiresAuth: true },
  { icon: Plus, label: 'Erstellen', path: '/create-event', requiresAuth: true },
  { icon: Ticket, label: 'Tickets', path: '/my-tickets', requiresAuth: true },
  { icon: User, label: 'Profil', path: '/profile', requiresAuth: true },
]

export default function MobileNav() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  const visibleItems = navItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              to={item.path}
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
