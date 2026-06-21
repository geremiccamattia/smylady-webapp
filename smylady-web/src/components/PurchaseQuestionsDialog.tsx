'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PurchaseAnswer } from '@/services/stripe'

type EventQuestion = {
  questionId: string
  label: string
  type: 'text' | 'select' | 'checkbox' | 'multiselect'
  required: boolean
  options?: string[]
}

export function PurchaseQuestionsDialog({
  open,
  onOpenChange,
  questions,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  questions: EventQuestion[]
  onSubmit: (answers: PurchaseAnswer[]) => void
  submitting?: boolean
}) {
  const { t } = useTranslation()
  const [values, setValues] = useState<Record<string, string | string[]>>({})

  const requiredQuestions = questions.filter((q) => q.required)

  const setValue = (id: string, v: string | string[]) =>
    setValues((prev) => ({ ...prev, [id]: v }))

  const toggleMulti = (id: string, opt: string) => {
    const cur = Array.isArray(values[id]) ? (values[id] as string[]) : []
    setValue(id, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt])
  }

  const isComplete = requiredQuestions.every((q) => {
    const v = values[q.questionId]
    if (q.type === 'multiselect') return Array.isArray(v) && v.length > 0
    if (q.type === 'checkbox') return v === 'true'
    return typeof v === 'string' && v.trim() !== ''
  })

  const handleSubmit = () => {
    const answers: PurchaseAnswer[] = requiredQuestions.map((q) => ({
      questionId: q.questionId,
      label: q.label,
      type: q.type,
      value: values[q.questionId] ?? (q.type === 'multiselect' ? [] : ''),
    }))
    onSubmit(answers)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('purchaseQuestions.title', { defaultValue: 'Noch ein paar Fragen' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
          {requiredQuestions.map((q) => (
            <div key={q.questionId} className="space-y-2">
              <Label className="text-sm font-medium">
                {q.label} <span className="text-destructive">*</span>
              </Label>

              {q.type === 'text' && (
                <Input
                  value={(values[q.questionId] as string) || ''}
                  onChange={(e) => setValue(q.questionId, e.target.value)}
                />
              )}

              {q.type === 'select' && (
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={(values[q.questionId] as string) || ''}
                  onChange={(e) => setValue(q.questionId, e.target.value)}
                >
                  <option value="">{t('purchaseQuestions.choose', { defaultValue: 'Bitte wählen' })}</option>
                  {(q.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {q.type === 'multiselect' && (
                <div className="space-y-1">
                  {(q.options || []).map((opt) => {
                    const cur = Array.isArray(values[q.questionId]) ? (values[q.questionId] as string[]) : []
                    return (
                      <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cur.includes(opt)}
                          onChange={() => toggleMulti(q.questionId, opt)}
                        />
                        {opt}
                      </label>
                    )
                  })}
                </div>
              )}

              {q.type === 'checkbox' && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values[q.questionId] === 'true'}
                    onChange={(e) => setValue(q.questionId, e.target.checked ? 'true' : 'false')}
                  />
                  {t('purchaseQuestions.yes', { defaultValue: 'Ja' })}
                </label>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel', { defaultValue: 'Abbrechen' })}
          </Button>
          <Button onClick={handleSubmit} disabled={!isComplete || submitting}>
            {t('purchaseQuestions.continue', { defaultValue: 'Weiter zum Kauf' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
