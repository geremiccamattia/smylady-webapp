'use client'

import { apiClient } from './api'

// Helper to get the correct memory URL (supports both old and new field names)
export function getMemoryUrl(memory: Memory): string {
  return memory.url || memory.fileUrl || ''
}

/**
 * Quelle für die Rasteransicht: bevorzugt das Thumbnail, fällt sonst auf das
 * Original zurück. Für die große Einzelansicht weiterhin getMemoryUrl nutzen.
 */
export function getMemoryThumbnailSource(memory: Memory): { url: string; thumbnailUrl?: string | null } {
  return { url: getMemoryUrl(memory), thumbnailUrl: memory.thumbnailUrl }
}

// Helper to get the correct memory type (supports both old and new field names)
export function getMemoryType(memory: Memory): 'image' | 'video' | 'text' {
  return memory.type || memory.fileType || 'image'
}

// Helper to get the correct memory ID (supports both memoryId and _id)
export function getMemoryId(memory: Memory): string {
  return memory.memoryId || memory._id || ''
}

// Helper to get the correct date (supports both uploadedAt and createdAt)
export function getMemoryDate(memory: Memory): string {
  return memory.uploadedAt || memory.createdAt || new Date().toISOString()
}

/**
 * Hat sich an einer geöffneten Memory inhaltlich etwas geändert?
 *
 * Gedacht für die Ansichten, die eine ausgewählte Memory mit frischen
 * Query-Daten abgleichen (MemoryGallery, EventMemories). Dort stand vorher ein
 * Referenzvergleich `fresh !== selected`. Der schlug bei jedem Refetch an, weil
 * das Objekt aus dem Cache nie dasselbe ist wie die lokale Kopie im State —
 * besonders nach einer optimistischen Aktualisierung. Jedes Mal folgte ein
 * überflüssiger setState samt Render.
 *
 * Verglichen wird nur, was sich durch Benutzung ändern kann und sichtbar ist.
 * Verschachtelte Listen gehen über JSON: Das ist hier billig, weil die Prüfung
 * eine einzelne Memory betrifft und nur bei neuen Query-Daten läuft.
 */
export function hasMemoryChanged(current: Memory, incoming: Memory): boolean {
  if (current === incoming) return false

  if (
    current.caption !== incoming.caption ||
    current.text !== incoming.text ||
    current.privacy !== incoming.privacy ||
    isMemoryHighlighted(current) !== isMemoryHighlighted(incoming) ||
    getMemoryUrl(current) !== getMemoryUrl(incoming)
  ) {
    return true
  }

  const serialize = (value: unknown) => JSON.stringify(value ?? null)
  return (
    serialize(current.reactions) !== serialize(incoming.reactions) ||
    serialize(current.comments) !== serialize(incoming.comments)
  )
}

// Helper to check if memory is highlighted (supports both isHighlighted and isHighlight)
export function isMemoryHighlighted(memory: Memory): boolean {
  return memory.isHighlighted || memory.isHighlight || false
}

export interface UploaderInfo {
  _id: string
  /*
   * Fehlt, wenn der Endpunkt uploadedBy nicht befüllt hat.
   *
   * Vorher stand hier `name: string`, und der Objekt-Zweig unten reichte ein
   * unvollständiges Objekt unverändert durch — der Typ behauptete also einen
   * Namen, den es zur Laufzeit nicht gab. Aufrufer rendern den Wert ungeprüft,
   * und ein `undefined` fällt im JSX lautlos weg. Optional zwingt dazu, einen
   * Ersatz zu wählen.
   */
  name?: string
  username?: string
  profileImage?: string
}

/** Nur die Felder, die zum Auflösen eines Uploaders nötig sind. */
export interface UploaderCandidate {
  _id: string
  name?: string
  username?: string
  profileImage?: string
}

// Helper to get uploadedBy user info (handles both object and string/ObjectId cases)
export function getUploadedByInfo(memory: Memory): UploaderInfo {
  const uploadedBy = memory.uploadedBy

  // If it's already an object with _id
  if (typeof uploadedBy === 'object' && uploadedBy !== null && uploadedBy._id) {
    return uploadedBy
  }

  // If it's a string (ObjectId), return minimal info
  if (typeof uploadedBy === 'string') {
    return { _id: uploadedBy }
  }

  // Fallback
  return { _id: '' }
}

