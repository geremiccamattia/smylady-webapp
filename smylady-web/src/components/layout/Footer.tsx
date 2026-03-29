import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="hidden md:block border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
            <p className="text-sm text-muted-foreground">
              {t('home.footerDesc')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('home.quickLinks')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explore" className="hover:text-foreground">{t('home.discoverEvents')}</Link></li>
              <li><Link to="/create-event" className="hover:text-foreground">{t('events.createEvent')}</Link></li>
              <li><Link to="/my-tickets" className="hover:text-foreground">{t('tickets.myTickets')}</Link></li>
              <li><Link to="/favorites" className="hover:text-foreground">{t('favorites.title')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">{t('home.support')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground">{t('legal.contact')}</Link></li>
              <li><a href="mailto:office@shareyourparty.de" className="hover:text-foreground">{t('home.emailSupport')}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('home.legalTitle')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground">{t('legal.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">{t('legal.terms')}</Link></li>
              <li><Link to="/imprint" className="hover:text-foreground">{t('legal.impressum')}</Link></li>
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
