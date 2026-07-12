'use client'

import { useState, useEffect } from 'react'

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default
        const fp = await FingerprintJS.load()
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
