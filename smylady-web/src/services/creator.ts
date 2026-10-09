'use client'

import { apiClient } from './api'

/**
 * Stand der eigenen Creator-Bewerbung, aus `GET /influencer/my-application`.
 *
 * `application` ist null, wenn für dieses Konto keine Bewerbung vorliegt.
 * `hasCreatorProfile` schlägt alles: Wer schon ein Creator-Profil hat, ist
 * Mitglied — auch wenn daneben noch ein alter Antrag im Status 'approved' liegt.
 */

export type CreatorApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface MyCreatorApplication {
  application: { status: CreatorApplicationStatus; createdAt: string } | null
  hasCreatorProfile: boolean
}

/** Die Sicht, die sich aus der Serverantwort ergibt. */
export type CreatorStanding = 'none' | 'pending' | 'approved' | 'rejected' | 'member'

export const creatorService = {
  async getMyApplication(): Promise<MyCreatorApplication | undefined> {
    const response = await apiClient.get<
      { data?: MyCreatorApplication } & MyCreatorApplication
    >('/influencer/my-application')
    // Das Backend antwortet je nach Endpunkt mit oder ohne data-Hülle.
    return response.data?.data ?? response.data
  },
}

/**
 * Reihenfolge der Fälle ist bedeutsam, siehe oben: Profil vor Bewerbung.
 * Ein unbekannter Status gilt als 'pending' — lieber den Stand offenlassen
 * als ein zweites Bewerbungsformular anbieten.
 */
export function resolveCreatorStanding(payload: MyCreatorApplication): CreatorStanding {
  if (payload.hasCreatorProfile) return 'member'
  if (!payload.application) return 'none'

  switch (payload.application.status) {
    case 'rejected':
      return 'rejected'
    case 'approved':
      return 'approved'
    case 'pending':
    default:
      return 'pending'
  }
}
