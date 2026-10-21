'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Check, Clapperboard, FileText, ImagePlus, Plus, Target, Trash2, Users, X } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useLocalePath } from '@/hooks/useLocalePath'
import {
  AUDIENCE_GENDERS,
  brandService,
  DELIVERABLE_PLATFORMS,
  DELIVERABLE_TYPES,
  EVENT_IMAGE_MAX_BYTES,
  readBrandError,
  readMissingFields,
  type AudienceGender,
  type BrandOrder,
  type BrandOrderPayload,
  type DeliverablePlatform,
  type DeliverableType,
} from '@/services/brand'
import { BrandGate, LoadingBars, useBrandLabels } from '@/components/brand/brandShared'
import { resolveImageUrl } from '@/lib/utils'
import { BRAND_ORDERS_QUERY_KEY } from './BrandDashboard'

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

interface DeliverableRow {
  type: DeliverableType
  quantity: string
  platform: DeliverablePlatform | ''
  notes: string
}

const emptyDeliverable = (): DeliverableRow => ({ type: 'reel', quantity: '1', platform: 'Instagram', notes: '' })

/** Ein Treffer der Adresssuche (Nominatim), so wie CreateEvent ihn nutzt. */
interface LocationSuggestion {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

/** "2026-11-15T18:00:00.000Z" -> { date: '2026-11-15', time: '19:00' } in lokaler Zeit. */
function splitIso(iso: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return { date: '', time: '' }
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  }
}

/** Datum und Uhrzeit aus den Eingabefeldern als ISO-String (lokale Zeit). */
function joinIso(date: string, time: string): string | undefined {
  if (!date) return undefined
  const value = new Date(`${date}T${time || '00:00'}`)
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
}

/**
 * Auftrag anlegen oder einen Entwurf bearbeiten.
 *
 * Ohne `id` in der Route entsteht ein neuer Auftrag; mit `id` wird ein
 * Entwurf geladen und geändert. Beides geht nur im Status 'draft' — ab
 * 'submitted' liegt der Auftrag bei uns, das Backend weist Änderungen ab.
 *
 * Zwei Wege zum Abschluss: „Als Entwurf speichern" (nur anlegen/ändern) und
 * „Einreichen" (anlegen/ändern, dann POST /:id/submit).
 *
 * Das Eventbild geht als Datei getrennt vom JSON des Entwurfs hoch (POST
 * /:id/event-image), nach dem Anlegen bzw. Ändern und vor dem Einreichen.
 * Pflicht zum Einreichen — wie bei einem Veranstalter, der ein Event anlegt.
 * Vorher nahm das Backend ersatzweise das Logo aus dem Brand-Profil.
 */
export default function BrandOrderForm() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BrandGate>
        <OrderForm />
      </BrandGate>
    </div>
  )
}

