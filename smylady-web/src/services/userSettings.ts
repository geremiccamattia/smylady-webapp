'use client'

import { apiClient } from './api'

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

    // Die E-Mail steht seit M6 nicht mehr im localStorage-Cache (nur id/role/name).
    // Der Aufrufer (ChangeEmailModal → onSuccess) lädt den User per refreshUser neu.
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
