'use client'

import { useTranslation } from 'react-i18next'
import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BrandInvitationRow } from '@/components/brand/BrandInvitationBanner'
import { useMyBrandInvitations } from '@/hooks/useMyBrandInvitations'

/**
 * Offene Brand-Einladungen in den Kontoeinstellungen: Hier bleiben sie
 * auffindbar, auch wenn der Banner ausgeblendet wurde. Rendert null, wenn
 * keine offen ist.
 */
export function BrandInvitationsCard() {
  const { t } = useTranslation()
  const { invitations } = useMyBrandInvitations()

  if (invitations.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {t('brandInviteInbox.settingsTitle', { defaultValue: 'Brand-Einladungen' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {invitations.map((invitation) => (
          <BrandInvitationRow key={invitation.id} invitation={invitation} />
        ))}
      </CardContent>
    </Card>
  )
}

export default BrandInvitationsCard
