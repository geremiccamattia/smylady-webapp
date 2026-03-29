import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  Eye,
  EyeOff,
  Compass,
  QrCode,
  Camera,
  MessageCircle,
  Users,
  CalendarPlus,
  Shield,
  MapPin,
  ChevronDown,
  Ticket,
  Navigation,
  X,
  Search,
  Music,
  PartyPopper,
  Calendar,
  BookOpen,
  ArrowRight,
  Clock,
  Heart,
  Upload,
  Sparkles,
} from 'lucide-react'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

// Blog articles from shareyourparty.de/blog
const blogArticles = [
  {
    id: 1,
    title: 'Gartenparty im Sommer planen',
    excerpt: 'Die besten Tipps für unvergessliche Outdoor-Partys',
    image: 'https://shareyourparty.de/blog/wp-content/uploads/2026/02/freunde-feiern-gartenparty.webp',
    link: 'https://shareyourparty.de/blog/gartenparty-planen/',
    category: 'Tipps',
    readTime: '5 min'
  },
  {
    id: 2,
    title: 'Spontan ausgehen – so findest du Events',
    excerpt: 'Last-Minute Partys in deiner Nähe entdecken',
    image: 'https://shareyourparty.de/blog/wp-content/uploads/2026/02/Frau-freut-sich-spontan-1.jpg',
    link: 'https://shareyourparty.de/blog/spontan-ausgehen/',
    category: 'Guide',
    readTime: '4 min'
  },
  {
    id: 3,
    title: 'Events auf Social Media bewerben',
    excerpt: 'Marketing für Instagram, TikTok & Co.',
    image: 'https://shareyourparty.de/blog/wp-content/uploads/2026/01/girl-with-laptop.webp',
    link: 'https://shareyourparty.de/blog/social-media-event-marketing/',
    category: 'Marketing',
    readTime: '7 min'
  },
  {
    id: 4,
    title: 'Private Partys & Underground Events',
    excerpt: 'Exklusive Locations in Wien entdecken',
    image: 'https://shareyourparty.de/blog/wp-content/uploads/2025/11/pexels-cottonbro-5791668-scaled.webp',
    link: 'https://shareyourparty.de/blog/private-partys-finden/',
    category: 'Wien',
    readTime: '6 min'
  },
  {
    id: 5,
    title: 'Sicher auf Partys',
    excerpt: 'Safety-Tipps für einen sicheren Abend',
    image: 'https://shareyourparty.de/blog/wp-content/uploads/2026/01/happy-best-friends-celebrating-birthday-party-1.jpg',
    link: 'https://shareyourparty.de/blog/sicher-auf-partys/',
    category: 'Safety',
    readTime: '4 min'
  },
  {
    id: 6,
    title: 'Günstig ausgehen',
    excerpt: 'Nightlife ohne Budget zu sprengen',
    image: 'https://shareyourparty.de/blog/wp-content/uploads/2025/12/sparschwein.jpg',
    link: 'https://shareyourparty.de/blog/guenstig-ausgehen/',
    category: 'Budget',
    readTime: '5 min'
  }
]

// Category colors for blog
const blogCategoryColors: Record<string, string> = {
  'Tipps': 'bg-pink-500',
  'Guide': 'bg-blue-500',
  'Marketing': 'bg-purple-500',
  'Wien': 'bg-orange-500',
  'Safety': 'bg-green-500',
  'Budget': 'bg-amber-500'
}

// Compact features as icon badges
const features = [
  { icon: Compass, label: 'GPS Events', color: 'bg-pink-500' },
  { icon: QrCode, label: 'QR Tickets', color: 'bg-orange-500' },
  { icon: Camera, label: 'Memories', color: 'bg-purple-500' },
  { icon: MessageCircle, label: 'Live Chat', color: 'bg-green-500' },
  { icon: Users, label: 'Community', color: 'bg-blue-500' },
  { icon: CalendarPlus, label: 'Host Events', color: 'bg-red-500' },
  { icon: Shield, label: 'Safety', color: 'bg-emerald-500' },
  { icon: Ticket, label: 'Tickets', color: 'bg-amber-500' }
]

// Ticketmaster Event from Backend
interface TicketmasterEvent {
  _id: string
  name: string
  description?: string
  eventDate: string
  eventStartTime?: string
  locationName: string
  locationImages?: { url: string; fileName: string }[]
  price?: string
  category?: string
  musicType?: string
  externalUrl?: string
  isExternalEvent?: boolean
}

