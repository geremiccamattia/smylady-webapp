'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { UserPlus, Copy, Check, Share2 } from 'lucide-react'

interface InviteButtonProps {
  referralCode?: string
}

export default function InviteButton({ referralCode }: InviteButtonProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [showLink, setShowLink] = useState(false)

  if (!referralCode) return null

  const inviteUrl = `https://shareyourparty.de/invite/${referralCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast({ title: t('invite.linkCopied', { defaultValue: 'Link kopiert!' }) })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = inviteUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      toast({ title: t('invite.linkCopied', { defaultValue: 'Link kopiert!' }) })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('invite.shareTitle', { defaultValue: 'Share Your Party — Einladung' }),
          text: t('invite.shareText', { defaultValue: 'Registriere dich bei Share Your Party und wir bekommen beide 20€ Guthaben!' }),
          url: inviteUrl,
        })
      } catch {
        // User hat Share abgebrochen — ignorieren
      }
    } else {
      handleCopy()
    }
  }

  if (!showLink) {
    return (
      <Button
        variant="gradient"
        size="sm"
        className="w-full"
        onClick={() => setShowLink(true)}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {t('invite.inviteFriends', { defaultValue: 'Invite friends and earn €20' })}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1 bg-muted rounded-md px-3 py-2 text-sm w-full">
      <span className="truncate flex-1 text-muted-foreground select-all">{inviteUrl}</span>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleShare}>
        <Share2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
