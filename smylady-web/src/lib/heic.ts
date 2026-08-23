'use client'

/**
 * Erkennt HEIC/HEIF-Dateien anhand der Magic Bytes (ISO-BMFF "ftyp"-Box),
 * NICHT anhand von Dateiendung oder file.type.
 *
 * Grund: Bei iOS-Uploads sind beide unzuverlässig — Safari liefert je nach
 * Einstellung ("Größte Kompatibilität" vs. "Original") mal "image/heic",
 * mal einen leeren MIME-Type, und Nutzer können Dateien beliebig umbenennen.
 *
 * Layout der ersten 16 Byte einer ISO-BMFF-Datei (HEIC/HEIF, aber auch
 * MP4/MOV nutzen dasselbe Containerformat):
 *   Byte  0- 3: Box-Größe (uint32, hier irrelevant)
 *   Byte  4- 7: Box-Typ = ASCII "ftyp"
 *   Byte  8-11: Major Brand (4 ASCII-Zeichen) — bei HEIC/HEIF u.a.
 *               "heic", "heix", "mif1", "msf1", "hevc"
 *   Byte 12-15: Minor Version (hier irrelevant)
 */
const HEIC_BRANDS = ['heic', 'heix', 'mif1', 'msf1', 'hevc']

// File erbt von Blob — dieselbe Prüfung funktioniert daher auch auf einem
// Blob, den wir per fetch() aus einer eigenen blob:-URL zurückgelesen haben.
export async function isHeicFile(file: File | Blob): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    if (bytes.length < 12) return false

    const ascii = (offset: number, length: number) =>
      String.fromCharCode(...bytes.subarray(offset, offset + length))

    if (ascii(4, 4) !== 'ftyp') return false

    const majorBrand = ascii(8, 4).toLowerCase()
    return HEIC_BRANDS.includes(majorBrand)
  } catch {
    // Datei nicht lesbar — kein HEIC, der eigentliche Fehler zeigt sich an
    // anderer Stelle (z.B. beim Erzeugen der Objekt-URL).
    return false
  }
}
