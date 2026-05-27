'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, Repeat } from 'lucide-react'

interface RecurringEventModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (series: { recurrence: string; occurrences?: number; customDates?: string[] }) => void
  baseDate: string
}

export default function RecurringEventModal({ open, onClose, onConfirm, baseDate }: RecurringEventModalProps) {
  const { t, i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')

  const [recurrence, setRecurrence] = useState<'weekly' | 'monthly' | 'custom'>('weekly')
  const [occurrences, setOccurrences] = useState('4')
  const [customDates, setCustomDates] = useState<string[]>([])
  const [newDate, setNewDate] = useState('')

  const addCustomDate = () => {
    if (!newDate || customDates.includes(newDate)) return
    setCustomDates(prev => [...prev, newDate].sort())
    setNewDate('')
  }

  const removeCustomDate = (date: string) => {
    setCustomDates(prev => prev.filter(d => d !== date))
  }

  const handleConfirm = () => {
    if (recurrence === 'custom') {
      if (customDates.length < 1) return
      onConfirm({ recurrence, customDates: [baseDate, ...customDates] })
    } else {
      onConfirm({ recurrence, occurrences: parseInt(occurrences) })
    }
    onClose()
  }

  const preview = () => {
    if (recurrence === 'custom') return `${customDates.length + 1} ${t('createEvent.dates', { defaultValue: 'Termine' })}`
    const n = parseInt(occurrences) || 0
    return recurrence === 'weekly'
      ? `${n} ${t('createEvent.weeks', { defaultValue: 'Wochen' })}`
      : `${n} ${t('createEvent.months', { defaultValue: 'Monate' })}`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            {t('createEvent.recurringEvent', { defaultValue: 'Wiederkehrendes Event' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('createEvent.recurrence', { defaultValue: 'Wiederholung' })}</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as 'weekly' | 'monthly' | 'custom')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t('createEvent.weekly', { defaultValue: 'Wöchentlich' })}</SelectItem>
                <SelectItem value="monthly">{t('createEvent.monthly', { defaultValue: 'Monatlich' })}</SelectItem>
                <SelectItem value="custom">{t('createEvent.customDates', { defaultValue: 'Eigene Termine' })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(recurrence === 'weekly' || recurrence === 'monthly') && (
            <div className="space-y-2">
              <Label>{t('createEvent.occurrences', { defaultValue: 'Anzahl Wiederholungen (max. 52)' })}</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={occurrences}
                onChange={(e) => setOccurrences(e.target.value)}
              />
            </div>
          )}

          {recurrence === 'custom' && (
            <div className="space-y-2">
              <Label>{t('createEvent.addDates', { defaultValue: 'Weitere Termine hinzufügen' })}</Label>
              <p className="text-xs text-muted-foreground">
                {t('createEvent.baseDateNote', { defaultValue: 'Der erste Termin ist das Eventdatum das du bereits gewählt hast.' })}
              </p>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <Button type="button" variant="outline" size="icon" onClick={addCustomDate}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {customDates.map(date => (
                  <div key={date} className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded text-sm">
                    <span>{new Date(date).toLocaleDateString(isEnglish ? 'en-GB' : 'de-DE')}</span>
                    <button type="button" onClick={() => removeCustomDate(date)}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-primary/5 rounded-lg text-sm">
            <span className="text-muted-foreground">{t('createEvent.total', { defaultValue: 'Gesamt: ' })}</span>
            <span className="font-medium">{preview()}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t('common.cancel', { defaultValue: 'Abbrechen' })}
            </Button>
            <Button
              variant="gradient"
              className="flex-1"
              onClick={handleConfirm}
              disabled={recurrence === 'custom' && customDates.length === 0}
            >
              {t('createEvent.createSeries', { defaultValue: 'Serie erstellen' })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
