import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { stripeService } from '@/services/stripe'

/**
 * Hook to create a payment intent for event ticket purchase
 */
export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: (eventId: string) => stripeService.createPaymentIntent(eventId),
  })
}

/**
 * Hook to confirm payment and create ticket
 */
export const useConfirmPaymentIntent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentIntentId: string) => stripeService.confirmPaymentIntent(paymentIntentId),
    onSuccess: () => {
      // Invalidate all ticket-related queries to reflect new purchase
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          (query.queryKey[0] === 'tickets' ||
           query.queryKey[0] === 'my-tickets' ||
           query.queryKey[0] === 'purchasedTicketForEvent' ||
           query.queryKey[0] === 'userTicketForEvent')
      })
    },
  })
}

/**
 * Hook to purchase a free event ticket
 */
export const useBuyFreeEvent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) => stripeService.buyFreeEvent(eventId),
    onSuccess: () => {
      // Invalidate all ticket-related queries to reflect new purchase
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          (query.queryKey[0] === 'tickets' ||
           query.queryKey[0] === 'my-tickets' ||
           query.queryKey[0] === 'purchasedTicketForEvent' ||
           query.queryKey[0] === 'userTicketForEvent')
      })
    },
  })
}

/**
 * Hook to create Stripe Connect account link for organizers
 */
export const useCreateAccountLink = () => {
  return useMutation({
    mutationFn: () => stripeService.createAccountLink(),
  })
}

/**
 * Hook to get organizer's Stripe account balance
 */
export const useGetAccountBalance = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['account-balance'],
    queryFn: () => stripeService.getAccountBalance(),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 errors (account not connected)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          return false
        }
      }
      return failureCount < 2
    },
  })
}

/**
 * Hook to disconnect Stripe Connect account
 */
export const useDisconnectAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => stripeService.disconnectAccount(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-balance'] })
      queryClient.invalidateQueries({ queryKey: ['connected-account'] })
    },
  })
}

/**
 * Hook to get connected Stripe account info
 */
export const useGetConnectedAccount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['connected-account'],
    queryFn: () => stripeService.getConnectedAccount(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

/**
 * Hook to get Stripe dashboard link for organizers
 */
export const useGetStripeDashboardLink = () => {
  return useMutation({
    mutationFn: () => stripeService.getStripeDashboardLink(),
  })
}
