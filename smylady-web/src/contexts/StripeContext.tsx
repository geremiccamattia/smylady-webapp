import { createContext, useContext, ReactNode } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

// Load Stripe with the publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY
console.log('Stripe key:', stripePublishableKey ? 'loaded' : 'missing')

let stripePromise: Promise<Stripe | null> | null = null

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise
}

interface StripeContextType {
  isStripeLoaded: boolean
  stripePublishableKey: string | undefined
}

const StripeContext = createContext<StripeContextType>({
  isStripeLoaded: false,
  stripePublishableKey: undefined,
})

export const useStripeContext = () => useContext(StripeContext)

interface StripeProviderProps {
  children: ReactNode
}

export function StripeProvider({ children }: StripeProviderProps) {
  const value: StripeContextType = {
    isStripeLoaded: !!stripePublishableKey,
    stripePublishableKey,
  }

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  )
}

// Wrapper component for Stripe Elements with clientSecret
interface StripeElementsWrapperProps {
  clientSecret: string
  children: ReactNode
}

export function StripeElementsWrapper({ clientSecret, children }: StripeElementsWrapperProps) {
  const stripe = getStripe()

  if (!stripe) {
    return <div className="text-center text-muted-foreground">Stripe nicht konfiguriert</div>
  }

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#7C3AED',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '8px',
          },
        },
        locale: 'de',
      }}
    >
      {children}
    </Elements>
  )
}
