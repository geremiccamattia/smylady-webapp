'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, X, Navigation, Loader2, Search, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  getCurrentLocation,
  isLiveLocationEnabled,
  setLiveLocationEnabled,
  saveManualLocation,
  getManualLocation,
  saveManualLocations,
  clearManualLocations,
} from '@/services/location'
import { useToast } from '@/hooks/use-toast'

export interface LocationResult {
  place_id: string
  description: string
  lat: number
  lng: number
}

interface LocationModalProps {
  open: boolean
  onClose: () => void
  onSelect: (location: LocationResult | null) => void
  initialLocation?: LocationResult | null
  /**
   * Mehrfachauswahl (Explore-Seite): Städte werden per Klick an- und
   * abgewählt, das Ergebnis kommt über onSelectMany.
   */
  multiple?: boolean
  initialLocations?: LocationResult[]
  onSelectMany?: (locations: LocationResult[]) => void
}

/** Obergrenze der Mehrfachauswahl — jede Stadt kostet eigene Abfragen (u. a. Ticketmaster). */
export const MAX_LOCATIONS = 5

// Predefined locations for quick selection
const POPULAR_LOCATIONS: LocationResult[] = [
  { place_id: 'vienna', description: 'Wien, Österreich', lat: 48.2082, lng: 16.3738 },
  { place_id: 'berlin', description: 'Berlin, Deutschland', lat: 52.52, lng: 13.405 },
  { place_id: 'munich', description: 'München, Deutschland', lat: 48.1351, lng: 11.582 },
  { place_id: 'zurich', description: 'Zürich, Schweiz', lat: 47.3769, lng: 8.5417 },
  { place_id: 'hamburg', description: 'Hamburg, Deutschland', lat: 53.5511, lng: 9.9937 },
  { place_id: 'frankfurt', description: 'Frankfurt, Deutschland', lat: 50.1109, lng: 8.6821 },
  { place_id: 'cologne', description: 'Köln, Deutschland', lat: 50.9375, lng: 6.9603 },
  { place_id: 'salzburg', description: 'Salzburg, Österreich', lat: 47.8095, lng: 13.055 },
  { place_id: 'graz', description: 'Graz, Österreich', lat: 47.0707, lng: 15.4395 },
]

/** Gleicher Ort: gleiche place_id oder gleiche Koordinaten (gespeicherte Orte heißen sonst „saved"). */
const isSameLocation = (a: LocationResult, b: LocationResult) =>
  a.place_id === b.place_id || (a.lat === b.lat && a.lng === b.lng)

