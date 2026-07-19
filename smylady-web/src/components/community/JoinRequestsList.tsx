'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { communityService } from '@/services/community'
import { resolveImageUrl, getInitials } from '@/lib/utils'

interface JoinRequestsListProps {
  communityId: string
  onUpdate: () => void
}

export default function JoinRequestsList({ communityId, onUpdate }: JoinRequestsListProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['joinRequests', communityId],
    queryFn: () => communityService.getJoinRequests(communityId),
  })

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId)
    try {
      await communityService.handleJoinRequest(communityId, userId, action)
      toast({
        title: action === 'approve'
          ? t('community.memberApproved', { defaultValue: 'Mitglied genehmigt!' })
          : t('community.requestRejected', { defaultValue: 'Anfrage abgelehnt' }),
      })
      refetch()
      onUpdate()
    } catch {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }) })
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-4">{t('common.loading', { defaultValue: 'Lädt...' })}</p>
  }

  if (!requests || requests.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {t('community.noRequests', { defaultValue: 'Keine offenen Anfragen.' })}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((request: any) => {
        const user = request.userId
        return (
          <div key={user._id} className="flex items-center gap-3 p-3 border rounded-xl">
            <Link href={localePath(`/user/${user._id}`)}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={resolveImageUrl(user.profileImage)} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(request.requestedAt).toLocaleDateString('de-AT')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="gradient"
                size="sm"
                onClick={() => handleAction(user._id, 'approve')}
                disabled={actionLoading === user._id}
              >
                {t('community.approve', { defaultValue: 'Annehmen' })}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => handleAction(user._id, 'reject')}
                disabled={actionLoading === user._id}
              >
                {t('community.reject', { defaultValue: 'Ablehnen' })}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
