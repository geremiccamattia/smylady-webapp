'use client'

import axios from 'axios'
import { apiClient } from './api'

/**
 * Video-Tutorials für freigeschaltete Konten.
 *
 * Das Backend entscheidet allein: `GET /tutorials` liefert 200 mit der Liste,
 * wenn `tutorialAccess` am Nutzer steht, sonst 403 mit `data: null`. Es gibt
 * KEIN Flag am Nutzerobjekt, an dem sich das im Voraus ablesen liesse —
 * `GET /users/me` baut seine Antwort im Backend aus einer festen Feldliste auf,
 * und `tutorialAccess` steht bewusst nicht darin. Der Aufruf hier ist damit die
 * einzige Quelle für die Frage, ob es den Bereich für diesen Nutzer gibt.
 */

export interface Tutorial {
  _id: string
  title: string
  description: string
  videoUrl: string
  /** Länge in SEKUNDEN, wie im Backend-Schema. 0 heisst unbekannt. */
  duration: number
  order: number
}

export const tutorialsService = {
  async getTutorials(): Promise<Tutorial[]> {
    const response = await apiClient.get('/tutorials')
    const data = response.data?.data
    return Array.isArray(data) ? data : []
  },
}

/**
 * Ob ein Fehler die Absage des Backends ist ("nicht freigeschaltet").
 *
 * Wichtig: 403 darf NICHT wie 401 behandelt werden. Der Response-Interceptor in
 * api.ts löscht Token und Nutzer ausschliesslich bei 401 — ein 403 fällt dort
 * unberührt in `Promise.reject`. Wer keinen Zugang hat, wird also nicht
 * abgemeldet und nicht auf /login geworfen.
 */
export function isTutorialsForbidden(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403
}
