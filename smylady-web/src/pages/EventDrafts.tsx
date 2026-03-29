import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, FileText, Trash2, Edit, Plus, MapPin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  getAllDrafts,
  deleteEventDraft,
  type DraftMetadata,
} from '@/services/eventDrafts'
import { useToast } from '@/hooks/use-toast'

export default function EventDrafts() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [drafts, setDrafts] = useState<DraftMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; draft: DraftMetadata | null }>({
    open: false,
    draft: null,
  })

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    try {
      setLoading(true)
      const allDrafts = await getAllDrafts()
      setDrafts(allDrafts)
    } catch (error) {
      console.error('Error loading drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDraft = async () => {
    if (!deleteDialog.draft) return

    try {
      await deleteEventDraft(deleteDialog.draft.id)
      await loadDrafts()
      toast({
        description: t('eventDrafts.deleteSuccess', { defaultValue: 'Entwurf gelöscht' }),
      })
    } catch (error) {
      console.error('Error deleting draft:', error)
      toast({
        variant: 'destructive',
        description: t('eventDrafts.deleteError', { defaultValue: 'Fehler beim Löschen' }),
      })
    } finally {
      setDeleteDialog({ open: false, draft: null })
    }
  }

  const handleContinueDraft = () => {
    navigate('/create-event')
  }

  const getStepProgress = (step: number) => `${step}/3`

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">
            {t('eventDrafts.title', { defaultValue: 'Meine Entwürfe' })}
          </h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/profile">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">
          {t('eventDrafts.title', { defaultValue: 'Meine Entwürfe' })}
        </h1>
      </div>

      {/* Empty State */}
      {drafts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {t('eventDrafts.noDrafts')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t('eventDrafts.noDraftsDesc')}
          </p>
          <Button onClick={() => navigate('/create-event')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('eventDrafts.createNew')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-card border rounded-lg p-4"
            >
              <div className="mb-3">
                <h3 className="font-semibold">
                  {draft.name || t('eventDrafts.untitledEvent', { defaultValue: 'Unbenanntes Event' })}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {draft.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                      {draft.category}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {t('eventDrafts.step', { defaultValue: 'Schritt' })} {getStepProgress(draft.step)}
                  </span>
                </div>
                {draft.location && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{draft.location}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(draft.lastModified), {
                    addSuffix: true,
                    locale: de,
                  })}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleContinueDraft}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('eventDrafts.continue', { defaultValue: 'Fortsetzen' })}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteDialog({ open: true, draft })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, draft: open ? deleteDialog.draft : null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('eventDrafts.deleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('eventDrafts.deleteMessage', {
                defaultValue: 'Dieser Entwurf wird unwiderruflich gelöscht.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteDraft}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
