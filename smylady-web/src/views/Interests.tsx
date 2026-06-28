'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/services/api'
import { Button } from '@/components/ui/button'
import { EVENT_CATEGORIES } from '@/lib/constants'
import { Check } from 'lucide-react'

const CATEGORY_EMOJIS: Record<string, string> = {
  'Music': '🎵',
  'Nature': '🏕️',
  'Theme': '🎭',
  'On the Roof': '🌆',
  'Clubbing': '🎉',
  'Gastronomy': '🍕',
  'Business': '🤝',
  'Sports': '⚽',
  'Workshop': '📚',
}

export default function Interests() {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const [selected, setSelected] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const toggleInterest = (value: string) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    )
  }

  const handleNext = async () => {
    if (selected.length === 0) return
    setIsLoading(true)
    try {
      await apiClient.patch('/users/profile', { interests: selected })
    } catch {
      // non-blocking
    } finally {
      setIsLoading(false)
      router.replace('/explore')
    }
  }

  const handleSkip = () => router.replace('/explore')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Share Your Party" className="mx-auto w-16 h-16 rounded-full object-cover" />
          <h1 className="text-2xl font-bold gradient-text">
            {isEnglish ? 'What are you into?' : 'Was interessiert dich?'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEnglish
              ? 'Select your interests so we can show you the right events.'
              : 'Wähle deine Interessen damit wir dir die richtigen Events zeigen.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {EVENT_CATEGORIES.filter(cat => cat.value !== 'Other').map((cat) => {
            const isSelected = selected.includes(cat.value)
            return (
              <button
                key={cat.value}
                onClick={() => toggleInterest(cat.value)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all space-y-1 ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <span className="text-2xl">{CATEGORY_EMOJIS[cat.value] || '✨'}</span>
                <p className="font-medium text-sm">{cat.label}</p>
              </button>
            )
          })}
        </div>

        {selected.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {selected.length} {isEnglish ? 'selected' : 'ausgewählt'}
          </p>
        )}

        <div className="space-y-3">
          <Button
            variant="gradient"
            className="w-full"
            onClick={handleNext}
            disabled={selected.length === 0 || isLoading}
          >
            {isEnglish ? 'Next' : 'Weiter'}
          </Button>
          <button
            onClick={handleSkip}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isEnglish ? 'Skip' : 'Überspringen'}
          </button>
        </div>
      </div>
    </div>
  )
}
