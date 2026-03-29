import { apiClient } from './api'

const DRAFT_KEY = 'syp_event_draft'
const DRAFTS_LIST_KEY = 'syp_event_drafts_list'
const SYNC_ENABLED_KEY = 'syp_drafts_sync_enabled'

export interface EventDraft {
  id: string
  step: number
  formData: {
    stepOne?: Record<string, unknown>
    stepTwo?: Record<string, unknown>
    images?: { url?: string; uri?: string }[]
    dropdownStates?: Record<string, unknown>
    dateTime?: {
      date: Date | string
      from: Date | string
      to: Date | string
    }
    selectedLocation?: {
      description?: string
      location?: { lat: number; lng: number }
    }
  }
  timestamp: number
  lastModified: number
}

export interface DraftMetadata {
  id: string
  name?: string
  category?: string
  location?: string
  timestamp: number
  lastModified: number
  step: number
}

/**
 * Check if cloud sync is enabled
 */
const isSyncEnabled = (): boolean => {
  try {
    const enabled = localStorage.getItem(SYNC_ENABLED_KEY)
    return enabled === 'true'
  } catch {
    return false
  }
}

/**
 * Enable/Disable cloud sync
 */
export const setSyncEnabled = (enabled: boolean): void => {
  localStorage.setItem(SYNC_ENABLED_KEY, enabled.toString())
}

/**
 * Transform EventDraft to backend format
 */
const transformDraftToBackend = (draft: EventDraft) => {
  return {
    partyType: draft.formData.stepOne?.partyType,
    totalTickets: draft.formData.stepTwo?.totalTickets,
    musicType: draft.formData.stepOne?.musicType,
    offerings: draft.formData.stepOne?.offerings,
    category: draft.formData.stepOne?.category,
    name: draft.formData.stepTwo?.name,
    description: draft.formData.stepTwo?.description,
    restrictions: draft.formData.stepTwo?.restrictions,
    price: draft.formData.stepTwo?.price,
    locationName: draft.formData.selectedLocation?.description,
    location: draft.formData.selectedLocation?.location,
    eventDate:
      draft.formData.dateTime?.date instanceof Date
        ? draft.formData.dateTime.date.toISOString()
        : draft.formData.dateTime?.date,
    eventStartTime:
      draft.formData.dateTime?.from instanceof Date
        ? draft.formData.dateTime.from.toISOString()
        : draft.formData.dateTime?.from,
    eventEndTime:
      draft.formData.dateTime?.to instanceof Date
        ? draft.formData.dateTime.to.toISOString()
        : draft.formData.dateTime?.to,
    minimumAge: draft.formData.stepTwo?.minimumAge,
    files: draft.formData.images?.map((img) => img.url || img.uri),
  }
}

/**
 * Transform backend draft to EventDraft format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformBackendToDraft = (backendDraft: any): EventDraft => {
  return {
    id: backendDraft._id || backendDraft.id,
    step: 2,
    timestamp: new Date(backendDraft.createdAt || Date.now()).getTime(),
    lastModified: new Date(
      backendDraft.lastModified || backendDraft.updatedAt || Date.now()
    ).getTime(),
    formData: {
      stepOne: {
        partyType: backendDraft.partyType,
        musicType: backendDraft.musicType,
        offerings: backendDraft.offerings,
        category: backendDraft.category,
      },
      stepTwo: {
        name: backendDraft.name,
        description: backendDraft.description,
        restrictions: backendDraft.restrictions,
        price: backendDraft.price,
        totalTickets: backendDraft.totalTickets,
        minimumAge: backendDraft.minimumAge,
      },
      images: backendDraft.files?.map((url: string) => ({ url })) || [],
      selectedLocation: {
        description: backendDraft.locationName,
        location: backendDraft.location,
      },
      dateTime: {
        date: backendDraft.eventDate
          ? new Date(backendDraft.eventDate)
          : new Date(),
        from: backendDraft.eventStartTime
          ? new Date(backendDraft.eventStartTime)
          : new Date(),
        to: backendDraft.eventEndTime
          ? new Date(backendDraft.eventEndTime)
          : new Date(),
      },
    },
  }
}

/**
 * Save current event draft (with cloud sync)
 */
