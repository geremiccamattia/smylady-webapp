'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Gift, Ticket, ArrowDown, ArrowUp } from 'lucide-react'
import { apiClient } from '@/services/api'
import { resolveImageUrl } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface BalanceTransaction {
  _id: string
  type: 'referral_bonus' | 'ticket_purchase' | 'admin_topup' | 'admin_deduct'
  amount: number
  balanceAfter: number
  description: string
  relatedUserId?: { _id: string; name: string; profileImage?: string }
  createdAt: string
}

export function BalanceCard() {
  const { t } = useTranslation()
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await apiClient.get('/users/balance')
        const data = response.data?.data
        if (data) {
          setBalance(data.balance || 0)
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBalance()
  }, [])

  const formatCents = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'referral_bonus':
        return <Gift className="h-4 w-4 text-green-500" />
      case 'ticket_purchase':
        return <Ticket className="h-4 w-4 text-primary" />
      case 'admin_topup':
        return <ArrowDown className="h-4 w-4 text-green-500" />
      case 'admin_deduct':
        return <ArrowUp className="h-4 w-4 text-red-500" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  if (loading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          {t('settings.balance', { defaultValue: 'Mein Guthaben' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold gradient-text">
            {formatCents(balance)}
          </span>
        </div>

        {balance > 0 && (
          <p className="text-sm text-muted-foreground">
            {t('settings.balanceInfo', { defaultValue: 'Einlösbar beim nächsten Ticketkauf.' })}
          </p>
        )}

        {transactions.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {showHistory
                ? t('settings.hideHistory', { defaultValue: 'Verlauf ausblenden' })
                : t('settings.showHistory', { defaultValue: 'Verlauf anzeigen' })}
            </button>

            {showHistory && (
              <div className="space-y-3 pt-2 border-t">
                {transactions.map((tx) => (
                  <div key={tx._id} className="flex items-start gap-3">
                    <div className="mt-1">{getTransactionIcon(tx.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {tx.relatedUserId && (
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={resolveImageUrl(tx.relatedUserId.profileImage)} />
                            <AvatarFallback className="text-[10px]">
                              {tx.relatedUserId.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <p className="text-sm truncate">{tx.description}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-medium whitespace-nowrap ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCents(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
