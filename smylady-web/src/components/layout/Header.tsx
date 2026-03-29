import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search, Bell, MessageCircle, Menu, Plus, Newspaper, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, resolveImageUrl } from '@/lib/utils'
import { useState } from 'react'
import { notificationsService } from '@/services/notifications'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Header() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: notificationsService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30s
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Share Your Party" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="hidden sm:block font-bold text-xl gradient-text">
            Share Your Party
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </form>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/explore">
                <Button variant="ghost" size="sm">{t('nav.explore')}</Button>
              </Link>
              <Link to="/search-users">
                <Button variant="ghost" size="icon" title={t('nav.searchUsers', { defaultValue: 'Search Users' })}>
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/create-event">
                <Button variant="gradient" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('nav.createEvent')}
                </Button>
              </Link>
              <Link to="/feed">
                <Button variant="ghost" size="icon">
                  <Newspaper className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/chat">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to={`/user/${user?._id || user?.id}`}>
                <Avatar className="cursor-pointer ring-2 ring-primary/20 hover:ring-primary transition-all">
                  <AvatarImage src={resolveImageUrl(user?.profileImage)} alt={user?.name} />
                  <AvatarFallback className="gradient-bg text-white">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <LanguageSwitcher />
            </>
          ) : (
            <>
              <Link to="/explore">
                <Button variant="ghost" size="sm">{t('nav.explore')}</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm">{t('auth.login')}</Button>
              </Link>
              <Link to="/register">
                <Button variant="gradient" size="sm">{t('auth.register')}</Button>
              </Link>
              <LanguageSwitcher />
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg">
          <nav className="flex flex-col p-4 gap-2">
            <Link to="/explore" onClick={() => setShowMobileMenu(false)}>
              <Button variant="ghost" className="w-full justify-start">Entdecken</Button>
            </Link>
            <Link to="/search-users" onClick={() => setShowMobileMenu(false)}>
              <Button variant="ghost" className="w-full justify-start">Personen suchen</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/create-event" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="ghost" className="w-full justify-start">Event erstellen</Button>
                </Link>
                <Link to="/my-tickets" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="ghost" className="w-full justify-start">Meine Tickets</Button>
                </Link>
                <Link to="/favorites" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="ghost" className="w-full justify-start">Favoriten</Button>
                </Link>
                <Link to={`/user/${user?._id || user?.id}`} onClick={() => setShowMobileMenu(false)}>
                  <Button variant="ghost" className="w-full justify-start">Profil</Button>
                </Link>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setShowMobileMenu(false)
                    logout()
                  }}
                >
                  Abmelden
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="outline" className="w-full">Anmelden</Button>
                </Link>
                <Link to="/register" onClick={() => setShowMobileMenu(false)}>
                  <Button variant="gradient" className="w-full">Registrieren</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
