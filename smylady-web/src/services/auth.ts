'use client'

import { apiClient } from './api'
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types'

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data.data
  },

  // Register
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/signup', credentials)
    return response.data
  },

  // Verify OTP
  async verifyOtp(data: { email: string; otp: string; type: string }): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/verify-otp', data)
    return response.data.data
  },

  // Resend OTP
  async resendOtp(data: { email: string; type: string }): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/resend-otp', data)
    return response.data
  },

  // Forgot Password
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },

  // Reset Password
  async resetPassword(data: { email: string; password: string; token: string }): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/reset-password', data)
    return response.data
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/users/me')
    return response.data.data
  },

  // Update profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch('/users/profile', data)
    return response.data.data
  },

  // Update profile image
  async updateProfileImage(file: File): Promise<{ profileImage: string }> {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiClient.patch('/users/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  // Change password
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await apiClient.put('/auth/change-password', data)
    return response.data
  },

  // Logout
  logout(): void {
    localStorage.removeItem('syp_token')
    localStorage.removeItem('syp_user')
  },

  // Google OAuth login - like mobile app
  async verifyGoogleLogin(idToken: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/google/callback', { token: idToken })
    return response.data.data
  },

  // Facebook OAuth login - like mobile app
  async verifyFacebookLogin(accessToken: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/facebook/callback', { accessToken })
    return response.data.data
  },

  // Apple OAuth login - like mobile app
  async appleLogin(identityToken: string, user?: { email?: string; name?: string }): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/apple/callback', { identityToken, user })
    return response.data.data
  },

  /*
   * DSGVO-Endpunkte (API-Vertrag 05.11.2026). Der Vertrag schreibt verkürzt
   * „/user/...", der UserController im Backend heißt aber 'users' — wie alle
   * übrigen Aufrufe hier (/users/me, /users/profile).
   */

  // Aktuelle AGB/DSE bestätigen → setzt termsVersion/privacyVersion serverseitig
  async acceptTerms(): Promise<Partial<User>> {
    const response = await apiClient.patch('/users/terms-condition', { term_and_condition: true })
    return response.data.data
  },

  // Geburtsdatum nach Social-Login nachtragen (YYYY-MM-DD); 400 bei < 18
  async setDateOfBirth(dateOfBirth: string): Promise<{ dateOfBirth: string }> {
    const response = await apiClient.patch('/auth/date-of-birth', { dateOfBirth })
    return response.data.data
  },

  // Werbliche Push-Nachrichten (Opt-in)
  async setMarketingPushConsent(
    marketingPushConsent: boolean,
  ): Promise<{ marketingPushConsent: boolean; marketingPushConsentAt: string | null }> {
    const response = await apiClient.patch('/users/marketing-push-consent', { marketingPushConsent })
    return response.data.data
  },

  // Datenexport (Art. 15/20 DSGVO) als JSON-Datei
  async exportData(): Promise<{ blob: Blob; fileName: string }> {
    const response = await apiClient.get('/users/export', { responseType: 'blob' })
    const disposition = String(response.headers?.['content-disposition'] ?? '')
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
    const fileName = match
      ? decodeURIComponent(match[1])
      : `syp-datenexport-${new Date().toISOString().slice(0, 10)}.json`
    return { blob: response.data as Blob, fileName }
  },

  // Kontolöschung Schritt 1: Bestätigungscode an die Konto-E-Mail
  async requestAccountDeletion(): Promise<{ message: string }> {
    const response = await apiClient.post('/users/request-deletion')
    return response.data
  },

  // Kontolöschung Schritt 2: mit Code aus der E-Mail
  async deleteAccount(otp: string): Promise<{ message: string }> {
    const response = await apiClient.delete('/users', { data: { otp } })
    return response.data
  },
}
