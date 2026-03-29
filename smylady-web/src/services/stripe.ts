import { apiClient } from './api'

export interface PaymentIntent {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export interface AccountBalance {
  available?: number
  availableBalance?: number
  pending?: number
  currency?: string
  accountStatus?: AccountStatus
}

export type AccountStatus = 'active' | 'incomplete' | 'restricted' | 'not connected'

export interface ConnectedAccount {
  accountId?: string
  connectedAccountId?: string
  userId?: string
  email?: string
  isAccountActive?: boolean
  accountStatus: AccountStatus
}

export interface AccountLinkResponse {
  url: string
  expiresAt: string
}

export const stripeService = {
  /**
   * Create a payment intent for ticket purchase
   */
  async createPaymentIntent(eventId: string): Promise<PaymentIntent> {
    const response = await apiClient.post('/stripe/create-payment-intent', { eventId })

    // Handle error responses from backend (e.g., 403 Forbidden for private events)
    if (response.data?.status >= 400) {
      const error = new Error(response.data?.message || 'Failed to create payment') as Error & {
        response?: { status: number; data: unknown }
      }
      error.response = {
        status: response.data.status,
        data: response.data,
      }
      throw error
    }

    return response.data.data
  },

  /**
   * Purchase a free event ticket
   */
  async buyFreeEvent(eventId: string) {
    const response = await apiClient.post('/stripe/purchase-free-ticket', { eventId })

    // Handle error responses from backend (e.g., 403 Forbidden for private events)
    if (response.data?.status >= 400) {
      const error = new Error(response.data?.message || 'Failed to claim ticket') as Error & {
        response?: { status: number; data: unknown }
      }
      error.response = {
        status: response.data.status,
        data: response.data,
      }
      throw error
    }

    return response.data.data?.ticket
  },

  /**
   * Confirm a payment intent after Stripe payment
   */
  async confirmPaymentIntent(paymentIntentId: string) {
    const response = await apiClient.post('/stripe/confirm-payment', { paymentIntentId })
    return response.data.data.ticket
  },

  /**
   * Create Stripe Connect account link for organizers
   */
  async createAccountLink(): Promise<AccountLinkResponse> {
    const response = await apiClient.post('/stripe/create-account-link', {})
    return response.data.data
  },

  /**
   * Get Stripe Connect account balance for organizers
   */
  async getAccountBalance(): Promise<AccountBalance> {
    const response = await apiClient.get('/stripe/account-balance')
    // Backend returns { availableBalance, accountStatus }
    return response.data.data
  },

  /**
   * Disconnect Stripe Connect account
   */
  async disconnectAccount(): Promise<void> {
    await apiClient.post('/stripe/disconnect-account', {})
  },

  /**
   * Get connected Stripe account information
   */
  async getConnectedAccount(): Promise<ConnectedAccount> {
    const response = await apiClient.get('/stripe/get-connected-account')
    return response.data.data
  },

  /**
   * Get Stripe dashboard link for organizers
   */
  async getStripeDashboardLink(): Promise<{ url: string }> {
    const response = await apiClient.get('/stripe/get-stripe-dashboard-link')
    return response.data.data
  },

  /**
   * Activate test account for development
   */
  async activateTestAccount(): Promise<{ message: string }> {
    const response = await apiClient.post('/stripe/activate-test-account', {})
    return response.data.data
  },
}
