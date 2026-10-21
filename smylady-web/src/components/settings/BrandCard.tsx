'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useBrandProfile } from '@/hooks/useBrandProfile'

/**
 * Der Einstieg zum Brand-Bereich in den Kontoeinstellungen.
 *
 * Firmendaten wie Website, Branche und Ansprechperson liegen nicht im
 * allgemeinen Profil, sondern unter /brand/profile. Ohne diesen Eintrag fand
 * eine Brand sie nur über das Dashboard — Gegenstück zur CreatorCard.
 *
 * Rendert null für alle, die keine Brand sind. `isBrand` kommt aus
 * GET /users/me; ein Nutzerobjekt aus dem localStorage kann das Feld noch
 * nicht haben. Deshalb zählt zusätzlich ein Brand-Profil in Prüfung oder
 * freigeschaltet (GET /brands/me) — sonst fehlte der Karte die frisch
 * registrierte Brand, die ihr Profil noch korrigieren will.
 */
export function BrandCard() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { user } = useAuth()
  const { standing } = useBrandProfile()

  const isBrand = Boolean(user?.isBrand) || standing === 'pending' || standing === 'active'
  if (!isBrand) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {t('brandDashboard.profileTitle', { defaultValue: 'Dein Unternehmen' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="ghost" className="w-full justify-between" asChild>
          <Link href={localePath('/brand')}>
            {t('brandDashboard.title', { defaultValue: 'Brand-Dashboard' })}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-between" asChild>
          <Link href={localePath('/brand/profile')}>
            {t('brandDashboard.editBrandProfile', { defaultValue: 'Brand-Profil bearbeiten' })}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default BrandCard