// City coordinates for Ticketmaster API
const cityCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
  'Wien': { lat: 48.2082, lng: 16.3738, name: 'Wien' },
  'Berlin': { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
  'München': { lat: 48.1351, lng: 11.5820, name: 'München' },
  'Zürich': { lat: 47.3769, lng: 8.5417, name: 'Zürich' },
  'Hamburg': { lat: 53.5511, lng: 9.9937, name: 'Hamburg' },
  'Köln': { lat: 50.9375, lng: 6.9603, name: 'Köln' },
}

// Available cities
const availableCities = Object.keys(cityCoordinates)

// Category icons and colors
const categoryStyles: Record<string, { icon: typeof Music; color: string }> = {
  'Music': { icon: Music, color: 'bg-purple-500' },
  'Electronic': { icon: Music, color: 'bg-purple-500' },
  'Techno': { icon: Music, color: 'bg-purple-600' },
  'House': { icon: Music, color: 'bg-purple-400' },
  'Klassik': { icon: Music, color: 'bg-amber-500' },
  'Festival': { icon: PartyPopper, color: 'bg-pink-500' },
  'Concert': { icon: Music, color: 'bg-blue-500' },
  'Comedy': { icon: Users, color: 'bg-orange-500' },
  'Party': { icon: PartyPopper, color: 'bg-pink-500' },
  'Jazz': { icon: Music, color: 'bg-yellow-600' },
  'Hip-Hop': { icon: Music, color: 'bg-gray-700' },
  'Rock': { icon: Music, color: 'bg-red-600' },
  'Alternative': { icon: Music, color: 'bg-indigo-500' },
  'Pop': { icon: Music, color: 'bg-pink-400' },
  'Mixed': { icon: Music, color: 'bg-blue-500' },
  'Punk': { icon: Music, color: 'bg-red-700' },
  'Latin': { icon: Music, color: 'bg-orange-500' },
  'Sport': { icon: Users, color: 'bg-green-600' },
  'Oper': { icon: Music, color: 'bg-amber-600' },
  'Kultur': { icon: Calendar, color: 'bg-blue-600' }
}

