'use client'

import '@/i18n'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { Toaster } from '@/components/ui/toaster'
import AuthModal from '@/components/auth/AuthModal'

const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
  ssr: false,
})

function ConditionalSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <>{children}</>

  return <SocketProvider>{children}</SocketProvider>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthModalProvider>
          <ConditionalSocketProvider>
            {children}
            <Toaster />
            <CookieConsent />
            <AuthModal />
          </ConditionalSocketProvider>
        </AuthModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
