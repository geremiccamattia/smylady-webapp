import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { safetyCompanionService } from '@/services/safetyCompanion'
import { userService } from '@/services/user'
import { ticketsService } from '@/services/tickets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { getInitials, cn, resolveImageUrl } from '@/lib/utils'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import {
  Shield,
  UserPlus,
  Check,
  X,
  Search,
  Clock,
  Trash2,
  Users,
  ChevronRight,
  ArrowLeft,
  Ticket,
  Loader2,
} from 'lucide-react'

type ModalStep = 'closed' | 'selectEvent' | 'searchUser'

export default function SafetyCompanions() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null)
  const [modalStep, setModalStep] = useState<ModalStep>('closed')

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: 'reject' | 'remove'
    id: string
    name: string
  }>({ open: false, type: 'reject', id: '', name: '' })

  // Fetch pending requests (requests sent to me)
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['companionRequests'],
    queryFn: safetyCompanionService.getMyRequests,
  })

  // Fetch my companions (people I added)
  const { data: myCompanions = [], isLoading: companionsLoading } = useQuery({
    queryKey: ['myCompanions'],
    queryFn: () => safetyCompanionService.getMyCompanions(),
  })

  // Fetch my tickets for event selection (like mobile EventSelectionModal)
  const { data: myTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['myTickets'],
    queryFn: () => ticketsService.getMyTickets(),
    enabled: modalStep === 'selectEvent',
  })

  // Search users
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => userService.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2 && modalStep === 'searchUser',
  })

  // Accept request mutation - invalidates both queries like mobile app
  const acceptMutation = useMutation({
    mutationFn: (requestId: string) =>
      safetyCompanionService.updateStatus(requestId, { status: 'accepted' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companionRequests'] })
      queryClient.invalidateQueries({ queryKey: ['myCompanions'] })
      toast({ title: t('safety.requestAccepted') })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || t('safety.statusUpdateError'),
      })
    },
  })

  // Reject request mutation - with confirmation dialog like mobile Alert.alert
  const rejectMutation = useMutation({
    mutationFn: (requestId: string) =>
      safetyCompanionService.updateStatus(requestId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companionRequests'] })
      queryClient.invalidateQueries({ queryKey: ['myCompanions'] })
      toast({ title: t('safety.requestRejected') })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || t('safety.statusUpdateError'),
      })
    },
  })

  // Remove companion mutation - with confirmation dialog like mobile Alert.alert
  const removeMutation = useMutation({
    mutationFn: (requestId: string) => safetyCompanionService.remove(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCompanions'] })
      toast({ title: t('safety.companionRemoved') })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || t('safety.removeError'),
      })
    },
  })

  // Add companion mutation
  const addMutation = useMutation({
    mutationFn: (data: { companionId: string; eventId: string }) =>
      safetyCompanionService.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCompanions'] })
      toast({ title: t('safety.requestSent') })
      closeModal()
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.response?.data?.message || t('safety.couldNotSend'),
      })
    },
  })

  const pendingCount = pendingRequests.filter(r => r.status === 'pending').length

  const closeModal = () => {
    setModalStep('closed')
    setSelectedEvent(null)
    setSearchQuery('')
  }

  const handleSelectEvent = (eventId: string, eventName: string) => {
    setSelectedEvent({ id: eventId, name: eventName })
    setModalStep('searchUser')
  }

  const handleSelectUser = (userId: string) => {
    if (selectedEvent) {
      addMutation.mutate({
        companionId: userId,
        eventId: selectedEvent.id,
      })
    }
  }

  const handleRejectClick = (requestId: string, userName: string) => {
    setConfirmDialog({ open: true, type: 'reject', id: requestId, name: userName })
  }

  const handleRemoveClick = (requestId: string, companionName: string) => {
    setConfirmDialog({ open: true, type: 'remove', id: requestId, name: companionName })
  }

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'reject') {
      rejectMutation.mutate(confirmDialog.id)
    } else {
      removeMutation.mutate(confirmDialog.id)
    }
    setConfirmDialog({ ...confirmDialog, open: false })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t('safety.title')}</h1>
          {pendingCount > 0 && (
            <span className="px-2 py-1 bg-orange-500 text-white text-sm rounded-full">
              {pendingCount} {t('safety.new')}
            </span>
          )}
        </div>
        <Button onClick={() => setModalStep('selectEvent')}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('safety.addCompanion')}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                {t('safety.whatAre')}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {t('safety.whatAreDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.filter(r => r.status === 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              {t('safety.pendingRequests')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests
              .filter(r => r.status === 'pending')
              .map((request) => (
                <div
                  key={request._id}
                  className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={resolveImageUrl(request.userId.profileImage)} />
                    <AvatarFallback>{getInitials(request.userId.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{request.userId.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('safety.wantsYouAs')}
                    </p>
                    <p className="text-sm font-medium">{request.eventId.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.eventId.eventDate), 'PPP', { locale: i18n.language === 'de' ? de : enUS })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(request._id)}
                      disabled={acceptMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t('safety.acceptRequest')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectClick(request._id, request.userId.name)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* My Companions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('safety.mySafetyCompanions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : myCompanions.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium">{t('safety.noCompanions')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('safety.addTrusted')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myCompanions.map((companion) => {
                const companionUser = companion.companionId || {} as any
                const companionUserId = companionUser?._id || (companionUser as any)?.id || ''
                return (
                <div
                  key={companion._id}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                >
                  <Link to={`/user/${companionUserId}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={resolveImageUrl(companionUser?.profileImage)} />
                      <AvatarFallback>
                        {getInitials(companionUser?.name || '')}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/user/${companionUserId}`}
                      className="font-medium hover:underline"
                    >
                      {companionUser?.name || 'User'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs rounded-full',
                          companion.status === 'accepted'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : companion.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        )}
                      >
                        {companion.status === 'accepted'
                          ? t('safety.accepted')
                          : companion.status === 'pending'
                          ? t('safety.pending')
                          : t('safety.rejected')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('safety.forEvent')} {companion.eventId?.name || 'Event'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveClick(companion._id, companionUser?.name || 'User')}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 1: Event Selection Modal (like mobile EventSelectionModal) */}
      {modalStep === 'selectEvent' && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>{t('safety.selectEvent')}</CardTitle>
                <Button variant="ghost" size="icon" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('safety.selectEventSubtitle')}
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : myTickets.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">{t('safety.noTickets')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('safety.noTicketsSubtext')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTickets.map((ticket: any) => {
                    const event = ticket.event || ticket.eventId
                    if (!event || typeof event === 'string') return null
                    return (
                      <button
                        key={ticket._id}
                        className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-lg border transition-colors text-left"
                        onClick={() => handleSelectEvent(event._id, event.name)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.eventDate ? format(new Date(event.eventStartTime || event.eventDate), 'PPP', { locale: i18n.language === 'de' ? de : enUS }) : ''}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: User Search Modal (like mobile AddSafetyCompanionModal) */}
      {modalStep === 'searchUser' && selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setModalStep('selectEvent')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <CardTitle>{t('safety.addSafetyCompanion')}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEvent.name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {/* Info text like mobile */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('safety.addInfoText')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">{t('safety.searchPerson')}</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('safety.nameOrUsername')}
                    className="pl-9"
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('safety.minChars')}
                  </p>
                )}
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searching ? (
                    <div className="flex items-center justify-center gap-2 py-8">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        {t('safety.searching')}
                      </p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t('safety.noUsersFound')}
                      </p>
                    </div>
                  ) : (
                    searchResults.map(user => (
                      <button
                        key={user._id || user.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        onClick={() => handleSelectUser(user._id || user.id || '')}
                        disabled={addMutation.isPending}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={resolveImageUrl(user.profileImage)} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email || (user.username ? `@${user.username}` : '')}
                          </p>
                        </div>
                        <UserPlus className="h-5 w-5 text-primary flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog (like mobile Alert.alert) */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'reject'
                ? t('safety.confirmRejectTitle')
                : t('safety.confirmRemoveTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'reject'
                ? t('safety.confirmRejectMessage')
                : t('safety.confirmRemoveMessage', { name: confirmDialog.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmDialog.type === 'reject'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {confirmDialog.type === 'reject'
                ? t('safety.rejectAction')
                : t('safety.removeAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
