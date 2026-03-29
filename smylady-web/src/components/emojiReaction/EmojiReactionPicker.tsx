import { cn, resolveImageUrl } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

// Emoji set (same as mobile)
export const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'love' },
  { emoji: '😂', label: 'haha' },
  { emoji: '😮', label: 'wow' },
  { emoji: '😢', label: 'sad' },
  { emoji: '😡', label: 'angry' },
  { emoji: '🔥', label: 'fire' },
  { emoji: '👏', label: 'clap' },
  { emoji: '🎉', label: 'party' },
]

// Default like emoji
export const DEFAULT_LIKE_EMOJI = '👍'

export interface Reaction {
  userId: string | { _id?: string; id?: string }
  emoji: string
  createdAt: string
}

interface EmojiReactionPickerProps {
  visible: boolean
  onClose: () => void
  onSelectEmoji: (emoji: string) => void
  currentUserReaction?: string
  position?: { top?: number; left?: number; right?: number; bottom?: number }
}

// Picker component
export function EmojiReactionPicker({
  visible,
  onClose,
  onSelectEmoji,
  currentUserReaction,
}: EmojiReactionPickerProps) {
  if (!visible) return null

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-3xl p-2 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-wrap justify-center max-w-[280px] gap-1">
          {REACTION_EMOJIS.map(({ emoji }) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className={cn(
                'p-2 rounded-full hover:bg-muted transition-colors',
                currentUserReaction === emoji && 'bg-primary/20'
              )}
            >
              <span className="text-2xl">{emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Display component for showing reaction summary
interface EmojiReactionDisplayProps {
  reactions: Reaction[]
  currentUserId?: string
  onPress: () => void
  compact?: boolean
}

export function EmojiReactionDisplay({
  reactions,
  currentUserId,
  onPress,
  compact = false,
}: EmojiReactionDisplayProps) {
  if (!reactions || reactions.length === 0) return null

  // Group reactions by emoji
  const reactionCounts = reactions.reduce((acc, reaction) => {
    const { emoji } = reaction
    if (!acc[emoji]) {
      acc[emoji] = { count: 0, hasUserReacted: false }
    }
    acc[emoji].count += 1

    // Check if current user has reacted with this emoji
    const reactionUserId =
      typeof reaction.userId === 'object'
        ? reaction.userId._id || reaction.userId.id
        : reaction.userId

    if (reactionUserId?.toString() === currentUserId?.toString()) {
      acc[emoji].hasUserReacted = true
    }

    return acc
  }, {} as Record<string, { count: number; hasUserReacted: boolean }>)

  // Get unique emojis sorted by count
  const sortedEmojis = Object.entries(reactionCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, compact ? 3 : 5)

  const totalCount = reactions.length
  const userHasReacted = Object.values(reactionCounts).some(r => r.hasUserReacted)

  return (
    <button
      onClick={onPress}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full transition-colors',
        userHasReacted ? 'bg-primary/20' : 'bg-muted hover:bg-muted/80'
      )}
    >
      <span className="flex">
        {sortedEmojis.map(([emoji], idx) => (
          <span
            key={emoji}
            className={cn('text-lg', idx > 0 && '-ml-1')}
          >
            {emoji}
          </span>
        ))}
      </span>
      {totalCount > 0 && (
        <span className={cn(
          'text-xs',
          userHasReacted ? 'text-primary' : 'text-muted-foreground'
        )}>
          {totalCount}
        </span>
      )}
    </button>
  )
}

// Helper function to get user's current reaction
export function getUserReaction(
  reactions: Reaction[],
  currentUserId?: string
): string | undefined {
  if (!reactions || !currentUserId) return undefined

  const userReaction = reactions.find(r => {
    const reactionUserId =
      typeof r.userId === 'object' ? r.userId._id || r.userId.id : r.userId

    return reactionUserId?.toString() === currentUserId?.toString()
  })

  return userReaction?.emoji
}

// Reactions Modal (who reacted)
interface ReactionsModalProps {
  visible: boolean
  onClose: () => void
  users: Array<{
    _id: string
    name: string
    username?: string
    profileImage?: string
    emoji?: string
  }>
  isLoading?: boolean
  onUserPress?: (userId: string) => void
}

export function ReactionsModal({
  visible,
  onClose,
  users,
  isLoading,
  onUserPress,
}: ReactionsModalProps) {
  const { t } = useTranslation()
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg w-full max-w-sm max-h-[70vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Reaktionen</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('posts.noReactions')}
            </p>
          ) : (
            <div className="p-2">
              {users.map(user => (
                <button
                  key={user._id}
                  onClick={() => onUserPress?.(user._id)}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="relative">
                    {user.profileImage ? (
                      <img
                        src={resolveImageUrl(user.profileImage)}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {user.emoji && (
                      <span className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 text-sm">
                        {user.emoji}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{user.name}</p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmojiReactionPicker
