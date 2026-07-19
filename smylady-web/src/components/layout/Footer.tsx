'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useLocalePath } from '@/hooks/useLocalePath'

export default function Footer() {
  const { t, i18n } = useTranslation()
  const localePath = useLocalePath()

  return (
    <footer className="hidden md:block border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Share Your Party"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-bold text-xl gradient-text">Share Your Party</span>
            </div>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('home.footerDesc')}
            </p>
            {/* Social Media */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.facebook.com/profile.php?id=61586246214092"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/shareyourparty_official"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/122214400/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
            {/* App Store Badges */}
            <div className="flex items-center gap-3 pt-3">
              <a
                href="https://apps.apple.com/at/app/share-your-party/id6748308083"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={i18n.language?.startsWith('en') ? '/ios-logo-en.svg' : '/ios-logo-de.svg'}
                  alt="Download on the App Store"
                  className="h-10"
                />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.shareyourparty.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={i18n.language?.startsWith('en') ? '/android-logo-en.png' : '/android-logo-de.png'}
                  alt="Get it on Google Play"
                  className="h-10"
                />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('home.quickLinks')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={localePath('/explore')} className="hover:text-foreground">{t('home.discoverEvents')}</Link></li>
              <li><Link href={localePath('/create-event')} className="hover:text-foreground">{t('events.createEvent')}</Link></li>
              <li><Link href={localePath('/my-tickets')} className="hover:text-foreground">{t('tickets.myTickets')}</Link></li>
              <li><Link href={localePath('/favorites')} className="hover:text-foreground">{t('favorites.title')}</Link></li>
              <li><Link href={localePath('/veranstalter')} className="hover:text-foreground">{t('footer.organizerInfo')}</Link></li>
              <li><Link href={localePath('/events/wien')} className="hover:text-foreground">Events in Wien</Link></li>
              <li><Link href={localePath('/grounding')} className="hover:text-foreground">Über Share Your Party</Link></li>
              <li><a href="https://blog.shareyourparty.de" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Blog</a></li>
              <li><Link href={localePath('/influencer-club')} className="hover:text-foreground">{t('footer.influencerClub', { defaultValue: 'Influencer Club' })}</Link></li>
              <li><Link href={localePath('/influencer-events')} className="hover:text-foreground">{t('footer.influencerMarketing', { defaultValue: 'Influencer Events' })}</Link></li>
            </ul>
          </div>

          {/* Kategorien */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.categories', { defaultValue: 'Kategorien' })}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={localePath('/events/konzerte-wien')} className="hover:text-foreground">
                  {t('footer.concertsVienna', { defaultValue: 'Konzerte in Wien' })}
                </Link>
              </li>
              <li>
                <Link href={localePath('/events/clubbing-wien')} className="hover:text-foreground">
                  {t('footer.clubbingVienna', { defaultValue: 'Clubbing in Wien' })}
                </Link>
              </li>
              <li>
                <Link href={localePath('/events/business-events-wien')} className="hover:text-foreground">
                  {t('footer.businessEventsVienna', { defaultValue: 'Business Events in Wien' })}
                </Link>
              </li>
              <li>
                <Link href={localePath('/events/workshops-wien')} className="hover:text-foreground">
                  {t('footer.workshopsVienna', { defaultValue: 'Workshops in Wien' })}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">{t('home.support')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={localePath('/contact')} className="hover:text-foreground">{t('legal.contact')}</Link></li>
              <li><a href="mailto:office@shareyourparty.de" className="hover:text-foreground">{t('home.emailSupport')}</a></li>
              <li>
                <Link href={localePath('/api')} className="hover:text-foreground">
                  {t('footer.apiDocs', { defaultValue: 'API-Dokumentation' })}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('home.legalTitle')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={localePath('/privacy')} className="hover:text-foreground">{t('legal.privacy')}</Link></li>
              <li><Link href={localePath('/terms')} className="hover:text-foreground">{t('legal.terms')}</Link></li>
              <li><Link href={localePath('/imprint')} className="hover:text-foreground">{t('legal.impressum')}</Link></li>
              <li><Link href={localePath('/pricing')} className="hover:text-foreground">{t('pricing.title', { defaultValue: 'Preise & Konditionen' })}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>{t('home.allRights', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