export const saveEventDraft = async (
  draft: Omit<EventDraft, 'id' | 'timestamp' | 'lastModified'>
): Promise<string> => {
  try {
    const draftId = `draft_${Date.now()}`
    const completeDraft: EventDraft = {
      id: draftId,
      timestamp: Date.now(),
      lastModified: Date.now(),
      ...draft,
    }

    // Save locally first
    localStorage.setItem(DRAFT_KEY, JSON.stringify(completeDraft))

    // Sync to cloud if enabled
    if (isSyncEnabled()) {
      try {
        const backendData = transformDraftToBackend(completeDraft)
        const response = await apiClient.post('/events/drafts', backendData)
        const cloudDraftId = response.data.data._id || response.data.data.id

        // Update local draft with cloud ID
        completeDraft.id = cloudDraftId
        localStorage.setItem(DRAFT_KEY, JSON.stringify(completeDraft))
      } catch (cloudError) {
        console.warn('Cloud sync failed, keeping local draft:', cloudError)
      }
    }

    // Update drafts list metadata
    const metadata: DraftMetadata = {
      id: completeDraft.id,
      name: draft.formData.stepTwo?.name as string | undefined,
      category: draft.formData.stepOne?.category as string | undefined,
      location: draft.formData.selectedLocation?.description,
      timestamp: completeDraft.timestamp,
      lastModified: completeDraft.lastModified,
      step: draft.step,
    }

    await addDraftToList(metadata)

    return completeDraft.id
  } catch (error) {
    console.error('Error saving draft:', error)
    throw error
  }
}

/**
 * Update existing draft (with cloud sync)
 */
export const updateEventDraft = async (
  draftId: string,
  draft: Omit<EventDraft, 'id' | 'timestamp' | 'lastModified'>
): Promise<void> => {
  try {
    // Get existing timestamp
    const existingDraft = await getEventDraft()
    const timestamp = existingDraft?.timestamp || Date.now()

    const updatedDraft: EventDraft = {
      id: draftId,
      timestamp,
      lastModified: Date.now(),
      ...draft,
    }

    // Save locally
    localStorage.setItem(DRAFT_KEY, JSON.stringify(updatedDraft))

    // Sync to cloud if enabled
    if (isSyncEnabled()) {
      try {
        const backendData = transformDraftToBackend(updatedDraft)
        await apiClient.patch(`/events/drafts/${draftId}`, backendData)
      } catch (cloudError) {
        console.warn('Cloud sync failed, keeping local draft:', cloudError)
      }
    }

    // Update metadata in list
    const metadata: DraftMetadata = {
      id: draftId,
      name: draft.formData.stepTwo?.name as string | undefined,
      category: draft.formData.stepOne?.category as string | undefined,
      location: draft.formData.selectedLocation?.description,
      timestamp,
      lastModified: updatedDraft.lastModified,
      step: draft.step,
    }

    await updateDraftInList(metadata)
  } catch (error) {
    console.error('Error updating draft:', error)
    throw error
  }
}

/**
 * Get current event draft (with cloud sync)
 */
export const getEventDraft = async (): Promise<EventDraft | null> => {
  try {
    const draftJson = localStorage.getItem(DRAFT_KEY)
    const localDraft = draftJson ? JSON.parse(draftJson) : null

    // Try to fetch from cloud if sync enabled
    if (isSyncEnabled()) {
      try {
        const response = await apiClient.get('/events/drafts')
        const cloudDrafts = response.data?.data || []

        if (cloudDrafts.length > 0) {
          // Get the most recent cloud draft
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const [mostRecentCloud] = cloudDrafts.sort((a: any, b: any) => {
            const aTime = new Date(a.lastModified || a.updatedAt).getTime()
            const bTime = new Date(b.lastModified || b.updatedAt).getTime()
            return bTime - aTime
          })

          const cloudDraft = transformBackendToDraft(mostRecentCloud)

          // Compare timestamps and use newer version
          if (!localDraft || cloudDraft.lastModified > localDraft.lastModified) {
            // Save cloud draft locally for offline access
            localStorage.setItem(DRAFT_KEY, JSON.stringify(cloudDraft))
            return cloudDraft
          }
        }
      } catch (cloudError) {
        console.warn('Cloud fetch failed, using local draft:', cloudError)
      }
    }

    if (!localDraft) return null

    // Convert date strings back to Date objects
    if (localDraft.formData?.dateTime) {
      localDraft.formData.dateTime = {
        date: new Date(localDraft.formData.dateTime.date),
        from: new Date(localDraft.formData.dateTime.from),
        to: new Date(localDraft.formData.dateTime.to),
      }
    }

    return localDraft
  } catch (error) {
    console.error('Error loading draft:', error)
    return null
  }
}

/**
 * Delete current draft (with cloud sync)
 */
