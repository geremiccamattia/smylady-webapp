'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, UserPlus, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { userService } from '@/services/user'

export interface Subscriber {
  _id?: string
  id?: string
  name: string
  username?: string
  profileImage?: string
}

/**
 * Abonnenten des eingeloggten Veranstalters — die Menge, aus der bei
 * `visibility: 'selected'` eingeladen wird.
 *
 * Der Query-Key ist bewusst derselbe wie bisher in CreateEvent, damit React Query
 * die Liste zwischen Picker und aufrufender Seite teilt statt zweimal zu laden.
 */
export function useSubscribers(userId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', userId],
    queryFn: () => userService.getSubscribers(userId || ''),
    enabled: !!userId,
  })

  const subscribers: Subscriber[] = (Array.isArray(data) ? data : []).map((user: Subscriber) => ({
    id: user._id || user.id,
    _id: user._id || user.id,
    name: user.name || user.username || 'Unknown',
    username: user.username,
    profileImage: user.profileImage,
  }))

  return { subscribers, isLoading }
}

export function getSubscriberId(subscriber: Subscriber): string {
  return subscriber._id || subscriber.id || ''
}

/**
 * Bringt `event.invitedUsers` auf eine anzeigbare Form.
 *
 * Das Feld kommt je nach Endpoint entweder als Liste von IDs oder als populierte
 * User-Objekte zurück (dasselbe Muster wie `post.user || post.userId`), deshalb
 * werden beide Formen akzeptiert. Bei reinen IDs wird der Name aus der
 * Abonnentenliste nachgeschlagen; bleibt er leer, hat die Person das Abo
 * inzwischen beendet — die Einladung gilt weiter, nur der Name fehlt.
 */
export function normalizeInvitedUsers(raw: unknown, subscribers: Subscriber[] = []): Subscriber[] {
  if (!Array.isArray(raw)) return []

  const byId = new Map(subscribers.map((s) => [getSubscriberId(s), s]))

  return raw.flatMap((entry): Subscriber[] => {
    if (typeof entry === 'string') {
      const known = byId.get(entry)
      return [known ?? { _id: entry, id: entry, name: '' }]
    }

    if (entry && typeof entry === 'object') {
      const candidate = entry as Subscriber
      const id = getSubscriberId(candidate)
      if (!id) return []
      const known = byId.get(id)
      return [{
        _id: id,
        id,
        name: candidate.name || candidate.username || known?.name || '',
        username: candidate.username || known?.username,
        profileImage: candidate.profileImage || known?.profileImage,
      }]
    }

    return []
  })
}

interface SubscriberPickerProps {
  /** Veranstalter, dessen Abonnenten zur Auswahl stehen. */
  userId?: string
  /** Aktuell ausgewählte IDs. */
  value: string[]
  onChange: (ids: string[]) => void
  /**
   * IDs, die bereits eingeladen sind. Sie werden aus der Auswahl ausgeblendet,
   * damit niemand ein zweites Mal eingeladen werden kann.
   */
  excludeUserIds?: string[]
  className?: string
}

/**
 * Auswahl der einzuladenden Abonnenten — Trigger-Button plus Dialog.
 *
 * Wird von CreateEvent (Ersteinladung) und EditEvent (Nachladen) gemeinsam
 * genutzt; die Auswahl selbst hält die aufrufende Seite.
 */
export function SubscriberPicker({
  userId,
  value,
  onChange,
  excludeUserIds = [],
  className,
}: SubscriberPickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { subscribers, isLoading } = useSubscribers(userId)

  const excluded = new Set(excludeUserIds)
  const selectable = subscribers.filter((s) => !excluded.has(getSubscriberId(s)))

  const toggleSubscriber = (subscriberId: string) => {
    if (value.includes(subscriberId)) {
      onChange(value.filter((id) => id !== subscriberId))
    } else {
      onChange([...value, subscriberId])
    }
  }

  return (
    <>
      <Button
        type="button"
        className={className ?? 'w-full'}
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {value.length > 0
          ? t('createEvent.selectedCount', { count: value.length })
          : t('createEvent.selectSubscribers')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('createEvent.selectSubscribers')}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : selectable.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {subscribers.length === 0
                    ? t('createEvent.noSubscribers')
                    : t('createEvent.allSubscribersInvited', {
                        defaultValue: 'Alle deine Abonnenten sind bereits eingeladen.',
                      })}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectable.map((subscriber) => {
                  const subId = getSubscriberId(subscriber)
                  return (
                    <div
                      key={subId}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => toggleSubscriber(subId)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={subscriber.profileImage || ''} />
                        <AvatarFallback>
                          {subscriber.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{subscriber.name}</p>
                        {subscriber.username && (
                          <p className="text-sm text-muted-foreground">@{subscriber.username}</p>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          value.includes(subId)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {value.includes(subId) && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full" onClick={() => setOpen(false)}>
              {t('common.done')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SubscriberPicker