export function LocationModal({
  open,
  onClose,
  onSelect,
  initialLocation,
  multiple = false,
  initialLocations,
  onSelectMany,
}: LocationModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(initialLocation || null)
  const [selectedLocations, setSelectedLocations] = useState<LocationResult[]>(initialLocations || [])
  const [liveLocation, setLiveLocation] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [filteredLocations, setFilteredLocations] = useState(POPULAR_LOCATIONS)

  // Load initial state
  useEffect(() => {
    if (open) {
      setLiveLocation(isLiveLocationEnabled())
      if (multiple) {
        setSelectedLocations(initialLocations || [])
        return
      }
      const saved = getManualLocation()
      if (saved && !initialLocation) {
        setSelectedLocation({
          place_id: 'saved',
          description: saved.description,
          lat: saved.lat,
          lng: saved.lng,
        })
      } else if (initialLocation) {
        setSelectedLocation(initialLocation)
      }
    }
  }, [open, initialLocation, initialLocations, multiple])

  // Filter locations based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = POPULAR_LOCATIONS.filter(loc =>
        loc.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLocations(filtered)
    } else {
      setFilteredLocations(POPULAR_LOCATIONS)
    }
  }, [searchQuery])

  const showLimitToast = useCallback(() => {
    toast({
      variant: 'destructive',
      title: t('location.maxReached', {
        max: MAX_LOCATIONS,
        defaultValue: 'Du kannst höchstens {{max}} Standorte auswählen.',
      }),
    })
  }, [toast, t])

  /** Ort übernehmen: im Mehrfachmodus anhängen (GPS-Ort ersetzt den alten), sonst ersetzen. */
  const applyLocation = useCallback((location: LocationResult) => {
    if (!multiple) {
      setSelectedLocation(location)
      return
    }
    const rest = selectedLocations.filter((l) => !isSameLocation(l, location))
    if (rest.length >= MAX_LOCATIONS) {
      showLimitToast()
      return
    }
    setSelectedLocations([...rest, location])
  }, [multiple, selectedLocations, showLimitToast])

  const handleDetectLocation = useCallback(async () => {
    setIsDetecting(true)
    try {
      const result = await getCurrentLocation()
      const location: LocationResult = {
        place_id: 'current',
        description: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
        lat: result.latitude,
        lng: result.longitude,
      }
      applyLocation(location)
      toast({
        title: t('location.detected', { defaultValue: 'Standort erkannt' }),
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('location.error', { defaultValue: 'Standort konnte nicht erkannt werden' }),
        description: t('location.enablePermission', { defaultValue: 'Bitte erlaube den Standortzugriff in deinem Browser.' }),
      })
    } finally {
      setIsDetecting(false)
    }
  }, [toast, t, applyLocation])

  const handleLiveLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      setIsDetecting(true)
      try {
        const result = await getCurrentLocation()
        const location: LocationResult = {
          place_id: 'current',
          description: `Aktueller Standort (${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)})`,
          lat: result.latitude,
          lng: result.longitude,
        }
        applyLocation(location)
        setLiveLocationEnabled(true)
        setLiveLocation(true)
        toast({
          title: t('location.liveEnabled', { defaultValue: 'Live-Standort aktiviert' }),
        })
      } catch (error) {
        toast({
          variant: 'destructive',
          title: t('location.error', { defaultValue: 'Standort konnte nicht erkannt werden' }),
        })
        setLiveLocation(false)
      } finally {
        setIsDetecting(false)
      }
    } else {
      setLiveLocationEnabled(false)
      setLiveLocation(false)
    }
  }

  const handleSelect = () => {
    if (multiple) {
      saveManualLocations(selectedLocations)
      onSelectMany?.(selectedLocations)
      onClose()
      return
    }
    if (selectedLocation) {
      // Save as manual location
      saveManualLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        description: selectedLocation.description,
      })
    }
    onSelect(selectedLocation)
    onClose()
  }

  const handleClear = () => {
    if (multiple) {
      setSelectedLocations([])
      clearManualLocations()
      onSelectMany?.([])
      onClose()
      return
    }
    setSelectedLocation(null)
    onSelect(null)
    onClose()
  }

  const isSelected = (location: LocationResult) =>
    multiple
      ? selectedLocations.some((l) => isSameLocation(l, location))
      : selectedLocation?.place_id === location.place_id

  const handleLocationClick = (location: LocationResult) => {
    if (multiple && isSelected(location)) {
      setSelectedLocations((prev) => prev.filter((l) => !isSameLocation(l, location)))
      return
    }
    applyLocation(location)
  }

  const canSubmit = multiple ? selectedLocations.length > 0 : !!selectedLocation

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {multiple
              ? t('location.selectLocations', { defaultValue: 'Standorte wählen' })
              : t('location.selectLocation', { defaultValue: 'Standort wählen' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live Location Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Navigation className={`h-5 w-5 ${liveLocation ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <Label className="font-medium">
                  {t('location.liveLocation', { defaultValue: 'Live-Standort' })}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('location.liveLocationDesc', { defaultValue: 'Automatisch deinen aktuellen Standort verwenden' })}
                </p>
              </div>
            </div>
            <Switch
              checked={liveLocation}
              onCheckedChange={handleLiveLocationToggle}
              disabled={isDetecting}
            />
          </div>

          {/* Detect Current Location Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleDetectLocation}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {t('location.detectCurrent', { defaultValue: 'Aktuellen Standort erkennen' })}
          </Button>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('location.searchPlaceholder', { defaultValue: 'Stadt suchen...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Location Display */}
          {multiple ? (
            selectedLocations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedLocations.map((location) => (
                  <span
                    key={`${location.place_id}-${location.lat}-${location.lng}`}
                    className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {location.description}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedLocations((prev) => prev.filter((l) => !isSameLocation(l, location)))
                      }
                      className="p-1 rounded-full hover:bg-primary/20"
                      aria-label={t('location.remove', { defaultValue: 'Entfernen' })}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('location.multiHint', {
                  max: MAX_LOCATIONS,
                  defaultValue: 'Wähle eine oder mehrere Städte (bis zu {{max}}).',
                })}
              </p>
            )
          ) : (
            selectedLocation && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">{selectedLocation.description}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedLocation(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          )}

          {/* Popular Locations */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              {searchQuery
                ? t('location.searchResults', { defaultValue: 'Suchergebnisse' })
                : t('location.popularLocations', { defaultValue: 'Beliebte Städte' })}
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
              {filteredLocations.map((location) => (
                <button
                  key={location.place_id}
                  onClick={() => handleLocationClick(location)}
                  aria-pressed={multiple ? isSelected(location) : undefined}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    isSelected(location)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {multiple && isSelected(location) ? (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">{location.description}</span>
                  </div>
                </button>
              ))}
              {filteredLocations.length === 0 && (
                <p className="col-span-2 text-center text-muted-foreground py-4">
                  {t('location.noResults', { defaultValue: 'Keine Ergebnisse gefunden' })}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClear}>
              {t('common.clear', { defaultValue: 'Zurücksetzen' })}
            </Button>
            <Button className="flex-1" onClick={handleSelect} disabled={!canSubmit}>
              {t('common.select', { defaultValue: 'Auswählen' })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LocationModal
