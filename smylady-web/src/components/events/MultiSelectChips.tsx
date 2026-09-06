'use client'

import { Check } from 'lucide-react'

/**
 * Mehrfachauswahl als antippbare Chips.
 *
 * Gemeinsam genutzt von CreateEvent und EditEvent für Musikrichtung und Angebot,
 * seit das Backend dort Arrays erwartet. Chips statt eines Mehrfach-<select>:
 * Letzteres verlangt auf dem Desktop Strg-Klick und ist auf dem Handy kaum
 * bedienbar — die Formulare werden aber überwiegend mobil ausgefüllt.
 */

interface MultiSelectChipsProps {
  options: readonly { value: string; label: string }[]
  value: string[]
  onChange: (next: string[]) => void
  /** Für die Verknüpfung mit dem <Label> der umgebenden Gruppe. */
  id?: string
}

export function MultiSelectChips({ options, value, onChange, id }: MultiSelectChipsProps) {
  const toggle = (option: string) => {
    onChange(
      value.includes(option) ? value.filter((v) => v !== option) : [...value, option],
    )
  }

  return (
    <div id={id} className="flex flex-wrap gap-2" role="group">
      {options.map((option) => {
        const selected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors ${
              selected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-muted hover:border-primary/50'
            }`}
          >
            {selected && <Check className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default MultiSelectChips
