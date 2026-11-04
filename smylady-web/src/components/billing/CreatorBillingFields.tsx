'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BILLING_LIMITS,
  BILLING_OTHER_COUNTRIES,
  BILLING_PRIMARY_COUNTRIES,
  type CreatorBilling,
  type CreatorBillingInput,
} from '@/services/billing'

/*
 * Die Felder der Abrechnungsdaten eines Creators — einmal gebaut für das
 * Creator-Profil (eigener Speichern-Knopf, PUT /creators/me/billing) und
 * die Bewerbung (als `billing` im POST /influencer/apply).
 *
 * Die Daten stehen auf dem Auszahlungsbeleg, den Share Your Party mit der
 * Auszahlung schickt: Name und Anschrift, freiwillig UID und Steuernummer
 * zum Aufdrucken. Keine Steuerlogik — für seine Steuern ist der Creator
 * selbst verantwortlich.
 */

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

/** Formularzustand: Strings statt optionaler Felder. */
export interface BillingFormValues {
  legalName: string
  companyName: string
  street: string
  postalCode: string
  city: string
  country: string
  vatId: string
  taxNumber: string
}

export function emptyBillingForm(prefill: Partial<BillingFormValues> = {}): BillingFormValues {
  return {
    legalName: '',
    companyName: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'AT',
    vatId: '',
    taxNumber: '',
    ...prefill,
  }
}

export function billingFormFromBilling(billing: CreatorBilling | null): BillingFormValues {
  if (!billing) return emptyBillingForm()
  return {
    legalName: billing.legalName,
    companyName: billing.companyName ?? '',
    street: billing.street,
    postalCode: billing.postalCode,
    city: billing.city,
    country: billing.country || 'AT',
    vatId: billing.vatId ?? '',
    taxNumber: billing.taxNumber ?? '',
  }
}

/** Was ans Backend geht; leere freiwillige Felder bleiben weg. */
export function toBillingPayload(values: BillingFormValues): CreatorBillingInput {
  const companyName = values.companyName.trim()
  const vatId = values.vatId.trim()
  const taxNumber = values.taxNumber.trim()
  return {
    legalName: values.legalName.trim(),
    ...(companyName ? { companyName } : {}),
    street: values.street.trim(),
    postalCode: values.postalCode.trim(),
    city: values.city.trim(),
    country: values.country.trim().toUpperCase(),
    ...(vatId ? { vatId } : {}),
    ...(taxNumber ? { taxNumber } : {}),
  }
}

/** Prüft die Eingaben im Client; '' heisst: alles in Ordnung. */
export function useBillingValidation(): (values: BillingFormValues) => string {
  const { t } = useTranslation()
  return (values) => {
    const required = [values.legalName, values.street, values.postalCode, values.city, values.country]
    if (required.some((value) => !value.trim())) {
      return t('billing.validateRequired', { defaultValue: 'Bitte fülle alle Pflichtfelder der Abrechnungsdaten aus.' })
    }
    const tooLong = (Object.keys(BILLING_LIMITS) as Array<keyof typeof BILLING_LIMITS>).find(
      (key) => values[key].trim().length > BILLING_LIMITS[key],
    )
    if (tooLong) {
      return t('billing.validateTooLong', { defaultValue: 'Eine Angabe in den Abrechnungsdaten ist zu lang.' })
    }
    return ''
  }
}

/** Ländername in der Sprache der App; ohne Intl.DisplayNames der Code. */
function useCountryName(): (code: string) => string {
  const { i18n } = useTranslation()
  const language = i18n.language?.startsWith('en') ? 'en' : 'de'
  return useMemo(() => {
    let names: Intl.DisplayNames | null = null
    try {
      names = new Intl.DisplayNames([language], { type: 'region' })
    } catch {
      names = null
    }
    return (code: string) => {
      try {
        return names?.of(code) ?? code
      } catch {
        return code
      }
    }
  }, [language])
}

/** Feldnamen aus `missing` (GET /creators/me/billing) als Beschriftung. */
export function useBillingFieldLabel(): (field: string) => string {
  const { t } = useTranslation()
  return (field) => {
    switch (field) {
      case 'legalName':
        return t('billing.fieldLegalName', { defaultValue: 'Name bzw. Firmenwortlaut' })
      case 'companyName':
        return t('billing.fieldCompanyName', { defaultValue: 'Zusatz (z. B. Firmenname)' })
      case 'street':
        return t('billing.fieldStreet', { defaultValue: 'Straße und Hausnummer' })
      case 'postalCode':
        return t('billing.fieldPostalCode', { defaultValue: 'PLZ' })
      case 'city':
        return t('billing.fieldCity', { defaultValue: 'Ort' })
      case 'country':
        return t('billing.fieldCountry', { defaultValue: 'Land' })
      case 'vatId':
        return t('billing.fieldVatId', { defaultValue: 'UID' })
      case 'taxNumber':
        return t('billing.fieldTaxNumber', { defaultValue: 'Steuernummer' })
      default:
        return field
    }
  }
}