/**
 * Uploader einer Memory samt Name und Bild — notfalls über die Teilnehmerliste.
 *
 * Der öffentliche Endpunkt GET /events/:eventId/memories liefert `uploadedBy`
 * nur mit `_id`, ohne Name und Bild. Die Teilnehmerliste desselben Events
 * (GET /tickets/event/:eventId/participants) kennt beides, also wird von dort
 * nachgeschlagen, statt eine weitere Abfrage je Memory zu starten. Dasselbe
 * Vorgehen nutzt das Reaktions-Modal im MemoryViewer schon länger.
 *
 * `name` kann weiterhin fehlen, wenn auch die Teilnehmerliste nichts hergibt
 * — etwa bei einem gelöschten Konto. Die Anzeigestelle setzt dann einen
 * übersetzten Platzhalter; dieser Service bleibt frei von Textkonstanten.
 */
export function resolveUploader(
  memory: Memory,
  participants: ReadonlyArray<UploaderCandidate> = [],
): UploaderInfo {
  const info = getUploadedByInfo(memory)
  if (info.name) return info
  if (!info._id) return info

  const participant = participants.find(candidate => candidate._id === info._id)
  if (!participant) return info

  return {
    ...info,
    name: participant.name,
    username: info.username ?? participant.username,
    profileImage: info.profileImage ?? participant.profileImage,
  }
}

export interface ReactionSummary {
  /** Verschiedene Emojis, häufigste zuerst, höchstens so viele wie `limit`. */
  topEmojis: string[]
  /**
   * Wie viele VERSCHIEDENE Emojis insgesamt vorkommen — auch über `limit`
   * hinaus. Daran entscheidet die Anzeige, ob sie Bubbles zeigt: Bei nur einer
   * Emoji wiederholten sie bloß den Reaktionsknopf daneben.
   */
  distinctCount: number
}

/**
 * Gruppiert Reaktionen nach Emoji und sortiert sie nach Häufigkeit.
 *
 * Liegt hier und nicht in den Ansichten, weil MemoryViewer und der
 * ProfileMemoryViewer in UserProfile dieselbe Zusammenfassung zeigen — zwei
 * Kopien liefen über kurz oder lang auseinander.
 *
 * Bei gleicher Häufigkeit entscheidet, welche Emoji zuerst reagiert wurde: Map
 * behält die Einfügereihenfolge, und `sort` ist seit ES2019 stabil. Ohne das
 * könnte dieselbe Reaktionslage je nach Lauf eine andere Reihenfolge ergeben.
 */
export function summarizeReactions(
  reactions: ReadonlyArray<{ emoji?: string }> | null | undefined,
  limit = 3,
): ReactionSummary {
  const counts = new Map<string, number>()

  for (const reaction of reactions || []) {
    const emoji = reaction?.emoji
    if (!emoji) continue
    counts.set(emoji, (counts.get(emoji) || 0) + 1)
  }

  const topEmojis = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([emoji]) => emoji)

  return { topEmojis, distinctCount: counts.size }
}