export const deleteEventDraft = async (draftId?: string): Promise<void> => {
  try {
    localStorage.removeItem(DRAFT_KEY)

    if (draftId) {
      // Sync deletion to cloud if enabled
      if (isSyncEnabled()) {
        try {
          await apiClient.delete(`/events/drafts/${draftId}`)
        } catch (cloudError) {
          console.warn('Cloud deletion failed:', cloudError)
        }
      }

      await removeDraftFromList(draftId)
    }
  } catch (error) {
    console.error('Error deleting draft:', error)
    throw error
  }
}

/**
 * Check if draft exists
 */
export const hasDraft = (): boolean => {
  try {
    const draft = localStorage.getItem(DRAFT_KEY)
    return draft !== null
  } catch {
    return false
  }
}

/**
 * Add draft metadata to list
 */
const addDraftToList = async (metadata: DraftMetadata): Promise<void> => {
  try {
    const listJson = localStorage.getItem(DRAFTS_LIST_KEY)
    const list: DraftMetadata[] = listJson ? JSON.parse(listJson) : []

    // Remove existing draft with same ID
    const filteredList = list.filter((d) => d.id !== metadata.id)

    // Add new draft
    filteredList.push(metadata)

    localStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(filteredList))
  } catch (error) {
    console.error('Error adding draft to list:', error)
  }
}

/**
 * Update draft metadata in list
 */
const updateDraftInList = async (metadata: DraftMetadata): Promise<void> => {
  try {
    const listJson = localStorage.getItem(DRAFTS_LIST_KEY)
    const list: DraftMetadata[] = listJson ? JSON.parse(listJson) : []

    const index = list.findIndex((d) => d.id === metadata.id)
    if (index !== -1) {
      list[index] = metadata
    } else {
      list.push(metadata)
    }

    localStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(list))
  } catch (error) {
    console.error('Error updating draft in list:', error)
  }
}

/**
 * Remove draft from list
 */
const removeDraftFromList = async (draftId: string): Promise<void> => {
  try {
    const listJson = localStorage.getItem(DRAFTS_LIST_KEY)
    const list: DraftMetadata[] = listJson ? JSON.parse(listJson) : []

    const filteredList = list.filter((d) => d.id !== draftId)

    localStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(filteredList))
  } catch (error) {
    console.error('Error removing draft from list:', error)
  }
}

/**
 * Get all drafts metadata (with cloud sync)
 */
export const getAllDrafts = async (): Promise<DraftMetadata[]> => {
  try {
    const listJson = localStorage.getItem(DRAFTS_LIST_KEY)
    const localList: DraftMetadata[] = listJson ? JSON.parse(listJson) : []

    // Merge with cloud drafts if sync enabled
    if (isSyncEnabled()) {
      try {
        const response = await apiClient.get('/events/drafts')
        const cloudDrafts = response.data?.data || []

        // Transform cloud drafts to metadata format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cloudMetadata: DraftMetadata[] = cloudDrafts.map((draft: any) => ({
          id: draft._id || draft.id,
          name: draft.name || 'Entwurf ohne Titel',
          lastModified: new Date(
            draft.lastModified || draft.updatedAt || Date.now()
          ).getTime(),
          step: 2,
          timestamp: new Date(draft.createdAt || Date.now()).getTime(),
        }))

        // Merge local and cloud, preferring newer version by ID
        const mergedMap = new Map<string, DraftMetadata>()

        localList.forEach((draft) => mergedMap.set(draft.id, draft))

        cloudMetadata.forEach((draft) => {
          const existing = mergedMap.get(draft.id)
          if (!existing || draft.lastModified > existing.lastModified) {
            mergedMap.set(draft.id, draft)
          }
        })

        const merged = Array.from(mergedMap.values())

        // Sort by last modified (newest first)
        return merged.sort((a, b) => b.lastModified - a.lastModified)
      } catch (cloudError) {
        console.warn('Cloud fetch failed, using local only:', cloudError)
      }
    }

    // Sort by last modified (newest first)
    return localList.sort((a, b) => b.lastModified - a.lastModified)
  } catch (error) {
    console.error('Error getting all drafts:', error)
    return []
  }
}

/**
 * Clear all drafts
 */
export const clearAllDrafts = (): void => {
  try {
    localStorage.removeItem(DRAFT_KEY)
    localStorage.removeItem(DRAFTS_LIST_KEY)
  } catch (error) {
    console.error('Error clearing all drafts:', error)
    throw error
  }
}
