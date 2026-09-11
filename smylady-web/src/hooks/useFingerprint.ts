'use client'

import { useState, useEffect } from 'react'

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default
        // monitoring: false — sonst schickt die Bibliothek bei einem Teil der Aufrufe
        // einen Statistik-Ping an m1.openfpcdn.io. Der hat für uns keine Funktion und
        // ist ein Aufruf an einen Dritten; er steht auch nicht in der CSP (next.config.ts).
        const fp = await FingerprintJS.load({ monitoring: false })
        const result = await fp.get()
        setFingerprint(result.visitorId)
      } catch (error) {
        console.error('FingerprintJS failed:', error)
      }
    }
    load()
  }, [])

  return fingerprint
}
