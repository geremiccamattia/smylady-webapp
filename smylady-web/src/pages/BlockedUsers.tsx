import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getInitials, resolveImageUrl } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import {
  Ban,
  UserX,
  UserCheck,
} from 'lucide-react'

export default function BlockedUsers() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: blockedUsers = [], isLoading } = useQuery({
    queryKey: ['blockedUsers'],
    queryFn: userService.getBlockedUsers,
  })

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => userService.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] })
      toast({ title: t('blocked.unblocked') })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('blocked.couldNotUnblock'),
      })
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('blocked.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            {t('blocked.count', { count: blockedUsers.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium">{t('blocked.noBlocked')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('blocked.noBlockedDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockedUsers.map((user) => (
                <div
                  key={user._id || user.id}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={resolveImageUrl(user.profileImage)} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblockMutation.mutate(user._id || user.id || '')}
                    disabled={unblockMutation.isPending}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {t('blocked.unblock')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">{t('blocked.whatMeans')}</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {t('blocked.rule1')}</li>
            <li>• {t('blocked.rule2')}</li>
            <li>• {t('blocked.rule3')}</li>
            <li>• {t('blocked.rule4')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
