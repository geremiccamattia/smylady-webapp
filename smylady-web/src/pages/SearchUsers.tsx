import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { userService, SearchedUser } from '@/services/user'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Users, ChevronRight, UserPlus } from 'lucide-react'
import { getInitials, resolveImageUrl } from '@/lib/utils'

export default function SearchUsers() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [friendSuggestions, setFriendSuggestions] = useState<SearchedUser[]>([])
  const [recentUsers, setRecentUsers] = useState<SearchedUser[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  const currentUserId = currentUser?.id || currentUser?._id

  // Search users query (only when search >= 2 chars)
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => userService.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
  })

  // Load friend suggestions and recent users on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      if (currentUserId && isAuthenticated) {
        setIsLoadingSuggestions(true)
        try {
          // Fetch friends (users this user follows)
          try {
            const friends = await userService.getFollowing(currentUserId)
            const mappedFriends = friends.map(user => ({
              _id: user._id || user.id,
              id: user.id || user._id,
              name: user.name,
              email: user.email || '',
              profileImage: user.profileImage,
              role: user.role || 'user',
              subscriberCount: (user as any).subscriberCount || 0,
            }))
            setFriendSuggestions(mappedFriends.slice(0, 5))
          } catch (error) {
            console.error('[SearchUsers] Error fetching friends:', error)
          }

          // Fetch subscribers as "recent/new users" fallback
          try {
            const subscribers = await userService.getFollowers(currentUserId)
            const mappedSubscribers = subscribers.map(user => ({
              _id: user._id || user.id,
              id: user.id || user._id,
              name: user.name,
              email: user.email || '',
              profileImage: user.profileImage,
              role: user.role || 'user',
              subscriberCount: (user as any).subscriberCount || 0,
            }))
            setRecentUsers(mappedSubscribers.slice(0, 5))
          } catch (error) {
            console.error('[SearchUsers] Error fetching subscribers:', error)
          }
        } catch (error) {
          console.error('[SearchUsers] Error loading suggestions:', error)
        } finally {
          setIsLoadingSuggestions(false)
        }
      }
    }

    loadSuggestions()
  }, [currentUserId, isAuthenticated])

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`)
  }

  const UserCard = ({ user }: { user: SearchedUser }) => {
    const userId = user.id || user._id

    return (
      <Card
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => handleUserClick(userId)}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={resolveImageUrl(user.profileImage)} alt={user.name} />
            <AvatarFallback className="gradient-bg text-white">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            {user.username && (
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            )}
            {user.subscriberCount !== undefined && user.subscriberCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {user.subscriberCount} {t('userSearch.followers', { defaultValue: 'Followers' })}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('userSearch.title', { defaultValue: 'Search Users' })}</h1>
        <p className="text-muted-foreground">
          {t('userSearch.subtitle', { defaultValue: 'Find friends and discover new people' })}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('userSearch.placeholder', { defaultValue: 'Search users...' })}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
          autoComplete="off"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      {/* Empty State / Prompt (when no search) */}
      {searchQuery.length === 0 && !isLoadingSuggestions && friendSuggestions.length === 0 && recentUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {t('userSearch.findPeople', { defaultValue: 'Find People' })}
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {t('userSearch.findPeopleDesc', { defaultValue: 'Search for friends or discover new users' })}
          </p>
        </div>
      )}

      {/* Loading Suggestions */}
      {isLoadingSuggestions && searchQuery.length === 0 && <LoadingSkeleton />}

      {/* Friend Suggestions (when no search) */}
      {searchQuery.length === 0 && friendSuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserPlus className="h-5 w-5" />
            <h2 className="font-semibold">
              {t('userSearch.yourFriends', { defaultValue: 'Your Friends' })}
            </h2>
          </div>
          <div className="space-y-2">
            {friendSuggestions.map((user) => (
              <UserCard key={user._id || user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* Recent/New Users (when no search) */}
      {searchQuery.length === 0 && recentUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <h2 className="font-semibold">
              {t('userSearch.recentUsers', { defaultValue: 'New Users' })}
            </h2>
          </div>
          <div className="space-y-2">
            {recentUsers.map((user) => (
              <UserCard key={user._id || user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* Search Loading */}
      {isSearching && searchQuery.length >= 2 && <LoadingSkeleton />}

      {/* Search Results */}
      {!isSearching && searchQuery.length >= 2 && searchResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {searchResults.length} {t('userSearch.resultsFound', { defaultValue: 'results found' })}
          </p>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <UserCard key={user._id || user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium mb-1">
            {t('userSearch.noResults', { defaultValue: 'No users found' })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('userSearch.tryDifferent', { defaultValue: 'Try a different search term' })}
          </p>
        </div>
      )}

      {/* Hint for short search */}
      {searchQuery.length === 1 && (
        <p className="text-center text-sm text-muted-foreground">
          {t('userSearch.typeMore', { defaultValue: 'Type at least 2 characters to search' })}
        </p>
      )}
    </div>
  )
}