interface CreatorBillingFieldsProps {
  value: BillingFormValues
  onChange: (next: BillingFormValues) => void
  /** Eindeutige IDs, falls die Felder zweimal auf einer Seite stehen. */
  idPrefix?: string
  disabled?: boolean
}

export function CreatorBillingFields({ value, onChange, idPrefix = 'billing', disabled = false }: CreatorBillingFieldsProps) {
  const { t } = useTranslation()
  const label = useBillingFieldLabel()
  const countryName = useCountryName()
  const id = (field: string) => `${idPrefix}-${field}`
  const set = <K extends keyof BillingFormValues>(field: K, next: BillingFormValues[K]) => onChange({ ...value, [field]: next })

  // Die drei Hauptländer oben, die übrigen EU-Länder alphabetisch nach Namen.
  const otherCountries = useMemo(
    () => [...BILLING_OTHER_COUNTRIES].map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name)),
    [countryName],
  )
  // Ein gespeichertes Land ausserhalb der Liste bleibt wählbar.
  const knownCountry =
    (BILLING_PRIMARY_COUNTRIES as readonly string[]).includes(value.country) ||
    (BILLING_OTHER_COUNTRIES as readonly string[]).includes(value.country)

  const required = <span aria-hidden="true"> *</span>
  const optional = (
    <span className="font-normal text-muted-foreground">{t('billing.optional', { defaultValue: '(optional)' })}</span>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor={id('legalName')}>
            {label('legalName')}
            {required}
          </Label>
          <Input
            id={id('legalName')}
            value={value.legalName}
            maxLength={BILLING_LIMITS.legalName}
            autoComplete="name"
            disabled={disabled}
            onChange={(e) => set('legalName', e.target.value)}
            placeholder={t('billing.fieldLegalNamePlaceholder', { defaultValue: 'Vor- und Nachname oder Firmenwortlaut' })}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor={id('companyName')}>
            {label('companyName')} {optional}
          </Label>
          <Input
            id={id('companyName')}
            value={value.companyName}
            maxLength={BILLING_LIMITS.companyName}
            autoComplete="organization"
            disabled={disabled}
            onChange={(e) => set('companyName', e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor={id('street')}>
            {label('street')}
            {required}
          </Label>
          <Input
            id={id('street')}
            value={value.street}
            maxLength={BILLING_LIMITS.street}
            autoComplete="street-address"
            disabled={disabled}
            onChange={(e) => set('street', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id('postalCode')}>
            {label('postalCode')}
            {required}
          </Label>
          <Input
            id={id('postalCode')}
            value={value.postalCode}
            maxLength={BILLING_LIMITS.postalCode}
            autoComplete="postal-code"
            disabled={disabled}
            onChange={(e) => set('postalCode', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id('city')}>
            {label('city')}
            {required}
          </Label>
          <Input
            id={id('city')}
            value={value.city}
            maxLength={BILLING_LIMITS.city}
            autoComplete="address-level2"
            disabled={disabled}
            onChange={(e) => set('city', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id('country')}>
            {label('country')}
            {required}
          </Label>
          <select
            id={id('country')}
            className={SELECT_CLASS}
            value={value.country}
            disabled={disabled}
            onChange={(e) => set('country', e.target.value)}
          >
            {BILLING_PRIMARY_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
            <option disabled>──────────</option>
            {otherCountries.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
            {!knownCountry && value.country && <option value={value.country}>{countryName(value.country)}</option>}
          </select>
        </div>
      </div>

      {/* UID und Steuernummer: freiwillig, nur zum Aufdrucken — keine Formatprüfung. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={id('vatId')}>
            {label('vatId')} {optional}
          </Label>
          <Input
            id={id('vatId')}
            value={value.vatId}
            maxLength={BILLING_LIMITS.vatId}
            disabled={disabled}
            onChange={(e) => set('vatId', e.target.value)}
            placeholder={t('billing.fieldVatIdPlaceholder', { defaultValue: 'z. B. ATU12345678' })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id('taxNumber')}>
            {label('taxNumber')} {optional}
          </Label>
          <Input
            id={id('taxNumber')}
            value={value.taxNumber}
            maxLength={BILLING_LIMITS.taxNumber}
            disabled={disabled}
            onChange={(e) => set('taxNumber', e.target.value)}
          />
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        {t('billing.selfResponsibilityHint', {
          defaultValue: 'Diese Angaben stehen auf deinem Auszahlungsbeleg. Für deine Steuern bist du selbst verantwortlich.',
        })}
      </p>
    </div>
  )
}
