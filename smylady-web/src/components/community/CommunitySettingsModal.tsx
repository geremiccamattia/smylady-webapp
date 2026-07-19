'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { communityService } from '@/services/community'

interface CommunitySettingsModalProps {
  communityId: string
  settings?: { requireApproval: boolean; allowMemberEvents: boolean }
  isCreator?: boolean
  onUpdate: () => void
}

export default function CommunitySettingsModal({
  communityId,
  settings,
  isCreator,
  onUpdate,
}: CommunitySettingsModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [requireApproval, setRequireApproval] = useState(settings?.requireApproval ?? false)
  const [allowMemberEvents, setAllowMemberEvents] = useState(settings?.allowMemberEvents ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await communityService.updateSettings(communityId, { requireApproval, allowMemberEvents })
      toast({ title: t('community.settingsSaved', { defaultValue: 'Einstellungen gespeichert!' }) })
      onUpdate()
    } catch {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Beitritt mit Genehmigung */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-medium text-sm">
            {t('community.requireApproval', { defaultValue: 'Beitritt nur mit Genehmigung' })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('community.requireApprovalDesc', { defaultValue: 'Neue Mitglieder müssen von einem Admin genehmigt werden.' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRequireApproval(!requireApproval)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            requireApproval ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            requireApproval ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Mitglieder dürfen Events erstellen */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-medium text-sm">
            {t('community.allowMemberEvents', { defaultValue: 'Mitglieder dürfen Events erstellen' })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('community.allowMemberEventsDesc', { defaultValue: 'Wenn deaktiviert, können nur Admins Community Events erstellen.' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAllowMemberEvents(!allowMemberEvents)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            allowMemberEvents ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            allowMemberEvents ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Admin-Verwaltung Link (nur Creator) */}
      {isCreator && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            {t('community.adminHint', { defaultValue: 'Tippe auf ein Mitglied in der Mitgliederliste um es zum Admin zu ernennen.' })}
          </p>
        </div>
      )}

      <Button variant="gradient" className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? t('common.loading', { defaultValue: 'Lädt...' }) : t('common.save', { defaultValue: 'Speichern' })}
      </Button>
    </div>
  )
}
