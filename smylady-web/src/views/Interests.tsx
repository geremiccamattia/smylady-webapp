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
  'Yoga': '🧘',
}

const MUSIC_GENRES = [
  { value: 'techno', label: 'Techno', emoji: '🎛️' },
  { value: 'house', label: 'House', emoji: '🏠' },
  { value: 'electronic', label: 'Electronic', emoji: '⚡' },
  { value: 'hip_hop', label: 'Hip Hop', emoji: '🎤' },
  { value: 'rnb', label: 'R&B', emoji: '💜' },
  { value: 'pop', label: 'Pop', emoji: '🎵' },
  { value: 'rock', label: 'Rock', emoji: '🎸' },
  { value: 'indie', label: 'Indie', emoji: '🌿' },
  { value: 'dnb', label: 'Drum & Bass', emoji: '🥁' },
  { value: 'jazz', label: 'Jazz', emoji: '🎷' },
  { value: 'latin', label: 'Latin', emoji: '💃' },
  { value: 'reggae', label: 'Reggae', emoji: '🟢' },
  { value: 'classical', label: 'Classical', emoji: '🎻' },
  { value: 'mixed', label: 'Mixed', emoji: '🎶' },
]

export default function Interests() {
  const { i18n } = useTranslation()
  const isEnglish = i18n.language.startsWith('en')
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    )
  }

  const toggleGenre = (value: string) => {
    setSelectedGenres((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    )
  }

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
      return
    }
    handleSave()
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await apiClient.patch('/users/profile', {
        interests: selectedCategories,
        musicPreferences: selectedGenres,
      })
    } catch {
      // non-blocking
    } finally {
      setIsLoading(false)
      router.replace('/explore')
    }
  }

  const handleSkip = () => {
    if (step === 1) {
      router.replace('/explore')
    } else {
      handleSave()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Share Your Party" className="mx-auto w-16 h-16 rounded-full object-cover" />

          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold gradient-text">
                {isEnglish ? 'What are you into?' : 'Was interessiert dich?'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEnglish
                  ? 'Select your interests so we can show you the right events.'
                  : 'Wähle deine Interessen damit wir dir die richtigen Events zeigen.'}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold gradient-text">
                {isEnglish ? 'What music do you love?' : 'Welche Musik liebst du?'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEnglish
                  ? 'Pick your favorite genres for better event recommendations.'
                  : 'Wähle deine Lieblingsgenres für bessere Event-Empfehlungen.'}
              </p>
            </>
          )}

          {/* Step indicator */}
          <div className="flex justify-center gap-2 pt-2">
            <div className={`h-1.5 w-8 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1.5 w-8 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-2 gap-3">
            {EVENT_CATEGORIES.filter(cat => cat.value !== 'Other').map((cat) => {
              const isSelected = selectedCategories.includes(cat.value)
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
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
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {MUSIC_GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre.value)
              return (
                <button
                  key={genre.value}
                  onClick={() => toggleGenre(genre.value)}
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
                  <span className="text-2xl">{genre.emoji}</span>
                  <p className="font-medium text-sm">{genre.label}</p>
                </button>
              )
            })}
          </div>
        )}

        {(step === 1 ? selectedCategories : selectedGenres).length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {(step === 1 ? selectedCategories : selectedGenres).length} {isEnglish ? 'selected' : 'ausgewählt'}
          </p>
        )}

        <div className="space-y-3">
          <Button
            variant="gradient"
            className="w-full"
            onClick={handleNext}
            disabled={isLoading || (step === 1 && selectedCategories.length === 0)}
          >
            {isLoading
              ? (isEnglish ? 'Saving...' : 'Speichert...')
              : step === 1
                ? (isEnglish ? 'Next' : 'Weiter')
                : (isEnglish ? 'Finish' : 'Fertig')}
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
