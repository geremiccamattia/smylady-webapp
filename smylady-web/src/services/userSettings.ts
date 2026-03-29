import { apiClient } from './api'
import { STORAGE_KEYS } from '@/lib/constants'

export const userSettingsService = {
  /**
   * Request email change - sends OTP to new email
   */
  async requestEmailChange(newEmail: string) {
    const response = await apiClient.post('/users/request-email-change', {
      newEmail,
    })
    return response.data
  },

  /**
   * Verify email change with OTP
   */
  async verifyEmailChange(newEmail: string, otp: string) {
    const response = await apiClient.post('/users/verify-email-change', {
      newEmail,
      otp,
    })

    // Update stored email if successful
    if (response.data?.data?.email) {
      const userJson = localStorage.getItem(STORAGE_KEYS.USER)
      if (userJson) {
        const user = JSON.parse(userJson)
        user.email = response.data.data.email
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      }
    }

    return response.data
  },

  /**
   * Request password change - verifies current password and sends OTP
   */
  async requestPasswordChange(currentPassword: string) {
    const response = await apiClient.post('/users/request-password-change', {
      currentPassword,
    })
    return response.data
  },

  /**
   * Verify password change with OTP
   */
  async verifyPasswordChange(newPassword: string, otp: string) {
    const response = await apiClient.post('/users/verify-password-change', {
      newPassword,
      otp,
    })
    return response.data
  },
}
