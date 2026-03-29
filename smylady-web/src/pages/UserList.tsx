import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Search, ChevronRight, VolumeX, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { userService } from '@/services/user'
import { getInitials, resolveImageUrl } from '@/lib/utils'

interface UserListItem {
  id: string
  _id?: string
  name: string
  username?: string
  profileImage?: string
  role?: string
  isMuted?: boolean
}

type ListType = 'subscribers' | 'following'

export default function UserList() {
  const { t } = useTranslation()
  const { userId } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') as ListType) || 'subscribers'

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  // Fetch user list
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['userList', type, userId, debouncedSearch],
    queryFn: async () => {
      if (type === 'subscribers') {
        return userService.getSubscribers(userId!, debouncedSearch)
      } else {
        return userService.getFollowing(userId!, debouncedSearch)
      }
    },
    enabled: !!userId,
  })

  const title =
    type === 'subscribers'
      ? t('userProfile.subscribers', { defaultValue: 'Abonnenten' })
      : t('userProfile.following', { defaultValue: 'Folge ich' })

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to={userId ? `/user/${userId}` : '/'}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <Skeleton className="h-12 w-full rounded-lg mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={userId ? `/user/${userId}` : '/'}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('common.noResults')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user: UserListItem) => {
            const avatarUri = resolveImageUrl(user.profileImage)
            const userId = user.id || user._id

            return (
              <Link
                key={userId}
                to={`/user/${userId}`}
                className="bg-card border rounded-lg p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUri} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  {type === 'following' && user.isMuted && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-gray-500 rounded-full flex items-center justify-center">
                      <VolumeX className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  {type === 'following' && user.isMuted && (
                    <p className="text-sm text-muted-foreground">
                      {t('userList.muted', { defaultValue: 'Stumm geschaltet' })}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
