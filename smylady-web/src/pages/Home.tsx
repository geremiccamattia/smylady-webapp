import { useQuery } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { ticketmasterService } from '@/services/ticketmaster'
import EventCard from '@/components/events/EventCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  PartyPopper,
  Compass,
  QrCode,
  Camera,
  MessageCircle,
  Users,
  CalendarPlus,
  Shield,
  MapPin,
  Flag,
  UserX,
  Lock,
  CreditCard,
  ChevronRight,
  Sparkles,
  CalendarDays,
  ExternalLink,
} from 'lucide-react'
import { StoriesBar } from '@/components/stories/StoriesBar'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Blog articles from shareyourparty.de/blog
const blogArticles = [
  {
    title: 'Gartenparty im Sommer planen',
    excerpt: 'Endlich wird es wieder wärmer und die Tage werden länger – die perfekte Zeit für Gartenpartys.',
    date: '22. Feb 2026',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop',
    link: 'https://shareyourparty.de/blog/gartenparty-planen/',
    category: 'Tipps'
  },
  {
    title: 'Spontan ausgehen – so findest du Events',
    excerpt: 'Guide für das Finden von Events ohne große Planung – schnell und unkompliziert.',
    date: '13. Feb 2026',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop',
    link: 'https://shareyourparty.de/blog/spontan-ausgehen/',
    category: 'Guide'
  },
  {
    title: 'Sicher auf Partys: Dein Guide',
    excerpt: 'Sicher auf Partys zu sein geht auch – Safety-Tipps für sorgenfreies Feiern.',
    date: '17. Jan 2026',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    link: 'https://shareyourparty.de/blog/sicher-auf-partys/',
    category: 'Sicherheit'
  },
  {
    title: 'Private Partys & Underground Events',
    excerpt: 'Entdecke private und Underground Events in deiner Stadt – exklusiv und einzigartig.',
    date: '19. Nov 2025',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
    link: 'https://shareyourparty.de/blog/private-partys-finden/',
    category: 'Entdecken'
  }
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventsService.getEvents({}, true),
    enabled: isAuthenticated,
  })

  // Fetch public events for non-authenticated users (no auth required)
  const { data: publicEvents, isLoading: publicEventsLoading } = useQuery({
    queryKey: ['events', 'public', 'upcoming'],
    queryFn: () => eventsService.getPublicEvents({}, true),
    enabled: !isAuthenticated,
  })

  // Fetch Ticketmaster events for the landing page (Vienna area)
  const { data: ticketmasterEvents } = useQuery({
    queryKey: ['ticketmaster-events', 'homepage'],
    queryFn: () => ticketmasterService.getEvents(
      { latitude: '48.2082', longitude: '16.3738', radius: '50' },
      true,
      false,
    ),
    enabled: !isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  // Split: 5 user-created events first, then 4 Ticketmaster events
  const { userEvents, tmEvents } = useMemo(() => {
    const userCreated = (publicEvents || []).filter(
      (e) => !e.isTicketmaster && !e.isExternalEvent && e.source !== 'ticketmaster'
    )
    const tm = (ticketmasterEvents || []).map((e) => ({ ...e, isTicketmaster: true }))
    return {
      userEvents: userCreated.slice(0, 5),
      tmEvents: tm.slice(0, 4),
    }
  }, [publicEvents, ticketmasterEvents])

  // Features for the landing page
  const features = [
    {
      icon: Compass,
      title: t('home.feature1Title'),
      description: t('home.feature1Desc'),
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10'
    },
    {
      icon: QrCode,
      title: t('home.feature2Title'),
      description: t('home.feature2Desc'),
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      icon: Camera,
      title: t('home.feature3Title'),
      description: t('home.feature3Desc'),
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: MessageCircle,
      title: t('home.feature4Title'),
      description: t('home.feature4Desc'),
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Users,
      title: t('home.feature5Title'),
      description: t('home.feature5Desc'),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: CalendarPlus,
      title: t('home.feature6Title'),
      description: t('home.feature6Desc'),
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-500/10'
    }
  ]

  // Safety features
  const safetyFeatures = [
    { icon: Shield, text: t('home.safety1') },
    { icon: MapPin, text: t('home.safety2') },
    { icon: Flag, text: t('home.safety3') },
    { icon: UserX, text: t('home.safety4') },
    { icon: Lock, text: t('home.safety5') },
    { icon: CreditCard, text: t('home.safety6') }
  ]

  // How it works steps
  const steps = [
    { icon: Compass, title: t('home.step1Title'), description: t('home.step1Desc'), color: 'text-pink-500 bg-pink-500/10' },
    { icon: QrCode, title: t('home.step2Title'), description: t('home.step2Desc'), color: 'text-orange-500 bg-orange-500/10' },
    { icon: Camera, title: t('home.step3Title'), description: t('home.step3Desc'), color: 'text-purple-500 bg-purple-500/10' },
    { icon: Users, title: t('home.step4Title'), description: t('home.step4Desc'), color: 'text-green-500 bg-green-500/10' }
  ]

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

  // Landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background z-10" />
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-30"
              poster="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=1080&fit=crop"
            >
              <source src="/videos/party-bg.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Hero Content */}
          <div className="container relative z-20 px-4 py-20 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6 animate-pulse">
              <Sparkles className="h-4 w-4" />
              {t('home.availableNow')}
            </div>

            {/* Logo */}
            <div className="mb-8">
              <img
                src="/logo.png"
                alt="Share Your Party"
                className="h-32 md:h-40 lg:h-48 mx-auto drop-shadow-2xl"
              />
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-orange-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Share Your Party
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t('home.subtitle')}
              <br className="hidden md:block" />
              {t('home.subtitleLine2')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/register">
                <Button size="lg" variant="gradient" className="text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  {t('auth.registerFree')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full">
                  {t('auth.login')}
                </Button>
              </Link>
            </div>

            {/* App Store Badges */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="https://apps.apple.com/at/app/share-your-party/id6748308083"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-105 transition-transform"
              >
                <img
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="Download im App Store"
                  className="h-12"
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
                  className="h-16 -my-2"
                />
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
            </div>
          </div>
        </section>

        {/* Community Events Section - User-created public events */}
        {userEvents.length > 0 && (
          <section className="py-20 px-4 fade-up">
            <div className="container">
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 text-sm font-semibold mb-4">
                  <CalendarDays className="h-4 w-4" />
                  {t('home.communityEventsLabel', { defaultValue: 'Community Events' })}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  {t('home.communityEventsTitle', { defaultValue: 'Von der Community' })}{' '}
                  <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                    {t('home.communityEventsHighlight', { defaultValue: 'für dich' })}
                  </span>
                </h2>
                <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                  {t('home.communityEventsSubtitle', { defaultValue: 'Entdecke einzigartige Events, die von echten Veranstaltern in deiner Nähe erstellt wurden.' })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userEvents.map((event) => (
                  <EventCard key={event.id || event._id} event={event} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Ticketmaster Events Section */}
        {tmEvents.length > 0 && (
          <section className="py-16 px-4 bg-muted/20 fade-up">
            <div className="container">
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-semibold mb-4">
                  <ExternalLink className="h-4 w-4" />
                  {t('home.ticketmasterLabel', { defaultValue: 'Weitere Events' })}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  {t('home.ticketmasterTitle', { defaultValue: 'Beliebte' })}{' '}
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    {t('home.ticketmasterHighlight', { defaultValue: 'Veranstaltungen' })}
                  </span>
                </h2>
                <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                  {t('home.ticketmasterSubtitle', { defaultValue: 'Konzerte, Shows und mehr aus dem Ticketmaster-Netzwerk in deiner Region.' })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {tmEvents.map((event) => (
                  <EventCard key={event.id || event._id} event={event} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Combined "Show All" button */}
        {(userEvents.length > 0 || tmEvents.length > 0) && (
          <section className="py-8 px-4">
            <div className="container text-center">
              <Link to="/explore">
                <Button size="lg" variant="outline" className="gap-2 rounded-full px-8">
                  {t('home.publicEventsShowAll', { defaultValue: 'Alle Events entdecken' })}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {publicEventsLoading && (
          <section className="py-20 px-4">
            <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t('home.publicEventsTitle', { defaultValue: 'Aktuelle' })}{' '}
                  <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                    {t('home.publicEventsHighlight', { defaultValue: 'Events' })}
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section - Bento Grid */}
        <section className="py-20 px-4 fade-up">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-semibold mb-4">
                {t('home.features')}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {t('home.oneApp')}
                <br />
                <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                  {t('home.unlimitedPossibilities')}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${index === 0 || index === 4 ? 'md:col-span-2 lg:col-span-2' : ''}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color}`} />
                  <CardContent className="p-6 md:p-8">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-4`}>
                      <feature.icon className={`h-6 w-6 bg-gradient-to-r ${feature.color} bg-clip-text`} style={{ color: feature.color.includes('pink') ? '#ec4899' : feature.color.includes('orange') ? '#f97316' : feature.color.includes('purple') ? '#a855f7' : feature.color.includes('green') ? '#22c55e' : feature.color.includes('blue') ? '#3b82f6' : '#ef4444' }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-20 px-4 bg-muted/30 fade-up">
          <div className="container">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-sm font-semibold mb-4">
                {t('home.howItWorks')}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {t('home.yourComplete')}
                <br />
                <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                  {t('home.eventExperience')}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <Card key={index} className="relative group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-card/50 backdrop-blur-sm">
                  <div className="absolute top-4 right-4 text-6xl font-black text-muted/20">
                    {index + 1}
                  </div>
                  <CardContent className="p-6 relative">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${step.color} mb-4`}>
                      <step.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section className="py-20 px-4 fade-up">
          <div className="container">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/5 via-background to-blue-500/5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8 md:p-12 relative">
                <span className="inline-block px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-semibold mb-4">
                  {t('home.yourSafety')}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('home.safeCelebrate')}
                  <br />
                  {t('home.carefreeEnjoy')}
                </h2>
                <p className="text-muted-foreground max-w-xl mb-8">
                  {t('home.safetyDesc')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {safetyFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-green-500/10"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-sm font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-20 px-4 bg-muted/30 fade-up">
          <div className="container">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 text-sm font-semibold mb-4">
                {t('home.preview')}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {t('home.experience')}{' '}
                <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                  ShareYourParty
                </span>
                <br />
                {t('home.inAction')}
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 p-[3px]">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/pg2ITM43plI"
                    title="ShareYourParty App Preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="py-20 px-4 fade-up">
          <div className="container">
            <div className="flex items-center justify-between mb-12">
              <div>
                <span className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-semibold mb-4">
                  {t('home.blog')}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t('home.latestArticles')}
                </h2>
              </div>
              <a
                href="https://shareyourparty.de/blog/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 text-primary hover:underline font-medium"
              >
                {t('home.allArticles')}
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogArticles.map((article, index) => (
                <a
                  key={index}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">{article.date}</p>
                      <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            <div className="text-center mt-8 md:hidden">
              <a
                href="https://shareyourparty.de/blog/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  {t('home.allArticles')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 fade-up">
          <div className="container">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-pink-500/10 via-background to-orange-500/10">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
              <CardContent className="p-8 md:p-16 text-center relative">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  {t('home.readyFor')}
                  <br />
                  <span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                    {t('home.nextEvent')}
                  </span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                  {t('home.downloadFree')}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <Link to="/register">
                    <Button size="lg" variant="gradient" className="text-lg px-8 py-6 rounded-full shadow-lg shadow-primary/25">
                      {t('home.startNow')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <a
                    href="https://apps.apple.com/at/app/share-your-party/id6748308083"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:scale-105 transition-transform"
                  >
                    <img
                      src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                      alt="Download im App Store"
                      className="h-12"
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
                      className="h-16 -my-2"
                    />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  // Authenticated user view
  return (
    <div className="space-y-12">
      {/* Stories Section */}
      <section>
        <Card>
          <CardContent className="p-4">
            <StoriesBar />
          </CardContent>
        </Card>
      </section>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('events.upcoming')}</h2>
          <Link to="/explore">
            <Button variant="ghost" className="gap-2">
              {t('common.showAll')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('events.couldNotLoad')}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 6).map((event) => (
              <EventCard key={event.id || event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PartyPopper className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('events.noEvents')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('events.beFirstToCreate')}
            </p>
            <Link to="/create-event">
              <Button variant="gradient">{t('events.createEvent')}</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">{t('home.discoverCategories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: t('home.categoryMusic'), value: 'Music', emoji: '🎵', color: 'from-pink-500 to-rose-500' },
            { name: t('home.categoryConcert'), value: 'Concert', emoji: '🎸', color: 'from-purple-500 to-indigo-500' },
            { name: t('home.categoryOutdoor'), value: 'Nature', emoji: '🌳', color: 'from-green-500 to-teal-500' },
            { name: t('home.categoryTheme'), value: 'Theme', emoji: '🎭', color: 'from-orange-500 to-red-500' },
          ].map((category) => (
            <Link
              key={category.value}
              to={`/explore?category=${category.value}`}
              className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${category.color} text-white hover:scale-105 transition-transform`}
            >
              <span className="text-4xl">{category.emoji}</span>
              <h3 className="mt-2 font-semibold text-lg">{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12 px-4 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
        <h2 className="text-3xl font-bold mb-4">{t('home.readyFor')} {t('home.nextEvent')}</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('home.downloadApp')}
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a
            href="https://apps.apple.com/at/app/share-your-party/id6748308083"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg" className="gap-2">
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-6" />
              App Store
            </Button>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.shareyourparty.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg" className="gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/512px-Google_Play_Store_badge_EN.svg.png" alt="Google Play" className="h-6" />
              Google Play
            </Button>
          </a>
        </div>
      </section>
    </div>
  )
}
