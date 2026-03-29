import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Loader2, PartyPopper, Music, Utensils, Palette, Dumbbell, Briefcase } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { userService } from '@/services/user'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

const interests = [
  { id: 'party', label: 'Party & Nightlife', icon: PartyPopper },
  { id: 'music', label: 'Musik & Konzerte', icon: Music },
  { id: 'food', label: 'Food & Drinks', icon: Utensils },
  { id: 'art', label: 'Kunst & Kultur', icon: Palette },
  { id: 'sport', label: 'Sport & Fitness', icon: Dumbbell },
  { id: 'business', label: 'Business & Networking', icon: Briefcase },
]

export default function Interest() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const [selectedInterest, setSelectedInterest] = useState<string>('')

  const updateUserMutation = useMutation({
    mutationFn: (interest: string) =>
      userService.updateProfile({
        interest,
        partiesAttended: true,
        partiesHosted: true,
      }),
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        updateUser({ ...user, ...updatedUser, interest: selectedInterest } as any)
      }
      toast({
        description: t('interest.saved', { defaultValue: 'Interesse gespeichert!' }),
      })
      navigate('/explore')
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('common.saveError'),
      })
    },
  })

  const handleNext = () => {
    if (selectedInterest) {
      updateUserMutation.mutate(selectedInterest)
    }
  }

  const handleSkip = () => {
    navigate('/explore')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {t('interest.heading', { defaultValue: 'Was interessiert dich?' })}
          </CardTitle>
          <CardDescription>
            {t('interest.description', {
              defaultValue: 'Wähle dein Hauptinteresse, um passende Events zu entdecken',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {interests.map((interest) => {
              const Icon = interest.icon
              const isSelected = selectedInterest === interest.label

              return (
                <button
                  key={interest.id}
                  onClick={() => setSelectedInterest(interest.label)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    isSelected
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-muted hover:border-pink-300'
                  }`}
                >
                  <Icon
                    className={`h-8 w-8 mx-auto mb-2 ${
                      isSelected ? 'text-pink-500' : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? 'text-pink-600' : 'text-muted-foreground'
                    }`}
                  >
                    {interest.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-3">
            <Button
              className="w-full bg-pink-500 hover:bg-pink-600"
              onClick={handleNext}
              disabled={!selectedInterest || updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving', { defaultValue: 'Wird gespeichert...' })}
                </>
              ) : (
                t('interest.next', { defaultValue: 'Weiter' })
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleSkip}
              disabled={updateUserMutation.isPending}
            >
              {t('interest.skip', { defaultValue: 'Überspringen' })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
