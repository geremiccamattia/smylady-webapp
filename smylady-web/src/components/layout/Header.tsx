'use client'

import { useRouter } from 'next/navigation'
import { useLocalePath } from '@/hooks/useLocalePath'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Search, Bell, MessageCircle, Menu, Plus, Newspaper, Users,
  Ticket, CalendarDays, FileText, Heart, UserCircle, Settings,
  Ban, ShieldCheck, Star, Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, resolveImageUrl } from '@/lib/utils'
import { useState } from 'react'
import { notificationsService } from '@/services/notifications'
import { apiClient } from '@/services/api'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Header() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const localePath = useLocalePath()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: notificationsService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30s
  })

  // Guthaben für die Sidebar-Karte. Erst laden, wenn das Menü offen ist — die Zahl ist
  // nirgends sonst im Header sichtbar. Cents, wie überall im Backend.
  const { data: balance = 0 } = useQuery({
    queryKey: ['userBalance'],
    queryFn: async () => {
      const response = await apiClient.get('/users/balance')
      return (response.data?.data?.balance ?? 0) as number
    },
    enabled: isAuthenticated && showMobileMenu,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const closeSidebar = () => setShowMobileMenu(false)

  // Hauptmenü — Reihenfolge wie im SideDrawer der App. Nur Routen, die es in der WebApp
  // wirklich gibt: "Stripe/Spotify verbinden" und "Login & Sicherheit" leben hier als
  // Karten in /settings, "Event boosten" hat keine eigene Seite (läuft pro Event).
  const menuItems = [
    { href: '/explore', icon: Search, label: t('drawer.explore', { defaultValue: 'Entdecken' }) },
    { href: '/my-tickets', icon: Ticket, label: t('drawer.myTickets', { defaultValue: 'Meine Tickets' }) },
    { href: '/my-events', icon: CalendarDays, label: t('drawer.myCreatedEvents', { defaultValue: 'Erstellte Events' }) },
    { href: '/drafts', icon: FileText, label: t('drawer.drafts', { defaultValue: 'Entwürfe' }) },
    { href: '/create-event', icon: Plus, label: t('drawer.createEvent', { defaultValue: 'Event erstellen' }) },
    { href: '/chat', icon: MessageCircle, label: t('drawer.chats', { defaultValue: 'Chats' }) },
    { href: '/favorites', icon: Heart, label: t('drawer.favorites', { defaultValue: 'Favoriten' }) },
    { href: '/search-users', icon: Users, label: t('drawer.searchUsers', { defaultValue: 'Personen suchen' }) },
    { href: `/user/${user?._id || user?.id}`, icon: UserCircle, label: t('drawer.profile', { defaultValue: 'Profil' }) },
    { href: '/settings', icon: Settings, label: t('drawer.settings', { defaultValue: 'Einstellungen' }) },
    { href: '/blocked-users', icon: Ban, label: t('drawer.blockedUsers', { defaultValue: 'Blockierte Nutzer' }) },
    { href: '/safety-companions', icon: ShieldCheck, label: t('drawer.safetyCompanion', { defaultValue: 'Safety Companion' }) },
  ]

  // Sekundäre Links — identisch für Gäste und eingeloggte Nutzer.
  const secondaryLinks = [
    { href: '/contact', label: t('nav.contact', { defaultValue: 'Kontakt' }) },
    { href: '/influencer-club', label: t('nav.influencerClub', { defaultValue: 'Influencer Club' }) },
    { href: '/influencer-events', label: t('influencerEvents.navLabel', { defaultValue: 'Influencer Events' }) },
    { href: '/api', label: t('nav.apiDocs', { defaultValue: 'API-Dokumentation' }) },
    { href: 'mailto:office@shareyourparty.de', label: t('nav.emailSupport', { defaultValue: 'E-Mail Support' }) },
    { href: '/pricing', label: t('pricing.title', { defaultValue: 'Preise & Konditionen' }) },
    { href: '/privacy', label: t('nav.privacy', { defaultValue: 'Datenschutz' }) },
    { href: '/terms', label: t('nav.terms', { defaultValue: 'AGB' }) },
    { href: '/imprint', label: t('nav.imprint', { defaultValue: 'Impressum' }) },
  ]

  const renderSecondaryLinks = () => (
    <>
      {secondaryLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href.startsWith('mailto') ? item.href : localePath(item.href)}
          onClick={closeSidebar}
          className="px-4 py-2.5 hover:bg-muted/50 rounded-lg"
        >
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </Link>
      ))}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        {/* Left: Logo + Search — flex-1 keeps the left edge fixed regardless of nav width */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Logo */}
          <Link href={localePath("/explore")} className="flex-shrink-0 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Share Your Party"
              width={40}
              height={40}
              className="rounded-full object-cover"
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
                suppressHydrationWarning
                placeholder={t('common.search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </form>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href={localePath("/explore")}>
                <Button suppressHydrationWarning variant="ghost" size="sm">{t('nav.explore')}</Button>
              </Link>
              <Link href={localePath("/search-users")}>
                <Button suppressHydrationWarning variant="ghost" size="icon" title={t('nav.searchUsers', { defaultValue: 'Search Users' })}>
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
              <Link href={localePath("/create-event")}>
                <Button suppressHydrationWarning variant="gradient" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('nav.createEvent')}
                </Button>
              </Link>
              <Link href={localePath("/feed")}>
                <Button variant="ghost" size="icon">
                  <Newspaper className="h-5 w-5" />
                </Button>
              </Link>
              <Link href={localePath("/chat")}>
                <Button variant="ghost" size="icon" className="relative">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </Link>
              <Link href={localePath("/notifications")}>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href={localePath(`/user/${user?._id || user?.id}`)}>
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
              <Link href={localePath("/explore")}>
                <Button suppressHydrationWarning variant="ghost" size="sm">{t('nav.explore')}</Button>
              </Link>
              <Link href={localePath("/feed")}>
                <Button suppressHydrationWarning variant="ghost" size="sm">
                  <Newspaper className="h-4 w-4 mr-2" />
                  {t('nav.feed', { defaultValue: 'Feed' })}
                </Button>
              </Link>
              <Button
                suppressHydrationWarning
                variant="outline"
                size="sm"
                onClick={() => router.push('/login')}
              >
                {t('auth.login')}
              </Button>
              <Link href={localePath("/register")}>
                <Button suppressHydrationWarning variant="gradient" size="sm">{t('auth.register')}</Button>
              </Link>
              <LanguageSwitcher />
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden flex-shrink-0"
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
              suppressHydrationWarning
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu Overlay — Struktur wie der SideDrawer der App.
          max-h + overflow-y: das Menü ist länger als der Viewport. Ohne eigenes Scrolling
          bleibt der untere Teil (u.a. "Abmelden") unerreichbar, weil der Header sticky ist
          und das Overlay beim Seitenscrollen mitwandert.
          pb-24 hält den letzten Eintrag über der MobileNav-Bottombar (h-16). */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain">
          <div className="flex flex-col pb-24">
            {isAuthenticated ? (
              <>
                {/* Profil-Header */}
                <div className="p-4 flex items-center gap-3">
                  <Link href={localePath(`/user/${user?._id || user?.id}`)} onClick={closeSidebar}>
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={resolveImageUrl(user?.profileImage)} alt={user?.name} />
                      <AvatarFallback className="gradient-bg text-white">
                        {user?.name ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {t('drawer.greeting', {
                        name: user?.name?.split(' ')[0] ?? '',
                        defaultValue: `Hallo ${user?.name?.split(' ')[0] ?? ''}!`,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t('drawer.subGreeting', { defaultValue: 'Schön, dass du da bist' })}
                    </p>
                  </div>
                </div>

                {/* Guthaben */}
                <div className="mx-4 mb-3 p-3 rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wallet className="h-5 w-5 shrink-0 text-green-700 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400 truncate">
                        {t('drawer.myBalance', { defaultValue: 'Mein Guthaben' })}
                      </span>
                    </div>
                    <span className="text-lg font-bold shrink-0 text-green-700 dark:text-green-400">
                      {(balance / 100).toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t('drawer.balanceHint', { defaultValue: 'Einlösbar beim nächsten Ticketkauf.' })}
                  </p>
                </div>

                {/* Hauptmenü */}
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={localePath(item.href)}
                    onClick={closeSidebar}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <item.icon className="h-6 w-6 shrink-0 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}

                {/* Werbung */}
                <div className="border-t mt-2 pt-3">
                  <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('drawer.advertising', { defaultValue: 'Werbung' })}
                  </p>
                  <Link
                    href={localePath('/advertise/spotlight')}
                    onClick={closeSidebar}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <Star className="h-6 w-6 shrink-0 text-primary" />
                    <span className="text-sm font-medium">
                      {t('drawer.spotlight', { defaultValue: 'Spotlight' })}
                    </span>
                  </Link>
                </div>

                {/* Sekundäre Links */}
                <div className="border-t my-2 pt-2 flex flex-col px-1">
                  {renderSecondaryLinks()}
                </div>

                {/* Sprache */}
                <div className="border-t pt-2 px-3">
                  <LanguageSwitcher />
                </div>

                {/* Abmelden — im Scroll-Flow, nicht fixiert */}
                <div className="border-t mt-2 px-4 py-3">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      closeSidebar()
                      logout()
                    }}
                  >
                    {t('auth.logout', { defaultValue: 'Abmelden' })}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Gäste: Einstieg in Login/Registrierung */}
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">
                      {t('nav.welcome', { defaultValue: 'Willkommen bei Share Your Party' })}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('nav.welcomeSubline', { defaultValue: 'Melde dich an um alle Features zu nutzen.' })}
                    </p>
                  </div>
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => {
                      closeSidebar()
                      router.push(localePath('/login'))
                    }}
                  >
                    {t('nav.login', { defaultValue: 'Anmelden' })}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      closeSidebar()
                      router.push(localePath('/register'))
                    }}
                  >
                    {t('nav.register', { defaultValue: 'Sei dabei' })}
                  </Button>
                </div>

                {/* Öffentlich zugängliche Bereiche bleiben für Gäste erreichbar */}
                <div className="border-t pt-2">
                  <Link
                    href={localePath('/explore')}
                    onClick={closeSidebar}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <Search className="h-6 w-6 shrink-0 text-primary" />
                    <span className="text-sm font-medium">
                      {t('drawer.explore', { defaultValue: 'Entdecken' })}
                    </span>
                  </Link>
                  <Link
                    href={localePath('/feed')}
                    onClick={closeSidebar}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <Newspaper className="h-6 w-6 shrink-0 text-primary" />
                    <span className="text-sm font-medium">
                      {t('nav.feed', { defaultValue: 'Feed' })}
                    </span>
                  </Link>
                </div>

                {/* Sekundäre Links */}
                <div className="border-t my-2 pt-2 flex flex-col px-1">
                  {renderSecondaryLinks()}
                </div>

                {/* Sprache */}
                <div className="border-t pt-2 px-3">
                  <LanguageSwitcher />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
