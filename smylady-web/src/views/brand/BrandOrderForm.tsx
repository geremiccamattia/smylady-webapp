'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Clapperboard, FileText, Plus, Target, Trash2, Users } from 'lucide-react'
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
  readBrandError,
  type AudienceGender,
  type BrandOrder,
  type BrandOrderPayload,
  type DeliverablePlatform,
  type DeliverableType,
} from '@/services/brand'
import { BrandGate, LoadingBars, useBrandLabels } from '@/components/brand/brandShared'
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
  const [eventDescription, setEventDescription] = useState('')
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
    setEventDescription(order.eventDescription)
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

  const fail = (error: unknown, fallback: string) =>
    toast({
      variant: 'destructive',
      title: t('common.error', { defaultValue: 'Fehler' }),
      description: readBrandError(error, fallback),
    })

  const buildPayload = (): BrandOrderPayload | null => {
    const problem = (message: string) => {
      toast({ variant: 'destructive', title: t('common.error', { defaultValue: 'Fehler' }), description: message })
      return null
    }

    if (!title.trim()) return problem(t('brandDashboard.validateTitle', { defaultValue: 'Bitte gib einen Titel an.' }))
    if (!goal.trim()) return problem(t('brandDashboard.validateGoal', { defaultValue: 'Bitte beschreibe das Ziel.' }))
    const budgetValue = Number(budget.replace(',', '.'))
    if (budget.trim() === '' || !Number.isFinite(budgetValue) || budgetValue < 0) {
      return problem(t('brandDashboard.validateBudget', { defaultValue: 'Bitte gib ein Budget in Euro an.' }))
    }
    if (!eventName.trim()) {
      return problem(t('brandDashboard.validateEventName', { defaultValue: 'Bitte gib den Namen des Events an.' }))
    }
    const startIso = joinIso(eventDate, eventTime)
    if (!startIso) return problem(t('brandDashboard.validateEventDate', { defaultValue: 'Bitte wähle das Datum des Events.' }))
    const endIso = joinIso(eventEndDate, eventEndTime)
    // Gleich ist genauso ungültig wie davor: Das Backend lehnt es ab, und ein
    // Event ohne Dauer liesse sich beim Annehmen des Angebots nicht anlegen.
    // Typischer Fall: Beginn und Ende am selben Tag, beide ohne Uhrzeit.
    if (endIso && endIso <= startIso) {
      return problem(
        t('brandDashboard.validateEventEnd', { defaultValue: 'Das Ende muss nach dem Beginn liegen.' }),
      )
    }

    const rows = deliverables.map((row) => ({
      type: row.type,
      quantity: Math.floor(Number(row.quantity)),
      platform: row.platform || undefined,
      notes: row.notes.trim() || undefined,
    }))
    if (rows.length === 0 || rows.some((row) => !Number.isFinite(row.quantity) || row.quantity < 1)) {
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
      goal: goal.trim(),
      budget: budgetValue,
      eventDetails: {
        name: eventName.trim(),
        date: startIso,
        endDate: endIso,
        locationName: eventLocation.trim() || undefined,
        description: eventDescription.trim() || undefined,
      },
      deliverables: rows,
      targetAudience: hasAudience
        ? { ageFrom: from, ageTo: to, gender, region: region.trim() || undefined, interests: interestList }
        : cleared,
      usageRights: brandMayReuse || usageNotes.trim() ? { brandMayReuse, notes: usageNotes.trim() || undefined } : cleared,
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
      const saved = editId
        ? await brandService.updateOrder(editId, payload)
        : await brandService.createOrder(payload)
      if (!submit) return { order: saved, submitError: null as unknown }
      try {
        return { order: await brandService.submitOrder(saved.id), submitError: null as unknown }
      } catch (error) {
        return { order: saved, submitError: error }
      }
    },
    onSuccess: ({ order, submitError }, variables) => {
      queryClient.invalidateQueries({ queryKey: BRAND_ORDERS_QUERY_KEY })
      queryClient.setQueryData(['brand', 'order', order.id], order)
      if (submitError) {
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
    const payload = buildPayload()
    if (!payload) return
    save.mutate({ payload, submit })
  }

  // Einreichen sperrt den Auftrag, deshalb erst prüfen, dann rückfragen:
  // Validierungsfehler sollen vor dem Dialog sichtbar sein, nicht danach.
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const askToSubmit = () => {
    if (buildPayload()) setConfirmSubmit(true)
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
                step="1"
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
            <div className="space-y-2">
              <Label htmlFor="eventLocation">{t('brandDashboard.fieldEventLocation', { defaultValue: 'Ort' })}</Label>
              <Input
                id="eventLocation"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder={t('brandDashboard.fieldEventLocationPlaceholder', { defaultValue: 'z. B. Pratersauna, Wien' })}
              />
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
          </CardContent>
        </Card>

        {/* Inhalte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clapperboard className="h-5 w-5" />
              {t('brandDashboard.deliverablesSection', { defaultValue: 'Gewünschte Inhalte' })}
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
                        {platform}
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
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Wien" />
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
              <Switch id="brandMayReuse" checked={brandMayReuse} onCheckedChange={setBrandMayReuse} />
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
