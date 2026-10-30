'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import MobileNav from './MobileNav'
import { BrandInvitationBanner } from '@/components/brand/BrandInvitationBanner'
import { useAuth } from '@/contexts/AuthContext'
import { useResumeBrandInvite } from '@/hooks/useResumeBrandInvite'

/**
 * Hier kein Einladungs-Banner: Registrierung, Bewerbung und Einladungsseite
 * bleiben ungestört, und im Bereich /brand (samt /brand/invite) hilft er nicht.
 */
const NO_INVITATION_BANNER = /^\/(login|register|interests|creator\/apply|brand)(\/|$)/

export default function Layout({ children }: { children: React.ReactNode }) {
  useResumeBrandInvite()
  const { user } = useAuth()
  const pathname = usePathname()
  const showInvitations = Boolean(user) && !NO_INVITATION_BANNER.test(pathname.replace(/^\/en(?=\/|$)/, ''))

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {showInvitations && <BrandInvitationBanner />}
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