export interface Memory {
  // Backend uses memoryId, but API may also include _id
  _id?: string
  memoryId: string
  // Backend field is "url", not "fileUrl"
  url: string
  // Legacy field name for backward compatibility
  fileUrl?: string
  // 400px-Variante für die Rasteransicht. Fehlt beim Altbestand und bei Videos.
  thumbnailUrl?: string | null
  // Backend field is "type", not "fileType"
  type: 'image' | 'video' | 'text'
  // Legacy field name for backward compatibility
  fileType?: 'image' | 'video'
  text?: string
  caption?: string
  privacy: 'public' | 'private' | 'custom'
  selectedViewers?: string[]
  ticketId?: string
  /*
   * uploadedBy kommt in drei Formen, je nach Endpunkt:
   *   - vollständig befülltes Objekt (GET /tickets/:ticketId/memories)
   *   - Objekt mit _id, aber OHNE name und profileImage
   *     (GET /events/:eventId/memories, der öffentliche Endpunkt)
   *   - blanke ObjectId als String
   *
   * `name` war hier als Pflichtfeld deklariert. Der Compiler hielt die mittlere
   * Form damit für unmöglich, obwohl sie real auftritt — der Kopfbereich des
   * MemoryViewers rendert dann einen leeren Namen. Optional ist unbequemer,
   * aber ehrlich: Jede Anzeigestelle muss den Fall behandeln.
   */
  uploadedBy: {
    _id: string
    name?: string
    username?: string
    profileImage?: string
  } | string
  // Backend field is "uploadedAt", not "createdAt"
  uploadedAt: string
  createdAt?: string
  likes: string[]
  likeCount?: number
  likedByCurrentUser?: boolean
  reactions: Array<{
    emoji: string
    userId: string
    createdAt?: string
  }>
  comments: MemoryComment[]
  photoTags: Array<{
    userId: string | { _id: string; name: string; profileImage?: string }
    x: number
    y: number
    createdAt?: string
    user?: {
      _id: string
      name: string
      profileImage?: string
    }
  }>
  // Backend field is "isHighlighted", not "isHighlight"
  isHighlighted?: boolean
  isHighlight?: boolean
}

export interface MemoryComment {
  _id?: string
  text: string
  userId: {
    _id: string
    name: string
    username?: string
    profileImage?: string
  }
  mentions?: string[]
  mentionedUsers?: Array<{
    _id: string
    name: string
    username: string
  }>
  reactions?: Array<{
    emoji: string
    userId: string
  }>
  replies?: Array<{
    text: string
    userId: {
      _id: string
      name: string
      username?: string
      profileImage?: string
    }
    mentions?: string[]
    mentionedUsers?: Array<{
      _id: string
      name: string
      username: string
    }>
    reactions?: Array<{
      emoji: string
      userId: string
    }>
    createdAt: string
  }>
  createdAt: string
}

