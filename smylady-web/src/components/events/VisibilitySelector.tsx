'use client'

import { useTranslation } from 'react-i18next'
import { Globe, Users, UserPlus } from 'lucide-react'

export type EventVisibility = 'public' | 'subscribers' | 'selected'

/**
 * Auswahl der Event-Sichtbarkeit — drei Kacheln mit Radio-Verhalten.
 *
 * Gemeinsam genutzt von CreateEvent und EditEvent. In EditEvent fehlte die
 * Einstellung ganz, wodurch ein einmal als 'selected' angelegtes Event nicht mehr
 * öffentlich gemacht werden konnte, obwohl das Backend visibility im Update
 * akzeptiert.
 */

/**
 * Nur Schlüssel und Vorgabetexte — aufgelöst wird in der Komponente, weil t() hier
 * ausserhalb nicht zur Verfügung steht.
 *
 * „Ausgewählte Abonnenten“ statt des früheren „Ausgewählte Personen“: Der
 * SubscriberPicker bietet ausschliesslich Abonnenten an, eine freie Nutzersuche gibt
 * es nicht. Das alte Label weckte eine Erwartung, die sich erst beim Klick auflöste.
 */
const VISIBILITY_OPTIONS: {
  value: EventVisibility
  labelKey: string
  labelDefault: string
  descKey: string
  descDefault: string
  icon: typeof Globe
}[] = [
  {
    value: 'public',
    labelKey: 'createEvent.visibilityPublic',
    labelDefault: 'Öffentlich',
    descKey: 'createEvent.visibilityPublicDesc',
    descDefault: 'Jeder kann dieses Event sehen.',
    icon: Globe,
  },
  {
    value: 'subscribers',
    labelKey: 'createEvent.visibilitySubscribers',
    labelDefault: 'Nur Abonnenten',
    descKey: 'createEvent.visibilitySubscribersDesc',
    descDefault: 'Nur deine Abonnenten können dieses Event sehen.',
    icon: Users,
  },
  {
    value: 'selected',
    labelKey: 'createEvent.visibilitySelected',
    labelDefault: 'Ausgewählte Abonnenten',
    descKey: 'createEvent.visibilitySelectedDesc',
    descDefault: 'Nur ausgewählte Abonnenten können dieses Event sehen.',
    icon: UserPlus,
  },
]

interface VisibilitySelectorProps {
  value: EventVisibility
  onChange: (next: EventVisibility) => void
}

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {VISIBILITY_OPTIONS.map((option) => (
        <div
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            value === option.value
              ? 'border-primary bg-primary/5'
              : 'border-muted hover:border-primary/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <option.icon
              className={`h-5 w-5 ${
                value === option.value ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                value === option.value ? 'border-primary' : 'border-muted-foreground'
              }`}
            >
              {value === option.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
          </div>
          <p className={`font-medium text-sm ${value === option.value ? 'text-primary' : ''}`}>
            {t(option.labelKey, { defaultValue: option.labelDefault })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t(option.descKey, { defaultValue: option.descDefault })}
          </p>
        </div>
      ))}
    </div>
  )
}

export default VisibilitySelector
