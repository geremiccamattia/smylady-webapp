'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Crown, LogOut, Mail, RefreshCw, Trash2, UserMinus, UserPlus, Users } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useBrandProfile, useBrandTeam, useRefreshBrandTeam } from '@/hooks/useBrandProfile'
import {
  brandErrorStatus,
  brandService,
  readBrandError,
  readBrandTeamError,
  type BrandInvitation,
  type BrandTeamMember,
} from '@/services/brand'
import { formatDate, getInitials, isValidEmail, resolveImageUrl } from '@/lib/utils'
import { BrandGate, LoadingBars } from '@/components/brand/brandShared'

/**
 * Team der Brand: Mitglieder, offene Einladungen, Inhaber-Wechsel.
 *
 * Der Inhaber sieht alle Aktionen, ein Mitglied die Liste und „Team verlassen".
 * Das Backend setzt die Rechte durch; kommt trotzdem ein 403, zeigt die Seite
 * dessen Meldung.
 */
export default function BrandTeam() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BrandGate allow={['active', 'pending']}>
        <TeamContent />
      </BrandGate>
    </div>
  )
}

function TeamContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const localePath = useLocalePath()
  const { user } = useAuth()
  const { profile, isOwner } = useBrandProfile()
  const teamQuery = useBrandTeam()
  const refreshTeam = useRefreshBrandTeam()

  const [removing, setRemoving] = useState<BrandTeamMember | null>(null)
  const [transferring, setTransferring] = useState<BrandTeamMember | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const rateLimited = t('brandRegister.rateLimited', { defaultValue: 'Zu viele Versuche, bitte kurz warten.' })
  const fail = (error: unknown, fallback: string) =>
    toast({
      variant: 'destructive',
      title: t('common.error', { defaultValue: 'Fehler' }),
      description: readBrandTeamError(error, fallback, rateLimited),
    })

  const remove = useMutation({
    mutationFn: (member: BrandTeamMember) => brandService.removeMember(member.userId),
    onSuccess: async (_, member) => {
      await refreshTeam({ account: true })
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('brandTeam.removed', { name: member.name, defaultValue: '{{name}} ist nicht mehr im Team.' }),
      })
    },
    onError: (error: unknown) =>
      fail(error, t('brandTeam.removeFailed', { defaultValue: 'Das Mitglied konnte nicht entfernt werden.' })),
  })

  const leave = useMutation({
    mutationFn: () => brandService.leaveBrand(),
    onSuccess: () => {
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('brandTeam.left', { defaultValue: 'Du hast das Team verlassen.' }),
      })
      // Erst weg von der Seite, dann aktualisieren — sonst zeigte das Gate
      // kurz „Noch kein Brand-Profil".
      router.replace(localePath('/settings'))
      void refreshTeam({ account: true })
    },
    onError: (error: unknown) =>
      fail(error, t('brandTeam.leaveFailed', { defaultValue: 'Du konntest das Team nicht verlassen.' })),
  })

  if (!profile) return null

  const myId = user?._id || user?.id
  const members = teamQuery.data?.members ?? []
  const invitations = teamQuery.data?.invitations ?? []

  return (
    <>
      <div>
        <Link
          href={localePath('/brand')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('brandDashboard.backToDashboard', { defaultValue: 'Zurück zum Dashboard' })}
        </Link>
        <h1 className="text-3xl font-bold">{t('brandTeam.title', { defaultValue: 'Team' })}</h1>
        <p className="text-muted-foreground">
          {t('brandTeam.subtitle', {
            company: profile.companyName,
            defaultValue: 'Wer bei {{company}} mitarbeitet.',
          })}
        </p>
      </div>

      {!isOwner && (
        <Card className="bg-muted/40">
          <CardContent className="p-4 text-sm">
            {t('brandTeam.memberHint', { defaultValue: 'Nur der Inhaber kann das Team verwalten.' })}
          </CardContent>
        </Card>
      )}

      {isOwner && <InviteForm />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('brandTeam.membersTitle', { defaultValue: 'Mitglieder' })}
            {members.length > 0 && <span className="text-muted-foreground font-normal">({members.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamQuery.isLoading ? (
            <LoadingBars />
          ) : teamQuery.isError ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                {readBrandTeamError(
                  teamQuery.error,
                  t('brandTeam.loadFailed', { defaultValue: 'Das Team lässt sich gerade nicht laden.' }),
                  rateLimited,
                )}
              </p>
              <Button variant="outline" onClick={() => teamQuery.refetch()}>
                {t('common.retry', { defaultValue: 'Erneut versuchen' })}
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  isSelf={member.userId === myId}
                  isOwner={isOwner}
                  onRemove={() => setRemoving(member)}
                  onTransfer={() => setTransferring(member)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('brandTeam.invitationsTitle', { defaultValue: 'Einladungen' })}
              <span className="text-muted-foreground font-normal">({invitations.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {invitations.map((invitation) => (
                <InvitationRow key={invitation.id} invitation={invitation} isOwner={isOwner} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!isOwner && (
        <div>
          <Button variant="outline" className="gap-2" loading={leave.isPending} onClick={() => setConfirmLeave(true)}>
            <LogOut className="h-4 w-4" />
            {t('brandTeam.leave', { defaultValue: 'Team verlassen' })}
          </Button>
        </div>
      )}

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('brandTeam.removeConfirmTitle', { name: removing?.name ?? '', defaultValue: '{{name}} entfernen?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('brandTeam.removeConfirmDesc', {
                defaultValue: 'Die Person verliert den Zugriff auf die Aufträge dieser Brand. Du kannst sie später wieder einladen.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Abbrechen' })}</AlertDialogCancel>
            <AlertDialogAction onClick={() => removing && remove.mutate(removing)}>
              {t('brandTeam.remove', { defaultValue: 'Entfernen' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('brandTeam.leaveConfirmTitle', { defaultValue: 'Team verlassen?' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('brandTeam.leaveConfirmDesc', {
                company: profile.companyName,
                defaultValue: 'Du verlierst den Zugriff auf die Aufträge von {{company}}. Zurück kommst du nur mit einer neuen Einladung.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Abbrechen' })}</AlertDialogCancel>
            <AlertDialogAction onClick={() => leave.mutate()}>
              {t('brandTeam.leave', { defaultValue: 'Team verlassen' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TransferDialog member={transferring} onClose={() => setTransferring(null)} />
    </>
  )
}

function MemberRow({
  member,
  isSelf,
  isOwner,
  onRemove,
  onTransfer,
}: {
  member: BrandTeamMember
  isSelf: boolean
  isOwner: boolean
  onRemove: () => void
  onTransfer: () => void
}) {
  const { t } = useTranslation()
  const image = member.profileImageThumbnailUrl || member.profileImage

  return (
    <li className="py-3 flex items-center gap-3 flex-wrap">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={resolveImageUrl(image)} alt={member.name} />
        <AvatarFallback className="gradient-bg text-white">{getInitials(member.name || member.email)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-[12rem]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{member.name || member.email}</span>
          {isSelf && (
            <span className="text-xs text-muted-foreground">{t('brandTeam.you', { defaultValue: '(du)' })}</span>
          )}
          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
            {member.role === 'owner'
              ? t('brandTeam.roleOwner', { defaultValue: 'Inhaber' })
              : t('brandTeam.roleMember', { defaultValue: 'Mitglied' })}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground truncate">{member.email}</div>
        {member.joinedAt && (
          <div className="text-xs text-muted-foreground">
            {t('brandTeam.joinedAt', { date: formatDate(member.joinedAt), defaultValue: 'Dabei seit {{date}}' })}
          </div>
        )}
      </div>
      {isOwner && member.role !== 'owner' && (
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={onTransfer}>
            <Crown className="h-4 w-4" />
            {t('brandTeam.makeOwner', { defaultValue: 'Zum Inhaber machen' })}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={onRemove}>
            <UserMinus className="h-4 w-4" />
            {t('brandTeam.remove', { defaultValue: 'Entfernen' })}
          </Button>
        </div>
      )}
    </li>
  )
}

function InvitationRow({ invitation, isOwner }: { invitation: BrandInvitation; isOwner: boolean }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const refreshTeam = useRefreshBrandTeam()
  const expired = invitation.status === 'expired'

  const fail = (error: unknown, fallback: string) =>
    toast({
      variant: 'destructive',
      title: t('common.error', { defaultValue: 'Fehler' }),
      description: readBrandTeamError(
        error,
        fallback,
        t('brandRegister.rateLimited', { defaultValue: 'Zu viele Versuche, bitte kurz warten.' }),
      ),
    })

  const resend = useMutation({
    mutationFn: () => brandService.resendInvitation(invitation.id),
    onSuccess: async ({ mailSent }) => {
      await refreshTeam()
      toast(
        mailSent
          ? {
              title: t('common.success', { defaultValue: 'Erfolg' }),
              description: t('brandTeam.resent', { email: invitation.email, defaultValue: 'Einladung an {{email}} erneut gesendet.' }),
            }
          : {
              variant: 'destructive',
              title: t('common.error', { defaultValue: 'Fehler' }),
              description: t('brandTeam.mailNotSent', {
                defaultValue: 'Die Mail konnte nicht versendet werden. Du kannst die Einladung erneut senden.',
              }),
            },
      )
    },
    onError: (error: unknown) =>
      fail(error, t('brandTeam.resendFailed', { defaultValue: 'Die Einladung konnte nicht erneut gesendet werden.' })),
  })

  const revoke = useMutation({
    mutationFn: () => brandService.revokeInvitation(invitation.id),
    onSuccess: async () => {
      await refreshTeam()
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('brandTeam.revoked', { defaultValue: 'Einladung zurückgezogen.' }),
      })
    },
    onError: (error: unknown) =>
      fail(error, t('brandTeam.revokeFailed', { defaultValue: 'Die Einladung konnte nicht zurückgezogen werden.' })),
  })

  return (
    <li className="py-3 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[12rem]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{invitation.email}</span>
          <Badge variant={expired ? 'destructive' : 'secondary'}>
            {expired
              ? t('brandTeam.statusExpired', { defaultValue: 'Abgelaufen' })
              : t('brandTeam.statusPending', { defaultValue: 'Offen' })}
          </Badge>
        </div>
        {invitation.expiresAt && (
          <div className="text-xs text-muted-foreground">
            {expired
              ? t('brandTeam.expiredAt', { date: formatDate(invitation.expiresAt), defaultValue: 'Abgelaufen am {{date}}' })
              : t('brandTeam.expiresAt', { date: formatDate(invitation.expiresAt), defaultValue: 'Gültig bis {{date}}' })}
          </div>
        )}
      </div>
      {isOwner && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            loading={resend.isPending}
            disabled={revoke.isPending}
            onClick={() => resend.mutate()}
          >
            <RefreshCw className="h-4 w-4" />
            {t('brandTeam.resend', { defaultValue: 'Erneut senden' })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            loading={revoke.isPending}
            disabled={resend.isPending}
            onClick={() => revoke.mutate()}
          >
            <Trash2 className="h-4 w-4" />
            {t('brandTeam.revoke', { defaultValue: 'Zurückziehen' })}
          </Button>
        </div>
      )}
    </li>
  )
}

function InviteForm() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const refreshTeam = useRefreshBrandTeam()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  // Die Einladung steht, nur die Mail ist nicht raus: bleibt sichtbar, bis erneut eingeladen wird.
  const [mailFailedFor, setMailFailedFor] = useState('')

  const invite = useMutation({
    mutationFn: (address: string) => brandService.inviteMember(address),
    onSuccess: async (invitation) => {
      await refreshTeam()
      setEmail('')
      setMailFailedFor(invitation.mailSent ? '' : invitation.email)
      if (invitation.mailSent) {
        toast({
          title: t('common.success', { defaultValue: 'Erfolg' }),
          description: t('brandTeam.invited', { email: invitation.email, defaultValue: 'Einladung an {{email}} gesendet.' }),
        })
      }
    },
    onError: (failure: unknown) =>
      setError(
        readBrandTeamError(
          failure,
          t('brandTeam.inviteFailed', { defaultValue: 'Die Einladung konnte nicht verschickt werden.' }),
          t('brandRegister.rateLimited', { defaultValue: 'Zu viele Versuche, bitte kurz warten.' }),
        ),
      ),
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const address = email.trim()
    setError('')
    setMailFailedFor('')
    if (!isValidEmail(address)) {
      setError(t('brandTeam.invalidEmail', { defaultValue: 'Bitte gib eine gültige E-Mail-Adresse an.' }))
      return
    }
    invite.mutate(address)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {t('brandTeam.inviteTitle', { defaultValue: 'Person einladen' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">{t('brandTeam.emailLabel', { defaultValue: 'E-Mail-Adresse' })}</Label>
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                id="inviteEmail"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
                className="flex-1"
              />
              <Button type="submit" variant="gradient" loading={invite.isPending}>
                {t('brandTeam.inviteButton', { defaultValue: 'Einladen' })}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {mailFailedFor && (
            <p className="text-sm text-orange-700" role="status">
              {t('brandTeam.inviteMailNotSent', {
                email: mailFailedFor,
                defaultValue:
                  'Die Einladung für {{email}} ist angelegt, aber die Mail konnte nicht versendet werden. Du kannst sie unten erneut senden.',
              })}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('brandTeam.inviteHint', {
              defaultValue: 'Die Person bekommt einen Link per E-Mail und muss sich mit genau dieser Adresse anmelden.',
            })}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Inhaber-Wechsel: eigener Dialog mit Passwort. Er bleibt bei einem Fehler
 * offen, damit das Passwort korrigiert werden kann.
 *
 * Das Passwortfeld ist kein Pflichtfeld: Konten aus Google- oder Apple-Login
 * prüft das Backend ohne Passwort. Fehlt es bei einem Konto mit Passwort, kommt
 * ein 403, und die Seite erklärt, was zu tun ist.
 */
function TransferDialog({ member, onClose }: { member: BrandTeamMember | null; onClose: () => void }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const localePath = useLocalePath()
  const refreshTeam = useRefreshBrandTeam()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForgotLink, setShowForgotLink] = useState(false)

  const close = () => {
    setPassword('')
    setError('')
    setShowForgotLink(false)
    onClose()
  }

  const transfer = useMutation({
    mutationFn: ({ userId, secret }: { userId: string; secret: string }) => brandService.transferOwnership(userId, secret),
    onSuccess: async () => {
      await refreshTeam({ account: true })
      toast({
        title: t('common.success', { defaultValue: 'Erfolg' }),
        description: t('brandTeam.transferred', {
          name: member?.name ?? '',
          defaultValue: '{{name}} ist jetzt Inhaber. Du bist ab sofort Mitglied.',
        }),
      })
      close()
    },
    onError: (failure: unknown, { secret }) => {
      const status = brandErrorStatus(failure)
      // 403 ist hier fast immer das Passwort; die Meldung sagt, ob es das ist.
      const passwordProblem = status === 403 && /passwor/i.test(readBrandError(failure, ''))
      if (passwordProblem) {
        setShowForgotLink(true)
        setError(
          secret
            ? t('brandTeam.passwordWrong', { defaultValue: 'Das Passwort ist nicht korrekt.' })
            : t('brandTeam.passwordRequired', { defaultValue: 'Bitte bestätige die Übertragung mit deinem Passwort.' }),
        )
        return
      }
      setShowForgotLink(false)
      setError(
        readBrandTeamError(
          failure,
          t('brandTeam.transferFailed', { defaultValue: 'Die Inhaberschaft konnte nicht übertragen werden.' }),
          t('brandRegister.rateLimited', { defaultValue: 'Zu viele Versuche, bitte kurz warten.' }),
        ),
      )
    },
  })

  return (
    <Dialog open={member !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('brandTeam.transferTitle', { name: member?.name ?? '', defaultValue: '{{name}} zum Inhaber machen?' })}
          </DialogTitle>
          <DialogDescription>
            {t('brandTeam.transferIntro', { defaultValue: 'Das hat folgende Folgen:' })}
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>
            {t('brandTeam.transferEffectEvents', {
              defaultValue: 'Events und offene Creator-Aufträge ziehen zum neuen Inhaber um.',
            })}
          </li>
          <li>
            {t('brandTeam.transferEffectStripe', { defaultValue: 'Der Brand-Customer bei Stripe bleibt bestehen.' })}
          </li>
          <li>
            {t('brandTeam.transferEffectPayout', { defaultValue: 'Der neue Inhaber braucht ein Auszahlungskonto.' })}
          </li>
          <li>{t('brandTeam.transferEffectSelf', { defaultValue: 'Du bist danach selbst Mitglied.' })}</li>
        </ul>
        <form
          id="transferForm"
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!member) return
            setError('')
            transfer.mutate({ userId: member.userId, secret: password })
          }}
        >
          <Label htmlFor="transferPassword">{t('brandTeam.passwordLabel', { defaultValue: 'Dein Passwort' })}</Label>
          <Input
            id="transferPassword"
            type="password"
            autoComplete="current-password"
            maxLength={200}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {showForgotLink && (
            <p className="text-sm text-muted-foreground">
              {t('brandTeam.socialHint', {
                defaultValue: 'Du hast dich mit Google oder Apple angemeldet und nie ein Passwort gesetzt?',
              })}{' '}
              <Link href={localePath('/forgot-password')} className="text-primary hover:underline">
                {t('brandTeam.forgotPassword', { defaultValue: 'Passwort vergessen' })}
              </Link>
            </p>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={transfer.isPending} onClick={close}>
            {t('common.cancel', { defaultValue: 'Abbrechen' })}
          </Button>
          <Button type="submit" form="transferForm" variant="gradient" loading={transfer.isPending}>
            {t('brandTeam.transferConfirm', { defaultValue: 'Inhaberschaft übertragen' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
