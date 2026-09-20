'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { cn, resolveImageUrl } from '@/lib/utils'
import { apiClient } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

// Simple debounce function
function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, wait)
  }
}

export interface MentionUser {
  id: string
  name: string
  username?: string
  profileImage?: string
}

/**
 * Der Text, der hinter dem @ im Beitrag steht.
 *
 * Jetzt der echte Anzeigename MIT Leerzeichen. Vorher wurde der Name entweder
 * durch den username ersetzt oder entleert („Share your Party" → „ShareyourParty"),
 * damit er sich später per Regex an Wortgrenzen wiederfinden ließ. Das ist nicht
 * mehr nötig: Die Auflösung läuft über die Liste der ausgewählten Nutzer, nicht
 * über ein Muster im Text.
 */
export function getMentionDisplayName(user: Pick<MentionUser, 'name' | 'username'>): string {
  return user.name || user.username || ''
}

/** Zeichen, die eine Markierung im Text beenden dürfen — wie in RenderTextWithMentions. */
const MENTION_BOUNDARY = /[\s.,!?;:()[\]{}"']/

/**
 * Steht „@<eingefügter Text>" noch im Beitrag, an einer Wortgrenze?
 *
 * Bewusst per indexOf statt per Regex: Der eingefügte Text ist ein freier
 * Anzeigename und kann Leerzeichen, Punkte oder Klammern enthalten — als Regex
 * wäre er nicht sicher verwendbar, ohne jedes Sonderzeichen zu maskieren.
 */
function containsMentionAtBoundary(text: string, insertedText: string): boolean {
  if (!insertedText) return false

  const needle = `@${insertedText}`.toLowerCase()
  const haystack = text.toLowerCase()
  let from = 0

  for (;;) {
    const index = haystack.indexOf(needle, from)
    if (index === -1) return false

    const charBefore = index === 0 ? '' : text.charAt(index - 1)
    const charAfter = text.charAt(index + needle.length)
    const startsCleanly = !charBefore || MENTION_BOUNDARY.test(charBefore)
    const endsCleanly = !charAfter || MENTION_BOUNDARY.test(charAfter)

    if (startsCleanly && endsCleanly) return true
    from = index + 1
  }
}

/**
 * Trifft die Eingabe diesen Nutzer?
 *
 * Geprüft werden Name und Benutzername, Groß-/Kleinschreibung egal. Mehrteilige
 * Namen sind auch über ein späteres Wort erreichbar: „@party" findet
 * „Share your Party". Bewusst Wortanfänge statt `includes` — sonst fände „art"
 * ebenfalls „Party", und die Vorschlagsliste füllte sich mit Zufallstreffern.
 */
function matchesMentionQuery(user: MentionUser, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  for (const candidate of [user.name ?? '', user.username ?? '']) {
    const lower = candidate.toLowerCase()
    if (lower.startsWith(needle)) return true
    if (lower.split(/\s+/).some(word => word.startsWith(needle))) return true
  }

  return false
}

interface MentionInputProps {
  value: string
  onChangeText: (text: string) => void
  onMentionsChange?: (mentions: string[]) => void
  initialMentions?: MentionUser[]
  /**
   * Feste Vorschlagsliste, etwa die Teilnehmer eines Events.
   *
   * Ist sie gesetzt, filtert die Komponente ausschließlich lokal und ruft weder
   * /users/search noch die Freundesliste auf. Ohne die Prop bleibt alles wie
   * bisher — die übrigen Einsatzorte sind davon unberührt.
   */
  suggestionUsers?: MentionUser[]
  placeholder?: string
  className?: string
  maxLength?: number
  autoFocus?: boolean
  multiline?: boolean
  rows?: number
}

export default function MentionInput({
  value,
  onChangeText,
  onMentionsChange,
  initialMentions,
  suggestionUsers,
  placeholder,
  className,
  maxLength,
  autoFocus,
  multiline = true,
  rows = 1,
}: MentionInputProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<MentionUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  /*
   * Die tatsächlich ausgewählten Markierungen, mit der ID und genau dem Text,
   * der beim Antippen eingefügt wurde.
   *
   * Vorher wurden die IDs beim Absenden aus dem Text zurückgerechnet: Ein
   * /@([^\s@]+)/ zog den ersten Wortteil heraus und schlug ihn in einer Map
   * nach. Namen mit Leerzeichen zerfielen dabei, und ein zufällig getipptes
   * „@irgendwas" konnte einen fremden Treffer erzeugen. Die Zuordnung steht
   * jetzt beim Auswählen fest und wird nicht mehr geraten.
   */
  const [selectedMentions, setSelectedMentions] = useState<
    Array<{ id: string; insertedText: string }>
  >([])
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  // Beim Bearbeiten eines bestehenden Beitrags die schon vorhandenen
  // Markierungen übernehmen, damit sie beim Speichern nicht verloren gehen.
  useEffect(() => {
    if (!initialMentions || initialMentions.length === 0) return

    setSelectedMentions(prev => {
      const known = new Set(prev.map(entry => `${entry.id}|${entry.insertedText}`))
      const merged = [...prev]

      for (const mentionUser of initialMentions) {
        const insertedText = getMentionDisplayName(mentionUser)
        if (!insertedText) continue
        const key = `${mentionUser.id}|${insertedText}`
        if (known.has(key)) continue
        known.add(key)
        merged.push({ id: mentionUser.id, insertedText })
      }

      return merged.length === prev.length ? prev : merged
    })
  }, [initialMentions])

  /*
   * Gemeldet werden die IDs aller ausgewählten Nutzer, deren eingefügter Text
   * noch im Beitrag steht. Wer seine Markierung wieder herauslöscht, fällt
   * damit automatisch heraus.
   */
  useEffect(() => {
    if (!onMentionsChange) return

    const mentionIds: string[] = []
    const addedIds = new Set<string>()

    for (const entry of selectedMentions) {
      if (addedIds.has(entry.id)) continue
      if (!containsMentionAtBoundary(value, entry.insertedText)) continue
      mentionIds.push(entry.id)
      addedIds.add(entry.id)
    }

    onMentionsChange(mentionIds)
  }, [value, selectedMentions, onMentionsChange])

  // Fetch friends for suggestions
  const fetchFriendSuggestions = useCallback(async () => {
    // Feste Liste: ohne Eingabe einfach die ersten Einträge zeigen.
    if (suggestionUsers) {
      setSuggestions(suggestionUsers.slice(0, 10))
      setIsLoading(false)
      return
    }

    if (!user?.id) return

    setIsLoading(true)
    try {
      const response = await apiClient.get(`/users/${user.id}/following`)
      if (response.data?.data) {
        setSuggestions(response.data.data.slice(0, 10).map((u: { _id: string; id?: string; name: string; username?: string; profileImage?: string }) => ({
          id: u._id || u.id,
          name: u.name,
          username: u.username,
          profileImage: u.profileImage,
        })))
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Search users API call
  const searchUsers = useCallback(async (query: string) => {
    // Feste Liste: rein lokal filtern, kein Netzaufruf.
    if (suggestionUsers) {
      setSuggestions(suggestionUsers.filter(u => matchesMentionQuery(u, query)).slice(0, 10))
      setIsLoading(false)
      return
    }

    if (!query || query.length < 1) {
      fetchFriendSuggestions()
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`)
      if (response.data?.data) {
        setSuggestions(response.data.data.slice(0, 10).map((u: { _id: string; id?: string; name: string; username?: string; profileImage?: string }) => ({
          id: u._id || u.id,
          name: u.name,
          username: u.username,
          profileImage: u.profileImage,
        })))
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchFriendSuggestions])

  // Debounced search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchUsers(query)
    }, 300),
    [searchUsers]
  )

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const text = e.target.value
    onChangeText(text)

    // Check if user is typing a mention
    const lastAtIndex = text.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = text.substring(lastAtIndex + 1)

      if (textAfterAt.includes(' ')) {
        setShowSuggestions(false)
        setMentionStartIndex(null)
        setSearchQuery('')
      } else {
        setMentionStartIndex(lastAtIndex)
        setSearchQuery(textAfterAt)
        setShowSuggestions(true)
        // Lokale Liste sofort filtern — die 300 ms Entprellung sind nur für den
        // Netzaufruf da und würden hier beim Tippen spürbar nachhinken.
        if (suggestionUsers) {
          searchUsers(textAfterAt)
        } else {
          debouncedSearch(textAfterAt)
        }
      }
    } else {
      setShowSuggestions(false)
      setMentionStartIndex(null)
      setSearchQuery('')
    }
  }

  // Handle user selection
  const handleSelectUser = (selectedUser: MentionUser) => {
    if (mentionStartIndex === null) return

    const displayName = getMentionDisplayName(selectedUser)
    const beforeMention = value.substring(0, mentionStartIndex)
    const afterMention = value.substring(mentionStartIndex + 1 + searchQuery.length)
    const newText = `${beforeMention}@${displayName} ${afterMention}`

    // Zuordnung hier festhalten — genau der Text, der gleich im Beitrag steht.
    setSelectedMentions(prev => {
      const alreadyKnown = prev.some(
        entry => entry.id === selectedUser.id && entry.insertedText === displayName,
      )
      return alreadyKnown ? prev : [...prev, { id: selectedUser.id, insertedText: displayName }]
    })

    onChangeText(newText)
    setShowSuggestions(false)
    setMentionStartIndex(null)
    setSearchQuery('')
    setSuggestions([])

    // Focus input after selection
    inputRef.current?.focus()
  }

  const InputComponent = multiline ? 'textarea' : 'input'

  // Calculate dropdown position using a portal to avoid overflow clipping
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (showSuggestions && (suggestions.length > 0 || isLoading) && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top + 4,
        zIndex: 9999,
      })
    }
  }, [showSuggestions, suggestions, isLoading])

  const suggestionsDropdown = showSuggestions && (suggestions.length > 0 || isLoading) ? (
    <div
      style={dropdownStyle}
      className="bg-background border rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="py-1">
          {suggestions.map(suggestion => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectUser(suggestion)}
              className="flex items-center gap-3 w-full px-4 py-2 hover:bg-muted transition-colors"
            >
              {suggestion.profileImage ? (
                <img
                  src={resolveImageUrl(suggestion.profileImage)}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                  {suggestion.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{suggestion.name}</p>
                {suggestion.username && (
                  <p className="text-xs text-muted-foreground">@{suggestion.username}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Suggestions rendered via portal to avoid overflow clipping in scrollable containers */}
      {suggestionsDropdown && createPortal(suggestionsDropdown, document.body)}

      <InputComponent
        ref={inputRef as React.Ref<HTMLTextAreaElement & HTMLInputElement>}
        value={value}
        onChange={handleTextChange}
        placeholder={placeholder || t('common.typeHere', 'Hier eingeben...')}
        className={cn(
          'w-full px-3 py-2 border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary',
          className
        )}
        maxLength={maxLength}
        autoFocus={autoFocus}
        rows={multiline ? rows : undefined}
      />
    </div>
  )
}

// Helper to render text with clickable mentions
interface RenderMentionsProps {
  text: string
  mentionedUsers?: Array<{
    _id?: string | { toString(): string }
    id?: string | { toString(): string }
    name?: string
    username?: string
  }>
  // Fallback: populated mentions array from backend (same shape after populate)
  mentions?: Array<{
    _id?: string
    id?: string
    name?: string
    username?: string
  } | string>
  // Additional fallback: participants list (event participants for memory captions)
  participants?: Array<{
    _id: string
    name: string
    username?: string
    profileImage?: string
  }>
  resolvedMentionUsers?: Array<{
    _id?: string
    id?: string
    name?: string
    username?: string
  }>
  onMentionPress?: (userId: string) => void
  className?: string
}

function linkifyString(text: string, keyPrefix: number): React.ReactNode[] {
  const COMBINED =
    /(https?:\/\/[^\s<]+[^\s<.,;:!?"')\]])|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+?[\d][\d\s\-().]{6,18}\d)/g
  const nodes: React.ReactNode[] = []
  let lastIdx = 0
  let m: RegExpExecArray | null
  COMBINED.lastIndex = 0

  while ((m = COMBINED.exec(text)) !== null) {
    if (m.index > lastIdx) {
      nodes.push(text.slice(lastIdx, m.index))
    }
    const matched = m[0]
    if (m[1]) {
      nodes.push(
        <a
          key={`link-${keyPrefix}-${m.index}`}
          href={matched}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {matched.length > 60 ? matched.substring(0, 57) + '...' : matched}
        </a>,
      )
    } else if (m[2]) {
      nodes.push(
        <a
          key={`email-${keyPrefix}-${m.index}`}
          href={`mailto:${matched}`}
          className="text-primary underline hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          {matched}
        </a>,
      )
    } else if (m[3]) {
      const digitCount = matched.replace(/\D/g, '').length
      if (digitCount >= 7) {
        nodes.push(
          <a
            key={`phone-${keyPrefix}-${m.index}`}
            href={`tel:${matched.replace(/[\s()-]/g, '')}`}
            className="text-primary underline hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            {matched}
          </a>,
        )
      } else {
        nodes.push(matched)
      }
    }
    lastIdx = m.index + matched.length
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx))
  }

  return nodes.length > 0 ? nodes : [text]
}

export function RenderTextWithMentions({
  text,
  mentionedUsers,
  mentions,
  participants,
  resolvedMentionUsers,
  onMentionPress,
  className,
}: RenderMentionsProps) {
  if (!text) return null

  type RenderedMentionPart = string | { mentionText: string; userId?: string }

  // Create map of mention text to userId
  const mentionMap = new Map<string, string>()

  // Helper to add user to mention map
  const addUserToMap = (userId: string | { toString(): string } | undefined, name: string | undefined, username: string | undefined) => {
    if (!userId) return
    // Convert ObjectId or any object with toString() to string
    const userIdStr = typeof userId === 'string' ? userId : userId.toString()
    if (!userIdStr) return

    if (name) {
      mentionMap.set(`@${name}`, userIdStr)
      mentionMap.set(`@${name.toLowerCase()}`, userIdStr)
      // Also add variant without spaces (MentionInput removes spaces from names)
      const nameNoSpaces = name.replace(/\s+/g, '')
      mentionMap.set(`@${nameNoSpaces}`, userIdStr)
      mentionMap.set(`@${nameNoSpaces.toLowerCase()}`, userIdStr)
    }
    if (username) {
      mentionMap.set(`@${username}`, userIdStr)
      mentionMap.set(`@${username.toLowerCase()}`, userIdStr)
    }
  }

  // Add mentionedUsers
  if (mentionedUsers) {
    for (const u of mentionedUsers) {
      // Handle both string and ObjectId formats for _id
      const id = u._id || u.id
      const idStr = id && typeof id === 'object' ? (id as { toString(): string }).toString() : id
      addUserToMap(idStr, u.name, u.username)
    }
  }

  // Add populated mentions objects
  if (mentions) {
    for (const m of mentions) {
      if (typeof m === 'object' && m !== null && ('_id' in m || 'id' in m)) {
        const obj = m as { _id?: string; id?: string; name?: string; username?: string }
        addUserToMap(obj._id || obj.id, obj.name, obj.username)
      }
    }
  }

  // Add participants (event participants for caption mentions)
  if (participants) {
    for (const p of participants) {
      addUserToMap(p._id, p.name, p.username)
    }
  }

  if (resolvedMentionUsers) {
    for (const user of resolvedMentionUsers) {
      addUserToMap(user._id || user.id, user.name, user.username)
    }
  }

  // Match exact known mentions first so names with spaces remain clickable.
  const genericMentionRegex = /^@[\w.\-\u00C0-\u024F\u0400-\u04FF]+/
  const sortedMentionEntries = [...mentionMap.entries()].sort((a, b) => b[0].length - a[0].length)
  const mentionBoundaryRegex = /[\s.,!?;:()\[\]{}"']/
  const renderedParts: RenderedMentionPart[] = []
  let cursor = 0

  while (cursor < text.length) {
    const mentionStart = text.indexOf('@', cursor)

    if (mentionStart === -1) {
      renderedParts.push(text.slice(cursor))
      break
    }

    if (mentionStart > cursor) {
      renderedParts.push(text.slice(cursor, mentionStart))
    }

    const remainingText = text.slice(mentionStart)
    const exactMatch = sortedMentionEntries.find(([mentionText]) => {
      if (!remainingText.toLowerCase().startsWith(mentionText.toLowerCase())) {
        return false
      }

      const nextCharacter = remainingText.charAt(mentionText.length)
      return !nextCharacter || mentionBoundaryRegex.test(nextCharacter)
    })

    if (exactMatch) {
      const [mentionText, userId] = exactMatch
      renderedParts.push({
        mentionText: text.slice(mentionStart, mentionStart + mentionText.length),
        userId,
      })
      cursor = mentionStart + mentionText.length
      continue
    }

    const genericMatch = remainingText.match(genericMentionRegex)
    if (genericMatch) {
      renderedParts.push({ mentionText: genericMatch[0] })
      cursor = mentionStart + genericMatch[0].length
      continue
    }

    renderedParts.push('@')
    cursor = mentionStart + 1
  }

  return (
    <span className={className}>
      {renderedParts.map((part, index) => {
        if (typeof part === 'string') {
          return <React.Fragment key={index}>{linkifyString(part, index)}</React.Fragment>
        }

        if (part.userId && onMentionPress) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onMentionPress(part.userId!)}
              className="text-primary font-semibold hover:underline inline p-0 border-0 bg-transparent cursor-pointer"
            >
              {part.mentionText}
            </button>
          )
        }

        return (
          <span key={index} className="text-primary font-semibold">
            {part.mentionText}
          </span>
        )
      })}
    </span>
  )
}
