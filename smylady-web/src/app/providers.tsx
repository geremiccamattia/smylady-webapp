'use client'

import '@/i18n'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { Toaster } from '@/components/ui/toaster'
import AuthModal from '@/components/auth/AuthModal'

const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
  ssr: false,
})

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthModalProvider>
          <SocketProvider>
            {children}
            <Toaster />
            <CookieConsent />
            <AuthModal />
          </SocketProvider>
        </AuthModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
