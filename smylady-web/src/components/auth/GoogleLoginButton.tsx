import { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { authService } from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

// Google OAuth Web Client ID for Share Your Party Web App
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '878037089362-gg85vmgb1ejt539u8rhlf37ie48sicqv.apps.googleusercontent.com'

interface GoogleLoginButtonProps {
  onSuccess?: () => void
  className?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              type?: 'standard' | 'icon'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              width?: number
            }
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

export function GoogleLoginButton({ onSuccess, className }: GoogleLoginButtonProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { login } = useAuth()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setIsLoading(true)
      try {
        const authResponse = await authService.verifyGoogleLogin(response.credential)
        await login(authResponse)
        // Invalidate all cached queries so they refetch with auth token
        await queryClient.invalidateQueries()
        toast({
          title: 'Erfolgreich angemeldet!',
          description: 'Willkommen bei Share Your Party!',
        })
        onSuccess?.()
      } catch (error: unknown) {
        console.error('Google login error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Google-Anmeldung fehlgeschlagen'
        toast({
          variant: 'destructive',
          title: 'Anmeldung fehlgeschlagen',
          description: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [login, toast, onSuccess]
  )

  useEffect(() => {
    // Don't initialize if no client ID
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured')
      return
    }

    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        })
        setIsGoogleLoaded(true)
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [handleGoogleResponse])

  useEffect(() => {
    // Render Google button when loaded
    if (isGoogleLoaded && window.google) {
      const buttonContainer = document.getElementById('google-signin-button')
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          shape: 'rectangular',
          width: buttonContainer.offsetWidth,
        })
      }
    }
  }, [isGoogleLoaded])

  // If no Google Client ID is configured, show disabled button
  if (!GOOGLE_CLIENT_ID) {
    return (
      <Button variant="outline" type="button" disabled className={className}>
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Mit Google anmelden
      </Button>
    )
  }

  if (isLoading) {
    return (
      <Button variant="outline" type="button" disabled className={className}>
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Anmeldung läuft...
      </Button>
    )
  }

  return (
    <div className={className}>
      {/* Hidden container for Google's rendered button */}
      <div id="google-signin-button" className="w-full flex justify-center" />

      {/* Fallback button while Google loads */}
      {!isGoogleLoaded && (
        <Button variant="outline" type="button" disabled className="w-full">
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t('auth.googleLoading')}
        </Button>
      )}
    </div>
  )
}
