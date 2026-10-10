'use client'

import { useEffect, useState } from 'react'

/**
 * Die aktuelle Zeit, aber erst nach dem Mount.
 *
 * Beim Server-Rendering und im ersten Client-Render `null`: Eine Anzeige wie
 * „Heute 10:00 – 20:00" hängt von der Uhrzeit ab, und Server und Browser
 * kämen sonst zu verschiedenen Ergebnissen — React meldet dann einen
 * Hydration-Fehler. Wer `null` bekommt, zeigt die zeitunabhängige Fassung.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
  }, [])
  return now
}
