'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Users, Pencil, Trash2, Share2, Clock, Lock, UserCheck, Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useLocalePath } from '@/hooks/useLocalePath'
import { useToast } from '@/hooks/use-toast'
import { communityService } from '@/services/community'
import EventCard from '@/components/events/EventCard'
import { categoryEmojis, categoryColors } from '@/components/community/CommunityCard'
import JoinRequestsList from '@/components/community/JoinRequestsList'
import CommunitySettingsModal from '@/components/community/CommunitySettingsModal'
import { CreatePostModal } from '@/views/Feed'
import { resolveImageUrl, getInitials, formatRelativeTime, generateCommunitySlug } from '@/lib/utils'
import { EVENT_CATEGORIES } from '@/lib/constants'

interface CommunityDetailPageProps {
  communityId: string
}

export default function CommunityDetailPage({ communityId }: CommunityDetailPageProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const localePath = useLocalePath()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()
  const { showAuthModal } = useAuthModal()
  const queryClient = useQueryClient()
  const [joinLoading, setJoinLoading] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showJoinRequests, setShowJoinRequests] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    visibility: '',
    location: '',
  })
  const [editLoading, setEditLoading] = useState(false)

  const { data: community, isLoading, refetch } = useQuery({
    queryKey: ['community', communityId],
    queryFn: () => communityService.getById(communityId),
  })

  useEffect(() => {
    if (showEditModal && community) {
      setEditForm({
        name: community.name || '',
        description: community.description || '',
        category: community.category || '',
        visibility: community.visibility || 'public',
        location: community.location || '',
      })
    }
  }, [showEditModal, community])

  const { data: postsData } = useQuery({
    queryKey: ['communityPosts', communityId],
    queryFn: () => communityService.getPosts(communityId, 1, 20),
  })

  const { data: eventsData } = useQuery({
    queryKey: ['communityEvents', communityId],
    queryFn: () => communityService.getEvents(communityId),
  })

  const canSeeMembers = !!community?.isMember || !!community?.isAdmin || !!community?.isCreator

  const { data: membersData } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => communityService.getMembers(communityId),
    enabled: canSeeMembers,
  })

  const handleJoinLeave = async () => {
    if (!isAuthenticated) {
      showAuthModal()
      return
    }
    setJoinLoading(true)
    try {
      if (community?.isMember) {
        await communityService.leave(communityId)
        toast({ title: t('community.leftSuccess', { defaultValue: 'Community verlassen' }) })
      } else {
        const result = await communityService.join(communityId)
        if (result?.status === 'pending') {
          toast({ title: t('community.requestSent', { defaultValue: 'Beitrittsanfrage gesendet!' }) })
        } else {
          toast({ title: t('community.joinedSuccess', { defaultValue: 'Community beigetreten!' }) })
        }
      }
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }) })
    } finally {
      setJoinLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editForm.name.trim()) {
      toast({ variant: 'destructive', title: t('community.nameRequired', { defaultValue: 'Name ist erforderlich' }) })
      return
    }
    if (!editForm.description.trim()) {
      toast({ variant: 'destructive', title: t('community.descriptionRequired', { defaultValue: 'Beschreibung ist erforderlich' }) })
      return
    }
    if (!editForm.category) {
      toast({ variant: 'destructive', title: t('community.categoryRequired', { defaultValue: 'Kategorie ist erforderlich' }) })
      return
    }
    setEditLoading(true)
    try {
      await communityService.update(communityId, editForm)
      toast({ title: t('community.editSuccess', { defaultValue: 'Community aktualisiert!' }) })
      setShowEditModal(false)
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }) })
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    setEditLoading(true)
    try {
      await communityService.delete(communityId)
      toast({ title: t('community.deleteSuccess', { defaultValue: 'Community gelöscht' }) })
      router.push(localePath('/feed'))
    } catch {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }) })
    } finally {
      setEditLoading(false)
    }
  }

  const handleShareCommunity = async () => {
    const url = `https://shareyourparty.de/communities/${generateCommunitySlug(community?.name || '', community?._id || communityId)}`
    const shareText = t('community.shareText', {
      name: community?.name,
      defaultValue: `Schau dir die Community "${community?.name}" auf Share Your Party an!`,
    })

    if (navigator.share) {
      try {
        await navigator.share({
          title: community?.name || 'Community',
          text: shareText,
          url,
        })
      } catch {
        // User hat Share abgebrochen
      }
    } else {
      // Fallback: Link kopieren
      try {
        await navigator.clipboard.writeText(url)
        toast({ title: t('community.linkCopied', { defaultValue: 'Link kopiert!' }) })
      } catch {
        // Fallback für ältere Browser
        const input = document.createElement('input')
        input.value = url
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        toast({ title: t('community.linkCopied', { defaultValue: 'Link kopiert!' }) })
      }
    }
  }

  const handleToggleAdmin = async (targetUserId: string) => {
    try {
      const result = await communityService.toggleAdmin(communityId, targetUserId)
      toast({
        title: result.isAdmin
          ? t('community.adminAdded', { defaultValue: 'Admin ernannt!' })
          : t('community.adminRemoved', { defaultValue: 'Admin-Rechte entfernt' }),
      })
      queryClient.invalidateQueries({ queryKey: ['communityMembers', communityId] })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }) })
    }
  }

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName })
  }

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return
    try {
      await communityService.removeMember(communityId, memberToRemove.id)
      toast({ title: t('community.memberRemoved', { defaultValue: 'Mitglied entfernt' }) })
      queryClient.invalidateQueries({ queryKey: ['communityMembers', communityId] })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }) })
    } finally {
      setMemberToRemove(null)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="aspect-[21/9] rounded-xl bg-muted animate-pulse" />
        <div className="h-8 w-1/2 bg-muted rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">
          {t('community.notFound', { defaultValue: 'Community nicht gefunden.' })}
        </p>
      </div>
    )
  }

  const posts = postsData?.posts || []
  const events = eventsData || []
  const categoryLabel = EVENT_CATEGORIES.find((c) => c.value === community.category)?.label || community.category
  const creator = community.creatorId && typeof community.creatorId === 'object' ? community.creatorId : null
  const canSeeContent = !!community.isMember || !!community.isAdmin || !!community.isCreator
  const canCreateEvent =
    !!community.isAdmin || !!community.isCreator || (!!community.isMember && !!community.settings?.allowMemberEvents)

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Sticky Join/Leave/Pending (non-admin, non-creator) */}
      {!community?.isCreator && !community?.isAdmin && (
        <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur py-3 px-4 border-b">
          {community?.isMember ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleJoinLeave}
              disabled={joinLoading}
            >
              {t('community.leave', { defaultValue: 'Community verlassen' })}
            </Button>
          ) : community?.hasPendingRequest ? (
            <Button variant="outline" className="w-full" disabled>
              <Clock className="h-4 w-4 mr-2" />
              {t('community.requestPending', { defaultValue: 'Anfrage gesendet — warte auf Freigabe' })}
            </Button>
          ) : (
            <Button
              variant="gradient"
              className="w-full"
              onClick={handleJoinLeave}
              disabled={joinLoading}
            >
              {community?.settings?.requireApproval
                ? t('community.requestJoin', { defaultValue: 'Beitritt anfragen' })
                : t('community.join', { defaultValue: 'Community beitreten' })}
            </Button>
          )}
        </div>
      )}

      {/* Sticky Edit (creator only) */}
      {community.isCreator && (
        <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur py-3 px-4 border-b">
          <Button variant="outline" className="w-full" onClick={() => setShowEditModal(true)}>
            {t('common.edit', { defaultValue: 'Bearbeiten' })}
          </Button>
        </div>
      )}

      {/* Admin actions (admin or creator) */}
      {(community?.isAdmin || community?.isCreator) && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowJoinRequests(true)}>
              <UserCheck className="h-4 w-4 mr-2" />
              {t('community.joinRequests', { defaultValue: 'Beitrittsanfragen' })}
              {!!community?.pendingRequestCount && community.pendingRequestCount > 0 && (
                <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                  {community.pendingRequestCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {t('community.settings', { defaultValue: 'Einstellungen' })}
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-6">
        {community.coverImages?.[0]?.url ? (
          <div className="aspect-[21/9] rounded-xl overflow-hidden mb-4">
            <img
              src={resolveImageUrl(community.coverImages[0].url)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="aspect-[21/9] rounded-xl mb-4 flex items-center justify-center"
            style={{ backgroundColor: categoryColors[community.category] || '#F5F5F5' }}
          >
            <span className="text-5xl">{categoryEmojis[community.category] || '🎉'}</span>
          </div>
        )}

        <h1 className="text-2xl font-bold">{community.name}</h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
            {t(`categories.${community.category}`, { defaultValue: categoryLabel })}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {community.memberCount} {t('community.members', { defaultValue: 'Mitglieder' })}
          </span>
        </div>
        {community.description && (
          <p className="text-sm text-muted-foreground mt-3">{community.description}</p>
        )}

        {community?.isCreator && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('community.edit', { defaultValue: 'Community bearbeiten' })}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('community.delete', { defaultValue: 'Löschen' })}
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleShareCommunity}
          className="mt-3"
        >
          <Share2 className="h-4 w-4 mr-2" />
          {t('community.shareCommunity', { defaultValue: 'Community teilen' })}
        </Button>
      </div>

      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          communityId={communityId}
        />
      )}

      {/* Edit Community Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('community.edit', { defaultValue: 'Community bearbeiten' })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('community.nameLabel', { defaultValue: 'Name der Community' })} *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('community.descriptionLabel', { defaultValue: 'Beschreibung der Community' })} *</Label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                maxLength={2000}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('community.categoryLabel', { defaultValue: 'Kategorie der Community' })} *</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Music">{t('categories.Music', { defaultValue: 'Musik' })}</SelectItem>
                  <SelectItem value="Clubbing">{t('categories.Clubbing', { defaultValue: 'Clubbing' })}</SelectItem>
                  <SelectItem value="Business">{t('categories.Business', { defaultValue: 'Business' })}</SelectItem>
                  <SelectItem value="Nature">{t('categories.Nature', { defaultValue: 'Outdoor' })}</SelectItem>
                  <SelectItem value="Sports">{t('categories.Sports', { defaultValue: 'Sport' })}</SelectItem>
                  <SelectItem value="Workshop">{t('categories.Workshop', { defaultValue: 'Workshop' })}</SelectItem>
                  <SelectItem value="Gastronomy">{t('categories.Gastronomy', { defaultValue: 'Gastronomie' })}</SelectItem>
                  <SelectItem value="Yoga">{t('categories.Yoga', { defaultValue: 'Yoga' })}</SelectItem>
                  <SelectItem value="Theme">{t('categories.Theme', { defaultValue: 'Themenparty' })}</SelectItem>
                  <SelectItem value="On the Roof">{t('categories.On the Roof', { defaultValue: 'Auf dem Dach' })}</SelectItem>
                  <SelectItem value="Other">{t('categories.Other', { defaultValue: 'Sonstiges' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('community.locationLabel', { defaultValue: 'Ort der Community' })}</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder={t('community.locationPlaceholder', { defaultValue: 'Stadt eingeben' })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                {t('common.cancel', { defaultValue: 'Abbrechen' })}
              </Button>
              <Button variant="gradient" onClick={handleEdit} disabled={editLoading}>
                {editLoading ? t('common.loading', { defaultValue: 'Lädt...' }) : t('common.save', { defaultValue: 'Speichern' })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('community.deleteConfirmTitle', { defaultValue: 'Community löschen?' })}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('community.deleteConfirmText', {
              defaultValue: 'Diese Aktion kann nicht rückgängig gemacht werden. Alle Posts und Events bleiben bestehen, sind aber nicht mehr der Community zugeordnet.',
            })}
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {t('common.cancel', { defaultValue: 'Abbrechen' })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={editLoading}
            >
              {t('community.delete', { defaultValue: 'Löschen' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Requests Modal */}
      <Dialog open={showJoinRequests} onOpenChange={setShowJoinRequests}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('community.joinRequests', { defaultValue: 'Beitrittsanfragen' })}</DialogTitle>
          </DialogHeader>
          <JoinRequestsList communityId={communityId} onUpdate={() => refetch()} />
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('community.settings', { defaultValue: 'Community-Einstellungen' })}</DialogTitle>
          </DialogHeader>
          <CommunitySettingsModal
            communityId={communityId}
            settings={community?.settings}
            isCreator={community?.isCreator}
            onUpdate={() => {
              refetch()
              setShowSettings(false)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('community.removeMemberTitle', { defaultValue: 'Mitglied entfernen?' })}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('community.removeMemberText', {
              name: memberToRemove?.name,
              defaultValue: `${memberToRemove?.name} wird aus der Community entfernt und muss erneut beitreten.`,
            })}
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              {t('common.cancel', { defaultValue: 'Abbrechen' })}
            </Button>
            <Button variant="destructive" onClick={confirmRemoveMember}>
              {t('community.removeMember', { defaultValue: 'Entfernen' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Community Posts (first) */}
      <div className="px-4">
        <h2 className="text-xl font-bold mb-4">
          {t('community.communityPosts', { defaultValue: 'Community Posts' })}
        </h2>

        {canSeeContent ? (
          <>
            {/* Post Input (members only) */}
            {community.isMember && (
              <div className="mb-4">
                <div
                  className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/50"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resolveImageUrl(user?.profileImage)} />
                    <AvatarFallback>{getInitials(user?.name || user?.username)}</AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground text-sm">
                    {t('community.whatsNew', { defaultValue: "Was gibt's neues?" })}
                  </span>
                </div>
              </div>
            )}

            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post: any) => (
                  <CommunityPostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t('community.noPosts', { defaultValue: 'Noch keine Posts in dieser Community.' })}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-12 space-y-3">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              {t('community.joinToSee', { defaultValue: 'Tritt der Community bei um Posts und Events zu sehen.' })}
            </p>
          </div>
        )}
      </div>

      {/* Community Events (after posts) */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {t('community.communityEvents', { defaultValue: 'Community Events' })}
          </h2>
          {canSeeContent && eventsData && eventsData.length > 0 && (
            <Link
              href={localePath(`/communities/${generateCommunitySlug(community.name, community._id || communityId)}/events`)}
              className="text-sm text-primary hover:underline"
            >
              {t('community.showAll', { defaultValue: 'Alle anzeigen' })} →
            </Link>
          )}
        </div>

        {canSeeContent ? (
          <>
            {canCreateEvent && (
              <div className="mb-4">
                <Link href={localePath(`/create-event?communityId=${communityId}`)}>
                  <Button variant="gradient" size="sm">
                    {t('community.createEvent', { defaultValue: 'Community Event erstellen' })}
                  </Button>
                </Link>
              </div>
            )}

            {events.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible">
                {events.slice(0, 3).map((event: any) => (
                  <div key={event._id} className="flex-shrink-0 w-[70vw] md:w-auto">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t('community.noEvents', { defaultValue: 'Noch keine Events in dieser Community.' })}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-12 space-y-3">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              {t('community.joinToSee', { defaultValue: 'Tritt der Community bei um Posts und Events zu sehen.' })}
            </p>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="px-4 mt-8 mb-12">
        <h2 className="text-xl font-bold mb-4">
          {t('community.membersTitle', { defaultValue: 'Mitglieder' })} ({community.memberCount})
        </h2>
        <div className="space-y-2">
          {membersData?.members?.map((member: any) => (
            <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <Link href={localePath(`/user/${member._id}`)}>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={resolveImageUrl(member.profileImage)} />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{member.name}</p>
                  {member.isCreator && (
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                      {t('community.creatorBadge', { defaultValue: 'Creator' })}
                    </span>
                  )}
                  {member.isAdmin && !member.isCreator && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                      {t('community.adminBadge', { defaultValue: 'Admin' })}
                    </span>
                  )}
                </div>
              </div>
              {community.isCreator && !member.isCreator && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleAdmin(member._id)}
                  className="text-xs"
                >
                  {member.isAdmin
                    ? t('community.removeAdmin', { defaultValue: 'Admin entfernen' })
                    : t('community.makeAdmin', { defaultValue: 'Zum Admin' })}
                </Button>
              )}
              {(community?.isAdmin || community?.isCreator) && !member.isCreator && member._id !== user?.id && member._id !== user?._id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive text-xs"
                  onClick={() => handleRemoveMember(member._id, member.name)}
                >
                  {t('community.removeMember', { defaultValue: 'Entfernen' })}
                </Button>
              )}
            </div>
          ))}
          {!membersData && !canSeeMembers && creator && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-3">
                <Avatar className="h-9 w-9 border-2 border-background">
                  <AvatarImage src={resolveImageUrl(creator.profileImage)} />
                  <AvatarFallback className="text-xs">{getInitials(creator.name)}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-sm text-muted-foreground">
                {community.memberCount} {t('community.members', { defaultValue: 'Mitglieder' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// No shared PostCard component exists in this project (Feed.tsx/UserProfile.tsx each
// define their own inline) — simple fallback render for community posts.
function CommunityPostCard({ post }: { post: any }) {
  const { t } = useTranslation()
  const postUser = post.user || (typeof post.userId === 'object' ? post.userId : null) || { name: 'User' }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={resolveImageUrl(postUser.profileImage)} />
          <AvatarFallback>{getInitials(postUser.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{postUser.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
        </div>
      </div>
      {post.text && <p className="text-sm mb-3 whitespace-pre-wrap">{post.text}</p>}
      {post.media?.[0] && (
        <img src={resolveImageUrl(post.media[0].url)} alt="" className="w-full rounded-lg" />
      )}
      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          👍 {post.reactions?.length || post.likes?.length || 0} {t('community.people', { defaultValue: 'Personen' })}
        </span>
        <span className="flex items-center gap-1">
          💬 {post.comments?.length || 0} {t('community.comments', { defaultValue: 'Kommentare' })}
        </span>
      </div>
    </Card>
  )
}