export const memoriesService = {
  // Get memories for a ticket
  async getTicketMemories(ticketId: string): Promise<Memory[]> {
    const response = await apiClient.get(`/tickets/${ticketId}/memories`)
    return response.data.data
  },

  // Get all memories for an event
  async getEventMemories(eventId: string): Promise<Memory[]> {
    const response = await apiClient.get(`/tickets/event/${eventId}/memories`)
    return response.data.data
  },

  // Upload a memory
  async uploadMemory(
    ticketId: string,
    file: File,
    caption?: string,
    privacy: 'public' | 'private' | 'custom' = 'public',
    selectedViewers?: string[],
    mentions?: string[]
  ): Promise<Memory> {
    const formData = new FormData()
    formData.append('file', file)

    if (caption) {
      formData.append('caption', caption)
    }

    formData.append('privacy', privacy)

    if (selectedViewers && selectedViewers.length > 0) {
      formData.append('selectedViewers', JSON.stringify(selectedViewers))
    }

    // Als JSON-String, wie selectedViewers: multipart/form-data kann keine
    // echten Arrays tragen. Nur anhängen, wenn etwas markiert wurde — ein
    // leeres "[]" wäre unnötiger Ballast.
    if (mentions && mentions.length > 0) {
      formData.append('mentions', JSON.stringify(mentions))
    }

    const response = await apiClient.post(`/tickets/${ticketId}/memories`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  // Delete a memory
  async deleteMemory(ticketId: string, memoryId: string): Promise<void> {
    await apiClient.delete(`/tickets/${ticketId}/memories/${memoryId}`)
  },

  // Toggle like on a memory
  async toggleLike(ticketId: string, memoryId: string): Promise<{ liked: boolean; likesCount: number }> {
    const response = await apiClient.post(`/tickets/${ticketId}/memories/${memoryId}/like`)
    return response.data.data
  },

  // Toggle emoji reaction on a memory
  // Backend returns { hasReacted, reactions, reactionCount }, NOT a Memory object
  async toggleReaction(ticketId: string, memoryId: string, emoji: string): Promise<{
    hasReacted: boolean
    reactions: Array<{ userId: string; emoji: string; createdAt?: string }>
    reactionCount: number
  }> {
    const response = await apiClient.post(`/tickets/${ticketId}/memories/${memoryId}/reactions`, { emoji })
    return response.data.data
  },

  // Add a comment to a memory
  // Backend returns the updated memory object with all comments populated
  async addComment(
    ticketId: string,
    memoryId: string,
    text: string,
    mentions?: string[]
  ): Promise<Memory> {
    const response = await apiClient.post(
      `/tickets/${ticketId}/memories/${memoryId}/comments`,
      { text, mentions }
    )
    // Backend returns { message, data: Memory }
    return response.data.data
  },

  // Delete a comment from a memory
  async deleteComment(ticketId: string, memoryId: string, commentIndex: number): Promise<void> {
    await apiClient.delete(`/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}`)
  },

  // Add a reply to a comment
  // Backend returns the updated memory object with all comments/replies populated
  async addReply(
    ticketId: string,
    memoryId: string,
    commentIndex: number,
    text: string,
    mentions?: string[]
  ): Promise<Memory> {
    const response = await apiClient.post(
      `/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}/replies`,
      { text, mentions }
    )
    // Backend returns { message, data: Memory }
    return response.data.data
  },

  // Delete a reply from a comment
  async deleteReply(
    ticketId: string,
    memoryId: string,
    commentIndex: number,
    replyIndex: number
  ): Promise<void> {
    await apiClient.delete(
      `/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}/replies/${replyIndex}`
    )
  },

  // Toggle comment reaction
  // Backend returns { reacted, reactions }, NOT a Memory object
  async toggleCommentReaction(
    ticketId: string,
    memoryId: string,
    commentIndex: number,
    emoji: string
  ): Promise<{
    reacted: boolean
    reactions: Array<{ userId: string; emoji: string; createdAt?: string }>
  }> {
    const response = await apiClient.post(
      `/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}/reactions`,
      { emoji }
    )
    return response.data.data
  },

  // Toggle reply reaction
  // Backend returns { reacted, reactions }, NOT a Memory object
  async toggleReplyReaction(
    ticketId: string,
    memoryId: string,
    commentIndex: number,
    replyIndex: number,
    emoji: string
  ): Promise<{
    reacted: boolean
    reactions: Array<{ userId: string; emoji: string; createdAt?: string }>
  }> {
    const response = await apiClient.post(
      `/tickets/${ticketId}/memories/${memoryId}/comments/${commentIndex}/replies/${replyIndex}/reactions`,
      { emoji }
    )
    return response.data.data
  },

  // Add a photo tag
  async addPhotoTag(
    ticketId: string,
    memoryId: string,
    taggedUserId: string,
    x: number,
    y: number
  ): Promise<Memory> {
    const response = await apiClient.post(`/tickets/${ticketId}/memories/${memoryId}/tags`, {
      taggedUserId,
      x,
      y,
    })
    return response.data.data
  },

  // Remove a photo tag
  async removePhotoTag(ticketId: string, memoryId: string, taggedUserId: string): Promise<void> {
    await apiClient.delete(`/tickets/${ticketId}/memories/${memoryId}/tags/${taggedUserId}`)
  },

  // Toggle highlight status
  async toggleHighlight(ticketId: string, memoryId: string): Promise<Memory> {
    const response = await apiClient.post(`/tickets/${ticketId}/memories/${memoryId}/highlight`)
    return response.data.data
  },

  // Get event participants (for tagging)
  async getEventParticipants(eventId: string): Promise<Array<{
    _id: string
    name: string
    username?: string
    profileImage?: string
  }>> {
    const response = await apiClient.get(`/tickets/event/${eventId}/participants`)
    return response.data.data
  },

  // Get or create organizer ticket (allows organizers to upload memories)
  // Backend returns a full ticket object with _id, we need to extract ticketId
  async getOrganizerTicket(eventId: string): Promise<{ ticketId: string }> {
    const response = await apiClient.get(`/tickets/organizer-ticket/${eventId}`)
    const ticket = response.data.data
    // Backend returns full ticket object with _id, map to { ticketId }
    return { ticketId: ticket?._id || ticket?.id || ticket?.ticketId || '' }
  },
}
