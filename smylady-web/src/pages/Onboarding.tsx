import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OnboardingStep {
  image: string
  headline: string
  subtitle: string
  description?: string
}

const steps: OnboardingStep[] = [
  {
    image: '/onboarding1.jpg',
    headline: 'Finde die besten Angebote',
    subtitle: 'Entdecke Freizeitangebote in deiner Stadt oder Gemeinde und vernetze dich mit Menschen, die deine Interessen teilen!',
    description: 'Die App, die dein Event unvergesslich macht.',
  },
  {
    image: '/onboarding2.jpg',
    headline: 'Entdecke neue Events!',
    subtitle: 'Finde spannende Events in deiner Nähe und bleibe immer informiert!',
  },
]

const STORAGE_KEY = 'syp_has_seen_onboarding'

export default function Onboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has already seen onboarding
    const hasSeen = localStorage.getItem(STORAGE_KEY)
    if (hasSeen === 'true') {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    navigate('/login')
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{
          backgroundImage: `url(${currentStepData.image})`,
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Back Button */}
        <div className="p-4">
          {currentStep > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Card Content */}
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-8 space-y-6">
          {/* Headline */}
          <h1 className="text-2xl font-bold text-center">
            {currentStepData.headline}
          </h1>

          {/* Subtitle */}
          <p className="text-center text-muted-foreground">
            {currentStepData.subtitle}
          </p>

          {/* Description */}
          {currentStepData.description && (
            <p className="text-center text-sm text-muted-foreground italic">
              {currentStepData.description}
            </p>
          )}

          {/* Dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentStep === idx
                    ? 'bg-primary w-6'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <Button
            onClick={handleNext}
            variant="gradient"
            className="w-full"
            size="lg"
          >
            {currentStep === steps.length - 1 ? (
              'Los geht\'s'
            ) : (
              <>
                Weiter
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          {/* Skip Button */}
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-muted-foreground"
          >
            Überspringen
          </Button>
        </div>
      </div>
    </div>
  )
}