export default function Login() {
  const { t } = useTranslation()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Redirect to explore if already authenticated
  const from = (location.state as any)?.from?.pathname || '/explore'
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate, from])

  // Events state - will be auto-detected from geolocation
  const [selectedCity, setSelectedCity] = useState('Wien')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [allTicketmasterEvents, setAllTicketmasterEvents] = useState<TicketmasterEvent[]>([])
  const [ticketmasterEvents, setTicketmasterEvents] = useState<TicketmasterEvent[]>([])
  const [publicUserEvents, setPublicUserEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [searchCity, setSearchCity] = useState('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)

  // Auto-detect user's location via browser geolocation and find nearest city
  useEffect(() => {
    const detectLocation = async () => {
      try {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude
            const userLng = position.coords.longitude

            // Find the nearest city from our list
            let nearestCity = 'Wien'
            let minDistance = Infinity

            Object.entries(cityCoordinates).forEach(([city, coords]) => {
              const dlat = userLat - coords.lat
              const dlng = userLng - coords.lng
              const distance = Math.sqrt(dlat * dlat + dlng * dlng)
              if (distance < minDistance) {
                minDistance = distance
                nearestCity = city
              }
            })

            setSelectedCity(nearestCity)
          },
          () => {
            // Geolocation denied or unavailable - keep default Wien
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        )
      } catch {
        // Ignore errors - keep default
      }
    }

    detectLocation()
  }, [])

  // Fetch public user-created events AND Ticketmaster events from backend
  useEffect(() => {
    const fetchAllEvents = async () => {
      setEventsLoading(true)
      try {
        const coords = cityCoordinates[selectedCity] || cityCoordinates['Wien']

        // Fetch both in parallel
        const [publicResponse, tmResponse] = await Promise.all([
          axios.get(
            `https://app.shareyourparty.de/events/public?upcoming=true`
          ).catch(() => ({ data: { data: [] } })),
          axios.get(
            `https://app.shareyourparty.de/ticketmaster/events?latitude=${coords.lat}&longitude=${coords.lng}&radius=100`
          ).catch(() => ({ data: { data: [] } })),
        ])

        // Process public user-created events (filter out any external/ticketmaster events)
        const userEvents = (publicResponse.data?.data || []).filter(
          (e: any) => !e.isTicketmaster && !e.isExternalEvent && e.source !== 'ticketmaster'
        )
        setPublicUserEvents(userEvents)

        // Process Ticketmaster events
        if (tmResponse.data?.data && Array.isArray(tmResponse.data.data)) {
          const fetchedTmEvents = tmResponse.data.data
          setAllTicketmasterEvents(fetchedTmEvents)

          // Extract unique categories from all events (user + TM)
          const categories = new Set<string>()
          userEvents.forEach((event: any) => {
            const cat = event.musicType || event.category || 'Sonstige'
            categories.add(cat)
          })
          fetchedTmEvents.forEach((event: TicketmasterEvent) => {
            const cat = event.musicType || event.category || 'Sonstige'
            categories.add(cat)
          })
          setAvailableCategories(Array.from(categories).sort())

          // Apply category filter
          if (selectedCategory === 'all') {
            setTicketmasterEvents(fetchedTmEvents.slice(0, 20))
          } else {
            const filtered = fetchedTmEvents.filter((event: TicketmasterEvent) => {
              const cat = event.musicType || event.category || 'Sonstige'
              return cat === selectedCategory
            })
            setTicketmasterEvents(filtered.slice(0, 20))
          }
        } else {
          setAllTicketmasterEvents([])
          setTicketmasterEvents([])
          setAvailableCategories([])
        }
      } catch (error) {
        console.error('Error fetching events:', error)
        setAllTicketmasterEvents([])
        setTicketmasterEvents([])
        setPublicUserEvents([])
        setAvailableCategories([])
      } finally {
        setEventsLoading(false)
      }
    }

    fetchAllEvents()
  }, [selectedCity])

  // Filter Ticketmaster events when category changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      setTicketmasterEvents(allTicketmasterEvents.slice(0, 20))
    } else {
      const filtered = allTicketmasterEvents.filter((event) => {
        const cat = event.musicType || event.category || 'Sonstige'
        return cat === selectedCategory
      })
      setTicketmasterEvents(filtered.slice(0, 20))
    }
  }, [selectedCategory, allTicketmasterEvents])

  // Build combined events: 5 user-created events first, then 4 Ticketmaster events
  const combinedEvents = useMemo(() => {
    const userSlice = publicUserEvents.slice(0, 5).map((e: any) => ({
      ...e,
      _isUserCreated: true,
    }))

    let filteredTm = ticketmasterEvents
    if (selectedCategory !== 'all') {
      filteredTm = ticketmasterEvents.filter((event) => {
        const cat = event.musicType || event.category || 'Sonstige'
        return cat === selectedCategory
      })
    }
    const tmSlice = filteredTm.slice(0, 4).map((e: any) => ({
      ...e,
      _isUserCreated: false,
    }))

    return [...userSlice, ...tmSlice]
  }, [publicUserEvents, ticketmasterEvents, selectedCategory])

  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    setShowLocationModal(false)
    setSearchCity('')
  }

  const handleSearchCity = () => {
    if (!searchCity.trim()) return

    const matchedCity = availableCities.find(
      c => c.toLowerCase().includes(searchCity.toLowerCase())
    )

    if (matchedCity) {
      handleCitySelect(matchedCity)
      toast({ title: t('settings.locationChanged'), description: t('events.eventsInCity', { city: matchedCity }) })
    } else {
      toast({
        variant: 'destructive',
        title: t('events.cityNotAvailable'),
        description: t('events.selectAvailableCity')
      })
    }
  }

  // Animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(emailOrUsername, password)
      // Invalidate all cached queries so they refetch with auth token
      await queryClient.invalidateQueries()
      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.welcomeBack'),
      })
      navigate(from, { replace: true })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('auth.loginFailed'),
        description: error.response?.data?.message || t('auth.checkCredentials'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToContent = () => {
    document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60 z-10" />

          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-40"
            poster="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=1080&fit=crop"
          >
            <source src="/9640969-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-orange-500/10 z-10 animate-gradient bg-[length:400%_400%]" />
        </div>

        {/* Content */}
        <div className="container relative z-20 px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Branding */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Logo - Desktop - GROSS */}
              <div className="hidden lg:block mb-6">
                <img
                  src="/logo.png"
                  alt="Share Your Party"
                  className="h-32 xl:h-40 2xl:h-48 drop-shadow-2xl"
                />
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black mb-3">
                <span className="bg-gradient-to-r from-pink-500 via-orange-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Share Your Party
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-6">
                Entdecke Events. Sichere Tickets. Teile Erinnerungen.
              </p>

              {/* Compact Feature Icons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group relative flex items-center gap-2 px-3 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card transition-all cursor-default"
                  >
                    <div className={`w-6 h-6 rounded-full ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>

              {/* App Store Badges */}
              <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                <a
                  href="https://apps.apple.com/at/app/share-your-party/id6748308083"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform"
                >
                  <img
                    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                    alt="Download im App Store"
                    className="h-10"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.shareyourparty.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform"
                >
                  <img
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/de_badge_web_generic.png"
                    alt="Jetzt bei Google Play"
                    className="h-14 -my-2"
                  />
                </a>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="order-1 lg:order-2">
              <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-card/95 backdrop-blur-md animate-glow-pulse">
                <CardHeader className="text-center pb-4">
                  {/* Mobile Logo - GROSS */}
                  <img
                    src="/logo.png"
                    alt="Share Your Party"
                    className="mx-auto w-32 h-32 rounded-2xl object-cover mb-3 lg:hidden"
                  />
                  <CardTitle className="text-2xl gradient-text">{t('auth.welcome')}</CardTitle>
                  <CardDescription>
                    {t('auth.loginToDiscover')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.emailOrUsername')}</Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder={t('auth.emailPlaceholder')}
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('auth.password')}</Label>
                        <Link
                          to="/forgot-password"
                          className="text-sm text-primary hover:underline"
                        >
                          {t('auth.forgot')}
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-11 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" variant="gradient" className="w-full h-11 text-base" loading={isLoading}>
                      {t('auth.login')}
                    </Button>
                  </form>

                  <div className="mt-5">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          {t('common.or')}
                        </span>
                      </div>
                    </div>

                    <GoogleLoginButton
                      onSuccess={() => navigate(from, { replace: true })}
                      className="w-full"
                    />
                  </div>

                  <p className="mt-5 text-center text-sm text-muted-foreground">
                    {t('auth.noAccount')}{' '}
                    <Link to="/register" className="text-primary hover:underline font-semibold">
                      {t('auth.registerNow')}
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToContent}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer hover:scale-110 transition-transform"
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <span className="text-xs font-medium">{t('events.discover')}</span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </button>
      </section>

      {/* ===== PARTY PICS GALLERY SECTION ===== */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background via-background to-muted/30 fade-up overflow-hidden">
        <div className="container px-4">
          {/* Section Header */}
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 text-pink-500 text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              Erlebe unvergessliche Momente
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
              Dein{' '}
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">
                Party-Erlebnis
              </span>
              {' '}beginnt hier
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Verbinde dich mit Freunden, lerne neue Leute auf Events kennen, halte deine besten Momente in den Memories fest und teile sie mit der Community.
            </p>
          </div>

          {/* Photo Grid - Mosaic Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-14 max-w-5xl mx-auto">
            {/* Large image - spans 2 cols and 2 rows */}
            <div className="col-span-2 row-span-2 relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/partypics/party-1.jpeg"
                alt="Freunde feiern zusammen"
                className="w-full h-full object-cover aspect-square transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white font-semibold text-sm md:text-base">Gemeinsam feiern</p>
                <p className="text-white/70 text-xs md:text-sm">Die besten Nächte mit Freunden</p>
              </div>
            </div>

            {/* Top right */}
            <div className="relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/partypics/party-2.jpeg"
                alt="Party Crew"
                className="w-full h-full object-cover aspect-square transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Top right 2 */}
            <div className="relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/partypics/party-3.jpeg"
                alt="Disco Nacht"
                className="w-full h-full object-cover aspect-square transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Bottom right */}
            <div className="relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/partypics/party-4.jpeg"
                alt="Event Catering"
                className="w-full h-full object-cover aspect-square transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Bottom right 2 */}
            <div className="relative group rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/partypics/party-5.jpeg"
                alt="Event Genuss"
                className="w-full h-full object-cover aspect-square transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Neue Leute kennenlernen</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">Triff Gleichgesinnte auf Events in deiner Stadt</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Memories festhalten</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">Halte die besten Momente als Fotos fest</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Fotos hochladen</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">Teile deine Event-Fotos mit der Community</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Mit Freunden verbinden</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">Folge deinen Freunden und entdeckt Events zusammen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EVENTS SECTION - Bento Grid ===== */}
      <section id="events-section" className="py-12 md:py-20 bg-muted/30 fade-up overflow-hidden">
        <div className="container px-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
                <Ticket className="h-3.5 w-3.5" />
                {t('events.liveEvents')}
              </div>
              <h2 className="text-2xl md:text-3xl font-black">
                {t('events.eventsIn')}{' '}
                <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                  {selectedCity}
                </span>
              </h2>
            </div>

            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all text-sm group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center">
                <MapPin className="h-3 w-3 text-white" />
              </div>
              <span className="font-semibold text-sm">{selectedCity}</span>
              <Navigation className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* Category Pills */}
          {!eventsLoading && availableCategories.length > 0 && (
            <div className="flex items-center gap-2 mb-6 overflow-x-auto py-2 px-1 -mx-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                    : 'bg-card border border-border hover:border-primary/30 hover:shadow-sm'
                }`}
              >
                {t('common.all')}
              </button>
              {availableCategories.slice(0, 8).map((category) => {
                const style = categoryStyles[category] || { color: 'bg-purple-500' }
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? `${style.color} text-white shadow-md`
                        : 'bg-card border border-border hover:border-primary/30 hover:shadow-sm'
                    }`}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          )}

          {/* Events Bento Grid */}
          {eventsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[190px]">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`rounded-3xl bg-muted/60 animate-pulse ${
                    i === 0 ? 'col-span-2 row-span-2' :
                    i === 3 ? 'col-span-2' :
                    ''
                  }`}
                />
              ))}
            </div>
          ) : combinedEvents.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">{t('events.noEventsInCity', { city: selectedCity })}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[190px]">
              {combinedEvents.slice(0, 9).map((event, index) => {
                const categoryKey = event.musicType || event.category || 'Music'
                const style = categoryStyles[categoryKey] || { icon: Music, color: 'bg-purple-500' }
                const CategoryIcon = style.icon
                const eventImage = event.locationImages?.[0]?.url ||
                  'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop'

                // Size pattern for visual variety
                const sizeClass =
                  index === 0 ? 'col-span-2 row-span-2' :
                  index === 3 ? 'col-span-2' :
                  index === 7 ? 'col-span-2' :
                  ''

                // Is this a user-created event or a Ticketmaster event?
                const isUserEvent = event._isUserCreated
                const eventId = event._id || event.id

                // Insert CTA card after 5th event (index 4) - between user and TM events
                const ctaCard = index === 5 ? (
                  <Link
                    key="cta-register"
                    to="/register"
                    className="group relative overflow-hidden rounded-3xl col-span-2 row-span-1 bento-item"
                    style={{ animationDelay: `${5 * 70}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-orange-500 to-purple-600 bg-[length:200%_200%] animate-gradient" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
                    <div className="relative z-10 flex items-center justify-between h-full px-5 md:px-8 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm md:text-base font-medium mb-1">{t('events.discoverMore')}</p>
                        <h3 className="text-white font-black text-lg md:text-2xl leading-tight mb-1.5">
                          {t('events.discoverOrCreate')}
                        </h3>
                        <p className="text-white/70 text-sm md:text-base">
                          {t('auth.registerFreeJoinCommunity')}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                          <ArrowRight className="h-6 w-6 text-white group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl ring-2 ring-white/30 ring-inset" />
                  </Link>
                ) : null

                // Event card content (shared between Link and <a>)
                const cardContent = (
                  <>
                    <img
                      src={eventImage}
                      alt={event.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-300" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`px-2.5 py-1 rounded-xl ${style.color} text-white text-[10px] font-bold flex items-center gap-1 shadow-lg`}>
                        <CategoryIcon className="h-3 w-3" />
                        {categoryKey}
                      </span>
                    </div>

                    {/* Date Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2 py-1 rounded-xl bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                        {formatEventDate(event.eventDate)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
                      <h3 className={`font-bold text-white group-hover:text-primary transition-colors duration-300 line-clamp-2 ${
                        index === 0 ? 'text-base md:text-lg' : 'text-sm'
                      }`}>
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-1 text-white/70 mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs line-clamp-1">{event.locationName}</span>
                      </div>
                      {isUserEvent ? (
                        event.price > 0 ? (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 text-white text-[11px] font-bold">
                            {typeof event.price === 'number' ? `€${event.price.toFixed(2)}` : `€${event.price}`}
                          </span>
                        ) : (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-lg bg-green-500 text-white text-[11px] font-bold">
                            Kostenlos
                          </span>
                        )
                      ) : (
                        event.price && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-lg bg-primary/80 text-white text-[11px] font-bold">
                            ab €{event.price}
                          </span>
                        )
                      )}
                    </div>

                    {/* Hover ring */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl ring-2 ring-primary/50 ring-inset" />
                  </>
                )

                return (
                  <React.Fragment key={eventId || index}>
                    {ctaCard}
                    {isUserEvent ? (
                      // User-created events: link to internal event detail page
                      <Link
                        to={`/event/${eventId}`}
                        className={`group relative overflow-hidden rounded-3xl ${sizeClass} bento-item`}
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        {cardContent}
                      </Link>
                    ) : (
                      // Ticketmaster events: open external URL
                      <a
                        href={event.externalUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group relative overflow-hidden rounded-3xl ${sizeClass} bento-item`}
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        {cardContent}
                      </a>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== BLOG / MAGAZIN SECTION - Bento Grid ===== */}
      <section className="py-12 md:py-20 fade-up overflow-hidden">
        <div className="container px-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs font-semibold mb-3">
                <BookOpen className="h-3.5 w-3.5" />
                {t('blog.magazine')}
              </div>
              <h2 className="text-2xl md:text-3xl font-black">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {t('blog.partyMagazine')}
                </span>
              </h2>
            </div>
          </div>

          {/* Blog Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
            {blogArticles.map((article, index) => {
              // Size pattern: first large, then alternating
              const sizeClass =
                index === 0 ? 'col-span-2 row-span-2 md:col-span-1 md:row-span-2' :
                index === 1 ? 'col-span-1 row-span-1 md:col-span-2 md:row-span-1' :
                index === 4 ? 'col-span-2 md:col-span-1' :
                ''

              return (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative overflow-hidden rounded-3xl ${sizeClass} bento-item`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={article.image}
                    alt={article.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950/85 via-purple-900/20 to-transparent group-hover:from-purple-950/75 transition-all duration-300" />

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2.5 py-1 rounded-xl ${blogCategoryColors[article.category]} text-white text-[10px] font-bold shadow-lg`}>
                      {article.category}
                    </span>
                  </div>

                  {/* Read time */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
                    <h3 className={`font-bold text-white group-hover:text-purple-300 transition-colors duration-300 line-clamp-2 ${
                      index === 0 ? 'text-base md:text-lg' : 'text-sm'
                    }`}>
                      {article.title}
                    </h3>
                    {(index === 0 || sizeClass.includes('col-span-2')) && (
                      <p className="text-white/50 text-xs mt-1 line-clamp-1">{article.excerpt}</p>
                    )}
                  </div>

                  {/* Hover ring */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl ring-2 ring-purple-400/50 ring-inset" />
                </a>
              )
            })}

            {/* "Alle Artikel" CTA Bubble */}
            <a
              href="https://shareyourparty.de/blog/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-purple-500/10 border-2 border-dashed border-purple-500/20 hover:border-purple-500/50 hover:from-purple-500/15 hover:to-pink-500/15 transition-all duration-500 flex items-center justify-center bento-item"
              style={{ animationDelay: '600ms' }}
            >
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-sm">{t('blog.allArticles')}</p>
                <p className="text-[11px] text-muted-foreground">{t('blog.readInBlog')}</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Compact CTA */}
      <section className="py-10 px-4 fade-up">
        <div className="container">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-pink-500 to-orange-500 p-6 md:p-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                  {t('cta.readyForAdventure')}
                </h2>
                <p className="text-white/90 text-sm md:text-base">
                  {t('cta.thousandsEventsWaiting')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link to="/register">
                  <Button size="lg" className="rounded-full px-6 bg-white text-pink-600 hover:bg-white/90 font-bold shadow-xl">
                    {t('cta.startNow')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <a href="https://apps.apple.com/at/app/share-your-party/id6748308083" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform">
                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-9" />
                  </a>
                  <a href="https://play.google.com/store/apps/details?id=com.shareyourparty.app" target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform">
                    <img src="https://play.google.com/intl/en_us/badges/static/images/badges/de_badge_web_generic.png" alt="Google Play" className="h-12 -my-1" />
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-fade-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{t('events.selectLocation')}</CardTitle>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('events.searchCity')}
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchCity()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearchCity}>{t('common.search')}</Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {availableCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedCity === city
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    <MapPin className={`h-4 w-4 ${selectedCity === city ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-sm">{city}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compact Footer */}
      <footer className="py-8 px-4 border-t bg-card/50">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SYP" className="h-10 w-10 rounded-xl shadow-lg" />
              <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                ShareYourParty
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <Link to="/explore" className="hover:text-foreground transition-colors">{t('footer.events')}</Link>
              <a href="https://shareyourparty.de/blog/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{t('footer.blog')}</a>
              <Link to="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
              <Link to="/imprint" className="hover:text-foreground transition-colors">{t('footer.imprint')}</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