function OrderForm() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const localePath = useLocalePath()
  const queryClient = useQueryClient()
  const labels = useBrandLabels()
  const params = useParams<{ id?: string }>()
  const editId = params?.id

  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [budget, setBudget] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  // Koordinaten gibt es nur zu einem gewählten Vorschlag der Adresssuche.
  // Getippter Text ist Freitext ohne Koordinaten — das Event erschiene dann
  // weder auf der Karte noch in der Umkreissuche.
  const [eventCoordinates, setEventCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  // Die Suche hängt am zuletzt getippten Text, nicht am Feldwert: Ein
  // gewählter Vorschlag oder ein geladener Entwurf soll keine neue Suche
  // auslösen und die Liste nicht ungefragt wieder öffnen.
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<LocationSuggestion[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationSearchRef = useRef<HTMLDivElement>(null)
  const [eventDescription, setEventDescription] = useState('')
  // Das Eventbild: eine neu gewählte Datei (imageFile, Vorschau als Objekt-
  // URL) oder das Bild, das schon am Entwurf hängt (existingImageUrl). Hat
  // die Brand das gespeicherte Bild entfernt, merkt imageRemoved das bis zum
  // Speichern — erst dann geht DELETE /:id/event-image raus.
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [imageRemoved, setImageRemoved] = useState(false)
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([emptyDeliverable()])
  const [ageFrom, setAgeFrom] = useState('')
  const [ageTo, setAgeTo] = useState('')
  const [gender, setGender] = useState<AudienceGender>('all')
  const [region, setRegion] = useState('')
  const [interests, setInterests] = useState('')
  const [brandMayReuse, setBrandMayReuse] = useState(false)
  const [usageNotes, setUsageNotes] = useState('')
  const [publishDeadline, setPublishDeadline] = useState('')
  const [approvalRequired, setApprovalRequired] = useState(false)

  // Bestehenden Entwurf laden, nur mit id.
  const existing = useQuery<BrandOrder>({
    queryKey: ['brand', 'order', editId],
    queryFn: () => brandService.getMyOrder(editId as string),
    enabled: Boolean(editId),
    retry: false,
  })

  useEffect(() => {
    const order = existing.data
    if (!order) return
    setTitle(order.title)
    setGoal(order.goal)
    setBudget(String(order.budget))
    setEventName(order.eventName)
    const start = splitIso(order.eventDate)
    setEventDate(start.date)
    setEventTime(start.time)
    const end = splitIso(order.eventEndDate)
    setEventEndDate(end.date)
    setEventEndTime(end.time)
    setEventLocation(order.eventLocation)
    setEventCoordinates(order.eventCoordinates)
    setEventDescription(order.eventDescription)
    setExistingImageUrl(order.eventImageUrl)
    setImagePreview(order.eventImageUrl)
    setImageFile(null)
    setImageRemoved(false)
    setDeliverables(
      order.deliverables.length > 0
        ? order.deliverables.map((entry) => ({
            type: entry.type,
            quantity: String(entry.quantity),
            platform: entry.platform ?? '',
            notes: entry.notes ?? '',
          }))
        : [emptyDeliverable()],
    )
    setAgeFrom(order.audienceAgeFrom === null ? '' : String(order.audienceAgeFrom))
    setAgeTo(order.audienceAgeTo === null ? '' : String(order.audienceAgeTo))
    setGender(order.audienceGender)
    setRegion(order.audienceRegion)
    setInterests(order.audienceInterests.join(', '))
    setBrandMayReuse(order.brandMayReuse)
    setUsageNotes(order.usageNotes)
    setPublishDeadline(splitIso(order.publishDeadline).date)
    setApprovalRequired(order.approvalRequired)
  }, [existing.data])

  // Adresssuche wie beim Anlegen eines Events (CreateEvent): 500 ms nach der
  // letzten Eingabe, ab drei Zeichen, höchstens fünf Treffer aus AT/DE/CH.
  useEffect(() => {
    const query = locationQuery.trim()
    if (query.length < 3) {
      setLocationResults([])
      setShowLocationDropdown(false)
      return
    }
    let stale = false
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=at,de,ch`,
        )
        const data = await res.json()
        if (stale) return
        const results: LocationSuggestion[] = Array.isArray(data) ? data : []
        setLocationResults(results)
        setShowLocationDropdown(results.length > 0)
      } catch {
        // Ohne Vorschläge bleibt der Ort Freitext; kein Fehler für die Brand.
      }
    }, 500)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [locationQuery])

  // Ein Klick ausserhalb schliesst die Vorschlagsliste.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationSearchRef.current && !locationSearchRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pickLocation = (suggestion: LocationSuggestion) => {
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    setEventLocation(suggestion.display_name)
    setEventCoordinates(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null)
    setShowLocationDropdown(false)
  }

  const fail = (error: unknown, fallback: string) =>
    toast({
      variant: 'destructive',
      title: t('common.error', { defaultValue: 'Fehler' }),
      description: readBrandError(error, fallback),
    })

  // Objekt-URLs der Vorschau wieder freigeben — beim Wechsel und beim
  // Verlassen der Seite.
  useEffect(() => {
    if (!imagePreview.startsWith('blob:')) return
    return () => URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Zurücksetzen, damit dieselbe Datei nach „Entfernen" erneut wählbar ist.
    event.target.value = ''
    if (!file) return
    // Dieselben Grenzen wie das Backend (Typ im Service, Größe als
    // Multer-Limit), nur früher: Ein 10-MB-Upload, der am Ende mit 413
    // scheitert, ist für die Brand nicht nachvollziehbar.
    if (!file.type.startsWith('image/')) {
      fail(null, t('brandDashboard.validateEventImageType', { defaultValue: 'Bitte wähle eine Bilddatei (JPG, PNG oder WebP).' }))
      return
    }
    if (file.size > EVENT_IMAGE_MAX_BYTES) {
      fail(null, t('brandDashboard.validateEventImageSize', { defaultValue: 'Das Eventbild darf höchstens 10 MB groß sein.' }))
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setImageRemoved(false)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (existingImageUrl) setImageRemoved(true)
  }

  /** Ein Bild ist da: neu gewählt oder gespeichert und nicht entfernt. */
  const hasImage = Boolean(imageFile) || (Boolean(existingImageUrl) && !imageRemoved)

  /**
   * Prüft die Eingaben und baut den Request.
   *
   * Ein Entwurf braucht nur den Titel. Alles andere darf fehlen, muss aber
   * stimmen, wenn es da ist: ein eingetragenes Datum gültig, ein Ende nach
   * dem Beginn, Altersangaben als Zahlen. `submit` schaltet die Pflichtfelder
   * fürs Einreichen zu — dann geht der Auftrag an uns zur Prüfung und muss
   * vollständig sein. Das Backend prüft dasselbe noch einmal und nennt
   * fehlende Felder in data.missing (siehe readMissingFields).
   */
  const buildPayload = (submit: boolean): BrandOrderPayload | null => {
    const problem = (message: string) => {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }), description: message })
      return null
    }

    if (!title.trim()) return problem(t('brandDashboard.validateTitle', { defaultValue: 'Bitte gib einen Titel an.' }))

    const goalValue = goal.trim()
    if (submit && !goalValue) return problem(t('brandDashboard.validateGoal', { defaultValue: 'Bitte beschreibe das Ziel.' }))

    // Leer ist im Entwurf erlaubt; steht etwas drin, muss es eine Zahl ab 0 sein.
    const hasBudget = budget.trim() !== ''
    const budgetValue = Number(budget.replace(',', '.'))
    if ((submit && !hasBudget) || (hasBudget && (!Number.isFinite(budgetValue) || budgetValue < 0))) {
      return problem(t('brandDashboard.validateBudget', { defaultValue: 'Bitte gib ein Budget in Euro an.' }))
    }

    const eventNameValue = eventName.trim()
    if (submit && !eventNameValue) {
      return problem(t('brandDashboard.validateEventName', { defaultValue: 'Bitte gib den Namen des Events an.' }))
    }

    const startIso = joinIso(eventDate, eventTime)
    const endIso = joinIso(eventEndDate, eventEndTime)
    // Ein eingetragener Beginn muss gültig sein, und ein Ende braucht einen
    // Beginn — das Backend prüft "Ende nach Beginn" nur mit beidem.
    if ((submit && !startIso) || (eventDate && !startIso) || (endIso && !startIso)) {
      return problem(t('brandDashboard.validateEventDate', { defaultValue: 'Bitte wähle das Datum des Events.' }))
    }
    // Gleich ist genauso ungültig wie davor: Das Backend lehnt es ab, und ein
    // Event ohne Dauer liesse sich beim Annehmen des Angebots nicht anlegen.
    // Typischer Fall: Beginn und Ende am selben Tag, beide ohne Uhrzeit.
    if (startIso && endIso && endIso <= startIso) {
      return problem(
        t('brandDashboard.validateEventEnd', { defaultValue: 'Das Ende muss nach dem Beginn liegen.' }),
      )
    }
    // Ein Event in der Vergangenheit lässt sich nicht mehr bewerben. Bewusst
    // nur beim Einreichen ein Fehler: Ein Entwurf darf mit einem alten Datum
    // gespeichert werden, etwa wenn das Datum noch nicht feststeht und erst
    // ein Platzhalter drinsteht. Eingereicht geht er an uns zur Prüfung, und
    // da muss das Datum stimmen.
    if (submit && startIso && new Date(startIso).getTime() < Date.now()) {
      return problem(
        t('brandDashboard.validateEventPast', { defaultValue: 'Das Event liegt in der Vergangenheit. Bitte prüfe das Datum.' }),
      )
    }
    // Das Eventbild ist Pflicht zum Einreichen (Backend: 'eventImage' in
    // data.missing). Im Entwurf darf es noch fehlen.
    if (submit && !hasImage) {
      return problem(t('brandDashboard.validateEventImage', { defaultValue: 'Bitte lade ein Eventbild hoch.' }))
    }

    const rows = deliverables.map((row) => ({
      type: row.type,
      quantity: Math.floor(Number(row.quantity)),
      platform: row.platform || undefined,
      notes: row.notes.trim() || undefined,
    }))
    // Zeilen ohne gültige Anzahl: beim Einreichen ein Fehler, im Entwurf
    // fallen sie weg — das Backend nimmt keine Anzahl unter 1 an.
    const validRows = rows.filter((row) => Number.isFinite(row.quantity) && row.quantity >= 1)
    if (submit && (rows.length === 0 || validRows.length < rows.length)) {
      return problem(
        t('brandDashboard.validateDeliverables', {
          defaultValue: 'Bitte gib mindestens einen gewünschten Inhalt mit Anzahl an.',
        }),
      )
    }

    const from = ageFrom.trim() === '' ? undefined : Math.floor(Number(ageFrom))
    const to = ageTo.trim() === '' ? undefined : Math.floor(Number(ageTo))
    if ((from !== undefined && (!Number.isFinite(from) || from < 0)) || (to !== undefined && (!Number.isFinite(to) || to < 0))) {
      return problem(t('brandDashboard.validateAge', { defaultValue: 'Bitte prüfe die Altersangaben.' }))
    }
    if (submit && from !== undefined && to !== undefined && from > to) {
      return problem(t('brandDashboard.validateAgeRange', { defaultValue: '„Alter von“ darf nicht größer sein als „Alter bis“.' }))
    }
    const interestList = interests
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
    const hasAudience = from !== undefined || to !== undefined || gender !== 'all' || region.trim() || interestList.length > 0
    // Beim Bearbeiten heisst "leer" wirklich leer: null statt undefined, damit
    // das Backend die alte Zielgruppe, die Nutzungsrechte oder die Deadline
    // entfernt. undefined fiele im JSON weg und liesse den alten Wert stehen.
    // Beim Anlegen gibt es nichts zu entfernen, da bleibt das Feld weg.
    const cleared = editId ? null : undefined

    return {
      title: title.trim(),
      goal: goalValue || cleared,
      budget: hasBudget ? budgetValue : cleared,
      // Immer als Objekt mit den gefüllten Feldern; Name und Datum fehlen,
      // solange sie leer sind. Die Koordinaten folgen der null-Regel: Wurde
      // der Ort zu Freitext, müssen alte Koordinaten beim Bearbeiten weg.
      eventDetails: {
        name: eventNameValue || undefined,
        date: startIso,
        endDate: endIso,
        locationName: eventLocation.trim() || undefined,
        description: eventDescription.trim() || undefined,
        coordinates: eventCoordinates ?? cleared,
      },
      deliverables: submit ? rows : validRows,
      targetAudience: hasAudience
        ? { ageFrom: from, ageTo: to, gender, region: region.trim() || undefined, interests: interestList }
        : cleared,
      // Nutzungshinweise gehören zur Weiterverwendung. Ist der Schalter aus,
      // geht nichts davon mit — vorher wurden Hinweise auch dann gesendet und
      // waren beim Bearbeiten unsichtbar, weil das Feld eingeklappt war.
      usageRights: brandMayReuse ? { brandMayReuse: true, notes: usageNotes.trim() || undefined } : cleared,
      publishDeadline: joinIso(publishDeadline, '00:00') ?? cleared,
      approvalRequired,
    }
  }

  const save = useMutation({
    // Speichern und Einreichen sind zwei Requests. Scheitert erst der zweite,
    // existiert der Entwurf schon: Dann geht es trotzdem auf die Auftragsseite
    // (mit Fehlerhinweis), statt im Formular zu bleiben, wo der nächste Klick
    // einen zweiten Entwurf anlegen würde.
    mutationFn: async ({ payload, submit }: { payload: BrandOrderPayload; submit: boolean }) => {
      let saved = editId
        ? await brandService.updateOrder(editId, payload)
        : await brandService.createOrder(payload)
      // Das Bild erst nach dem JSON: Beim Anlegen gibt es die Auftrags-ID
      // vorher nicht. Scheitert der Upload, bleibt der Entwurf gespeichert
      // und das Einreichen unterbleibt — ohne Bild wiese das Backend es
      // ohnehin ab.
      try {
        if (imageFile) {
          saved = await brandService.uploadOrderImage(saved.id, imageFile)
        } else if (imageRemoved && existingImageUrl) {
          saved = await brandService.removeOrderImage(saved.id)
        }
      } catch (error) {
        return { order: saved, submitError: null as unknown, imageError: error }
      }
      if (!submit) return { order: saved, submitError: null as unknown, imageError: null as unknown }
      try {
        return { order: await brandService.submitOrder(saved.id), submitError: null as unknown, imageError: null as unknown }
      } catch (error) {
        return { order: saved, submitError: error, imageError: null as unknown }
      }
    },
    onSuccess: ({ order, submitError, imageError }, variables) => {
      queryClient.invalidateQueries({ queryKey: BRAND_ORDERS_QUERY_KEY })
      queryClient.setQueryData(['brand', 'order', order.id], order)
      if (imageError) {
        // Der Entwurf existiert, nur das Bild fehlt: zurück in den Entwurf,
        // damit die Brand es dort noch einmal wählt — nicht auf die
        // Auftragsseite, wo es keinen Upload gibt.
        fail(
          imageError,
          t('brandDashboard.eventImageUploadFailedDraftSaved', {
            defaultValue:
              'Der Entwurf ist gespeichert, aber das Eventbild konnte nicht hochgeladen werden. Bitte versuche es im Entwurf noch einmal.',
          }),
        )
        router.push(localePath(`/brand/orders/${order.id}/edit`))
        return
      }
      const missing = submitError ? readMissingFields(submitError) : []
      if (missing.length > 0) {
        // Das Backend hat den Entwurf als unvollständig abgewiesen (400 mit
        // data.missing). Die Felder beim Namen nennen statt der generischen
        // Meldung — die Formularprüfung oben sollte das zwar vorher fangen,
        // Backend und Formular können aber auseinanderlaufen (etwa ein Datum,
        // das gerade eben verstrichen ist).
        toast({
          variant: 'destructive',
          title: t('brandDashboard.submitIncompleteTitle', { defaultValue: 'Noch nicht vollständig' }),
          description: t('brandDashboard.submitIncompleteDraftSaved', {
            fields: missing.map(labels.missingField).join(', '),
            defaultValue: 'Der Entwurf ist gespeichert. Zum Einreichen fehlt noch: {{fields}}',
          }),
        })
      } else if (submitError) {
        fail(
          submitError,
          t('brandDashboard.submitFailedDraftSaved', {
            defaultValue: 'Der Entwurf ist gespeichert, aber das Einreichen hat nicht geklappt. Du kannst es auf der Auftragsseite erneut versuchen.',
          }),
        )
      } else {
        toast({
          title: t('common.success', { defaultValue: 'Erfolg' }),
          description: variables.submit
            ? t('brandDashboard.orderSubmitted', { defaultValue: 'Dein Auftrag ist eingereicht. Wir melden uns mit einem Angebot.' })
            : t('brandDashboard.draftSaved', { defaultValue: 'Entwurf gespeichert.' }),
        })
      }
      router.push(localePath(`/brand/orders/${order.id}`))
    },
    onError: (error: unknown) =>
      fail(error, t('brandDashboard.orderSaveFailed', { defaultValue: 'Der Auftrag konnte nicht gespeichert werden.' })),
  })

  const handle = (submit: boolean) => {
    const payload = buildPayload(submit)
    if (!payload) return
    save.mutate({ payload, submit })
  }

  // Einreichen sperrt den Auftrag, deshalb erst prüfen, dann rückfragen:
  // Validierungsfehler sollen vor dem Dialog sichtbar sein, nicht danach.
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const askToSubmit = () => {
    if (buildPayload(true)) setConfirmSubmit(true)
  }

  if (editId && existing.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingBars />
        </CardContent>
      </Card>
    )
  }

  if (editId && (existing.isError || !existing.data)) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t('brandDashboard.orderLoadFailed', { defaultValue: 'Der Auftrag lässt sich nicht laden.' })}
          </p>
          <Link href={localePath('/brand')}>
            <Button variant="outline">{t('brandDashboard.backToDashboard', { defaultValue: 'Zurück zum Dashboard' })}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (editId && existing.data && existing.data.status !== 'draft') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t('brandDashboard.orderLocked', {
              defaultValue: 'Dieser Auftrag ist bereits eingereicht und lässt sich nicht mehr ändern.',
            })}
          </p>
          <Link href={localePath(`/brand/orders/${editId}`)}>
            <Button variant="outline">{t('brandDashboard.viewOrder', { defaultValue: 'Auftrag ansehen' })}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const updateRow = (index: number, patch: Partial<DeliverableRow>) =>
    setDeliverables((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  return (
    <>
      <div>
        <Link
          href={localePath(editId ? `/brand/orders/${editId}` : '/brand')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', { defaultValue: 'Zurück' })}
        </Link>
        <h1 className="text-3xl font-bold">
          {editId
            ? t('brandDashboard.editOrder', { defaultValue: 'Entwurf bearbeiten' })
            : t('brandDashboard.newOrder', { defaultValue: 'Neuer Auftrag' })}
        </h1>
        <p className="text-muted-foreground">
          {t('brandDashboard.newOrderSubtitle', {
            defaultValue: 'Beschreibe dein Event und was du dir von Creatorn wünschst. Wir schlagen passende Creator vor und schicken dir ein Angebot.',
          })}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t('brandDashboard.draftHint', {
            defaultValue: 'Für einen Entwurf reicht der Titel. Zum Einreichen brauchen wir alle Felder mit *.',
          })}
        </p>
      </div>

      <form
        // Enter in einem Textfeld löst nichts aus. Vorher reichte es den
        // Auftrag ein, und der war danach gesperrt. Speichern und Einreichen
        // laufen nur über die beiden Buttons.
        onSubmit={(event) => event.preventDefault()}
        className="space-y-6"
      >
        {/* Kampagne */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('brandDashboard.campaignSection', { defaultValue: 'Kampagne' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('brandDashboard.fieldTitle', { defaultValue: 'Titel' })} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder={t('brandDashboard.fieldTitlePlaceholder', { defaultValue: 'z. B. Launch-Party Sommerkollektion' })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">{t('brandDashboard.fieldGoal', { defaultValue: 'Ziel der Kampagne' })} *</Label>
              <Textarea
                id="goal"
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                maxLength={1000}
                placeholder={t('brandDashboard.fieldGoalPlaceholder', {
                  defaultValue: 'z. B. Bekanntheit bei 18- bis 30-Jährigen in Wien steigern',
                })}
                required
              />
            </div>
            <div className="space-y-2 md:w-1/2">
              <Label htmlFor="budget">{t('brandDashboard.fieldBudget', { defaultValue: 'Budget (EUR)' })} *</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                // Cent-Beträge wie 1500.50 sind erlaubt. Mit step="1" liess
                // der Browser den Entwurf speichern, blockierte aber das
                // Einreichen still über die Formularprüfung.
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('brandDashboard.fieldBudgetHint', {
                  defaultValue: 'Deine Vorstellung. Den endgültigen Preis bekommst du mit unserem Angebot.',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Event */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {t('brandDashboard.eventSection', { defaultValue: 'Event' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">{t('brandDashboard.fieldEventName', { defaultValue: 'Name des Events' })} *</Label>
              <Input id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">{t('brandDashboard.fieldEventDate', { defaultValue: 'Beginn' })} *</Label>
                <div className="flex gap-2">
                  <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                  <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventEndDate">{t('brandDashboard.fieldEventEnd', { defaultValue: 'Ende (optional)' })}</Label>
                <div className="flex gap-2">
                  <Input id="eventEndDate" type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} />
                  <Input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} className="w-32" />
                </div>
              </div>
            </div>
            {/* Adresssuche wie in CreateEvent. Ein gewählter Vorschlag bringt
                Koordinaten mit; weitergetippt wird der Text wieder Freitext
                ohne Koordinaten. */}
            <div className="space-y-2" ref={locationSearchRef}>
              <Label htmlFor="eventLocation">{t('brandDashboard.fieldEventLocation', { defaultValue: 'Ort' })}</Label>
              <div className="relative">
                <Input
                  id="eventLocation"
                  value={eventLocation}
                  onChange={(e) => {
                    setEventLocation(e.target.value)
                    setLocationQuery(e.target.value)
                    setEventCoordinates(null)
                  }}
                  onFocus={() => {
                    if (!eventCoordinates && locationResults.length > 0) setShowLocationDropdown(true)
                  }}
                  placeholder={t('brandDashboard.fieldEventLocationPlaceholder', { defaultValue: 'z. B. Pratersauna, Wien' })}
                  autoComplete="off"
                />
                {showLocationDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {locationResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => pickLocation(result)}
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {eventCoordinates && (
                <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  {t('brandDashboard.addressRecognized', { defaultValue: 'Adresse erkannt' })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('brandDashboard.fieldEventLocationHint', {
                  defaultValue: 'Wähle einen Vorschlag aus der Liste, damit das Event später auf der Karte und in der Umkreissuche erscheint.',
                })}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDescription">{t('brandDashboard.fieldEventDescription', { defaultValue: 'Beschreibung' })}</Label>
              <Textarea
                id="eventDescription"
                rows={3}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                maxLength={2000}
              />
            </div>
            {/* Eventbild — wie beim Anlegen eines Events (CreateEvent),
                nur eines: Es wird beim Annehmen des Angebots zum Bild des
                Events. */}
            <div className="space-y-2">
              <Label htmlFor="eventImage">{t('brandDashboard.fieldEventImage', { defaultValue: 'Eventbild' })} *</Label>
              {imagePreview ? (
                <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border">
                  <img src={resolveImageUrl(imagePreview)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    title={t('brandDashboard.removeEventImage', { defaultValue: 'Bild entfernen' })}
                    aria-label={t('brandDashboard.removeEventImage', { defaultValue: 'Bild entfernen' })}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="eventImage"
                  className="flex flex-col items-center justify-center w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {t('brandDashboard.chooseEventImage', { defaultValue: 'Bild auswählen' })}
                  </span>
                </label>
              )}
              <input
                id="eventImage"
                type="file"
                accept="image/*,image/heic,image/heif"
                className="hidden"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <label htmlFor="eventImage" className="inline-block text-sm text-primary cursor-pointer hover:underline">
                  {t('brandDashboard.replaceEventImage', { defaultValue: 'Bild ersetzen' })}
                </label>
              )}
              <p className="text-xs text-muted-foreground">
                {t('brandDashboard.fieldEventImageHint', {
                  defaultValue: 'Pflicht zum Einreichen. Ideales Format 16:9 (z. B. 1920 × 1080 px), JPG, PNG oder WebP, höchstens 10 MB.',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Inhalte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clapperboard className="h-5 w-5" />
              {t('brandDashboard.deliverablesSection', { defaultValue: 'Gewünschte Inhalte' })} *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deliverables.map((row, index) => (
              <div key={index} className="grid md:grid-cols-[1fr_6rem_1fr_1fr_auto] gap-2 items-end rounded-md border p-3">
                <div className="space-y-1">
                  <Label>{t('brandDashboard.fieldDeliverableType', { defaultValue: 'Art' })}</Label>
                  <select
                    className={SELECT_CLASS}
                    value={row.type}
                    onChange={(e) => updateRow(index, { type: e.target.value as DeliverableType })}
                  >
                    {DELIVERABLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {labels.deliverable(type)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t('brandDashboard.fieldDeliverableQuantity', { defaultValue: 'Anzahl' })}</Label>
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('brandDashboard.fieldDeliverablePlatform', { defaultValue: 'Plattform' })}</Label>
                  <select
                    className={SELECT_CLASS}
                    value={row.platform}
                    onChange={(e) => updateRow(index, { platform: e.target.value as DeliverablePlatform | '' })}
                  >
                    <option value="">{t('brandDashboard.platformAny', { defaultValue: 'Egal' })}</option>
                    {DELIVERABLE_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {labels.platform(platform)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t('brandDashboard.fieldDeliverableNotes', { defaultValue: 'Hinweis' })}</Label>
                  <Input value={row.notes} onChange={(e) => updateRow(index, { notes: e.target.value })} maxLength={500} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  disabled={deliverables.length <= 1}
                  onClick={() => setDeliverables((rows) => rows.filter((_, i) => i !== index))}
                  title={t('common.remove', { defaultValue: 'Entfernen' })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setDeliverables((rows) => [...rows, emptyDeliverable()])}
            >
              <Plus className="h-4 w-4" />
              {t('brandDashboard.addDeliverable', { defaultValue: 'Weiteren Inhalt hinzufügen' })}
            </Button>
          </CardContent>
        </Card>

        {/* Zielgruppe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('brandDashboard.audienceSection', { defaultValue: 'Zielgruppe (optional)' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageFrom">{t('brandDashboard.fieldAgeFrom', { defaultValue: 'Alter von' })}</Label>
                <Input id="ageFrom" type="number" min={0} value={ageFrom} onChange={(e) => setAgeFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageTo">{t('brandDashboard.fieldAgeTo', { defaultValue: 'Alter bis' })}</Label>
                <Input id="ageTo" type="number" min={0} value={ageTo} onChange={(e) => setAgeTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">{t('brandDashboard.fieldGender', { defaultValue: 'Geschlecht' })}</Label>
                <select id="gender" className={SELECT_CLASS} value={gender} onChange={(e) => setGender(e.target.value as AudienceGender)}>
                  {AUDIENCE_GENDERS.map((value) => (
                    <option key={value} value={value}>
                      {labels.gender(value)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">{t('brandDashboard.fieldRegion', { defaultValue: 'Region' })}</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder={t('brandDashboard.fieldRegionPlaceholder', { defaultValue: 'Wien' })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests">{t('brandDashboard.fieldInterests', { defaultValue: 'Interessen' })}</Label>
                <Input
                  id="interests"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder={t('brandDashboard.fieldInterestsPlaceholder', { defaultValue: 'Nightlife, Fashion, … (mit Komma trennen)' })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rahmen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('brandDashboard.termsSection', { defaultValue: 'Rahmenbedingungen' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="brandMayReuse">{t('brandDashboard.fieldReuse', { defaultValue: 'Inhalte weiterverwenden' })}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('brandDashboard.fieldReuseHint', {
                    defaultValue: 'Du möchtest die Inhalte der Creator auch auf eigenen Kanälen nutzen.',
                  })}
                </p>
              </div>
              <Switch
                id="brandMayReuse"
                checked={brandMayReuse}
                onCheckedChange={(value) => {
                  setBrandMayReuse(value)
                  // Beim Ausschalten auch die Hinweise leeren, sonst stünden
                  // sie unsichtbar im Zustand und kämen beim nächsten
                  // Einschalten unerwartet wieder.
                  if (!value) setUsageNotes('')
                }}
              />
            </div>
            {brandMayReuse && (
              <div className="space-y-2">
                <Label htmlFor="usageNotes">{t('brandDashboard.fieldUsageNotes', { defaultValue: 'Hinweise zur Nutzung' })}</Label>
                <Textarea id="usageNotes" rows={2} value={usageNotes} onChange={(e) => setUsageNotes(e.target.value)} />
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="approvalRequired">{t('brandDashboard.fieldApproval', { defaultValue: 'Freigabe vor Veröffentlichung' })}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('brandDashboard.fieldApprovalHint', {
                    defaultValue: 'Die Creator zeigen dir die Inhalte, bevor sie online gehen.',
                  })}
                </p>
              </div>
              <Switch id="approvalRequired" checked={approvalRequired} onCheckedChange={setApprovalRequired} />
            </div>
            <div className="space-y-2 md:w-1/2">
              <Label htmlFor="publishDeadline">{t('brandDashboard.fieldDeadline', { defaultValue: 'Veröffentlichung bis' })}</Label>
              <Input id="publishDeadline" type="date" value={publishDeadline} onChange={(e) => setPublishDeadline(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="button" variant="outline" className="flex-1" disabled={save.isPending} onClick={() => handle(false)}>
            {t('brandDashboard.saveDraft', { defaultValue: 'Als Entwurf speichern' })}
          </Button>
          <Button type="button" variant="gradient" className="flex-1" loading={save.isPending} onClick={askToSubmit}>
            {t('brandDashboard.submitOrder', { defaultValue: 'Einreichen' })}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {t('brandDashboard.submitHint', {
            defaultValue: 'Nach dem Einreichen prüfen wir den Auftrag, schlagen Creator vor und schicken dir ein Angebot. Änderungen sind dann nur noch über uns möglich.',
          })}
        </p>
      </form>

      {/* Gleiche Rückfrage wie auf der Detailseite (BrandOrderDetail). */}
      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('brandDashboard.submitConfirmTitle', { defaultValue: 'Auftrag einreichen?' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('brandDashboard.submitConfirmDesc', {
                defaultValue: 'Danach kannst du den Auftrag nicht mehr selbst ändern. Wir prüfen ihn und schicken dir ein Angebot.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Abbrechen' })}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handle(true)}>
              {t('brandDashboard.submitOrder', { defaultValue: 'Einreichen' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
