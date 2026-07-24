'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { useToast } from '@/hooks/use-toast'
import { getInitials, resolveImageUrl, safeFormatDate } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authService } from '@/services/auth'
import { userService } from '@/services/user'
import { ImageViewer } from '@/components/ImageViewer'
import InviteButton from '@/components/InviteButton'
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Settings,
  LogOut,
  Camera,
  Edit,
  Ticket,
  Heart,
  PartyPopper,
  Users,
  UserPlus,
  Eye,
  EyeOff,
  X,
  Save,
  Megaphone,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useLocalePath } from '@/hooks/useLocalePath'

export default function Profile() {
  const { t } = useTranslation()
  const localePath = useLocalePath()
  const { user, logout, updateUser } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileImageViewerOpen, setProfileImageViewerOpen] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
  const [emailEditing, setEmailEditing] = useState(false)
  const [emailStep, setEmailStep] = useState<'input' | 'otp'>('input')
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    age: user?.age?.toString() || '',
    showAge: user?.showAge ?? true,
    showLocation: user?.showLocation ?? true,
  })

  // Sync formData when user data changes (e.g. after profile update)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        age: user.age?.toString() || '',
        showAge: user.showAge ?? true,
        showLocation: user.showLocation ?? true,
      })
    }
  }, [user])

  const currentUserId = user?.id || user?._id

  // Fetch full profile with follower/following counts
  const { data: profile } = useQuery({
    queryKey: ['userProfile', currentUserId],
    queryFn: () => userService.getUserById(currentUserId!),
    enabled: !!currentUserId,
  })

  // Fetch followers count
  const { data: followers = [] } = useQuery({
    queryKey: ['followers', currentUserId],
    queryFn: () => userService.getFollowers(currentUserId!),
    enabled: !!currentUserId,
  })

  // Fetch following count
  const { data: following = [] } = useQuery({
    queryKey: ['following', currentUserId],
    queryFn: () => userService.getFollowing(currentUserId!),
    enabled: !!currentUserId,
  })

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updateData = {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
      }
      await authService.updateProfile(updateData)
      // Reload full user data from server to preserve profileImage and other fields
      const freshUser = await authService.getCurrentUser()
      updateUser(freshUser)
      setIsEditing(false)
      toast({
        title: 'Profil aktualisiert',
        description: 'Deine Änderungen wurden gespeichert.',
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: err.response?.data?.message || 'Aktualisierung fehlgeschlagen.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Open crop modal with selected image
    const imageUrl = URL.createObjectURL(file)
    setSelectedImageUrl(imageUrl)
    setCropModalOpen(true)
    
    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }

  const handleCropComplete = async (croppedFile: File) => {
    try {
      const result = await authService.updateProfileImage(croppedFile)
      updateUser({ ...user!, profileImage: result.profileImage })
      toast({ title: 'Profilbild aktualisiert' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Bild-Upload fehlgeschlagen.',
      })
    }
    // Clean up
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
  }

  const handleCropClose = () => {
    setCropModalOpen(false)
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
      setSelectedImageUrl('')
    }
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p>Bitte melde dich an.</p>
      </div>
    )
  }

  const handleRequestEmailChange = async () => {
    if (!newEmail || !emailPassword) return
    setEmailLoading(true)
    try {
      await userService.requestEmailChange(newEmail, emailPassword)
      setEmailStep('otp')
      toast({
        title: t('profile.emailOtpSent', {
          defaultValue: 'Bestätigungscode an neue E-Mail gesendet',
        }),
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description:
          err?.response?.data?.message ||
          'Fehler beim Anfordern der E-Mail-Änderung',
      })
    } finally {
      setEmailLoading(false)
    }
  }

  const handleVerifyEmailChange = async () => {
    if (!emailOtp) return
    setEmailLoading(true)
    try {
      await userService.verifyEmailChange(newEmail, emailOtp)
      const freshUser = await authService.getCurrentUser()
      updateUser(freshUser)
      toast({
        title: t('profile.emailChanged', {
          defaultValue: 'E-Mail erfolgreich geändert',
        }),
      })
      setEmailEditing(false)
      setEmailStep('input')
      setNewEmail('')
      setEmailPassword('')
      setEmailOtp('')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('common.error', { defaultValue: 'Fehler' }),
        description:
          err?.response?.data?.message || 'Ungültiger oder abgelaufener Code',
      })
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header - Edit Mode */}
      {isEditing ? (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleUpdateProfile}>
              {/* Header with close/save buttons */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  {t('profile.editProfile', { defaultValue: 'Profil bearbeiten' })}
                </h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('common.cancel', { defaultValue: 'Abbrechen' })}
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" loading={isLoading}>
                    <Save className="h-4 w-4 mr-1" />
                    {t('common.save', { defaultValue: 'Speichern' })}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar with camera */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-primary/20">
                      <AvatarImage src={resolveImageUrl(user.profileImage)} alt={user.name} />
                      <AvatarFallback className="gradient-bg text-white text-4xl">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90">
                      <Camera className="h-5 w-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('profile.tapCamera', { defaultValue: 'Klicke auf die Kamera' })}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('profile.imageHint', { defaultValue: 'Ideales Format: quadratisch (z.B. 500 × 500 px)' })}
                  </p>
                </div>

                {/* Edit Fields */}
                <div className="flex-1 space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dein Name"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Erzähle etwas über dich..."
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <Label htmlFor="age">{t('profile.age', { defaultValue: 'Alter' })}</Label>
                    <Input
                      id="age"
                      type="number"
                      min="13"
                      max="120"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder={t('profile.agePlaceholder', { defaultValue: 'Dein Alter' })}
                      className="max-w-[120px]"
                    />
                  </div>

                  {/* Visibility Settings */}
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {t('profile.visibility', { defaultValue: 'Sichtbarkeit' })}
                    </h4>

                    {/* Show Age Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {formData.showAge ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{t('profile.showAge', { defaultValue: 'Alter anzeigen' })}</p>
                          <p className="text-xs text-muted-foreground">{t('profile.showAgeDesc', { defaultValue: 'Zeige dein Alter auf deinem Profil' })}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showAge: !formData.showAge })}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${formData.showAge ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${formData.showAge ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>

                    {/* Show Location Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {formData.showLocation ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{t('profile.showLocation', { defaultValue: 'Standort anzeigen' })}</p>
                          <p className="text-xs text-muted-foreground">{t('profile.showLocationDesc', { defaultValue: 'Zeige deinen Standort auf deinem Profil' })}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showLocation: !formData.showLocation })}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${formData.showLocation ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${formData.showLocation ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Username & Member since info */}
              <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                <p>@{user.username}</p>
                {safeFormatDate(user.createdAt, { month: 'long', year: 'numeric' }) && (
                  <p className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    Mitglied seit {safeFormatDate(user.createdAt, { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Profile Header - View Mode */
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div
                    className="cursor-pointer"
                    onClick={() => user.profileImage && setProfileImageViewerOpen(true)}
                  >
                    <Avatar className="h-32 w-32 border-4 border-primary/20 hover:opacity-90 transition-opacity">
                      <AvatarImage src={resolveImageUrl(user.profileImage)} alt={user.name} />
                      <AvatarFallback className="gradient-bg text-white text-4xl">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('profile.imageHint', { defaultValue: 'Ideales Format: quadratisch (z.B. 500 × 500 px)' })}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.username}</p>
                {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                  {/* Show age if user has it and visibility is enabled */}
                  {user.age && user.showAge !== false && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {user.age} Jahre
                    </span>
                  )}
                  {/* Show location if user has it and visibility is enabled */}
                  {user.locationName && user.showLocation !== false && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {user.locationName}
                    </span>
                  )}
                  {safeFormatDate(user.createdAt, { month: 'long', year: 'numeric' }) && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Mitglied seit {safeFormatDate(user.createdAt, { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Stats - Follower/Following/Events */}
                <div className="flex justify-center md:justify-start gap-8 mt-6 pt-4 border-t">
                  <Link
                    href={`/user/${currentUserId}/list?type=subscribers`}
                    className="text-center hover:text-primary transition-colors"
                  >
                    <p className="text-2xl font-bold">
                      {profile?.subscriberCount || followers.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Follower
                    </p>
                  </Link>
                  <Link
                    href={`/user/${currentUserId}/list?type=following`}
                    className="text-center hover:text-primary transition-colors"
                  >
                    <p className="text-2xl font-bold">
                      {profile?.subscribedCount || following.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      {t('profile.followed', { defaultValue: 'Folge ich' })}
                    </p>
                  </Link>
                  <Link
                    href="/my-events"
                    className="text-center hover:text-primary transition-colors"
                  >
                    <p className="text-2xl font-bold">
                      {(profile?.upcomingEvents?.length || 0) + (profile?.pastEvents?.length || 0) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <PartyPopper className="h-3 w-3" />
                      Events
                    </p>
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('profile.editProfile', { defaultValue: 'Profil bearbeiten' })}
                  </Button>
                </div>
                <InviteButton referralCode={profile?.referralCode} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/my-tickets">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('profile.myTickets', { defaultValue: 'Meine Tickets' })}</h3>
                <p className="text-sm text-muted-foreground">{t('profile.allPurchasedTickets', { defaultValue: 'Alle gekauften Tickets' })}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/favorites">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('profile.favourites', { defaultValue: 'Favoriten' })}</h3>
                <p className="text-sm text-muted-foreground">{t('profile.savedEvents', { defaultValue: 'Gespeicherte Events' })}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/my-events">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <PartyPopper className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('profile.myEvents', { defaultValue: 'Meine Events' })}</h3>
                <p className="text-sm text-muted-foreground">{t('profile.createdByYou', { defaultValue: 'Von dir erstellt' })}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Settings className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('profile.settings', { defaultValue: 'Einstellungen' })}</h3>
                <p className="text-sm text-muted-foreground">{t('profile.configureApp', { defaultValue: 'App konfigurieren' })}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Werbung Banner */}
      <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-full shrink-0">
                <Megaphone className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('profile.placeAd', { defaultValue: 'Werbung schalten' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('profile.adDescription', { defaultValue: 'Bewirb deine Events oder erstelle ein eigenes Spotlight mit Link & Bild.' })}
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0 w-full sm:w-auto">
              <Link href="/my-events" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                  <PartyPopper className="h-4 w-4 mr-2 text-purple-500" />
                  {t('profile.sponsorEvents', { defaultValue: 'Events bewerben' })}
                </Button>
              </Link>
              <Link href={localePath('/advertise/spotlight')} className="flex-1 sm:flex-none">
                <Button variant="gradient" className="w-full">
                  <Megaphone className="h-4 w-4 mr-2" />
                  Spotlight
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('profile.accountInfo', { defaultValue: 'Account-Informationen' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">E-Mail</p>
                <p className="font-medium">{user.email}</p>
              </div>
              {!emailEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmailEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>

            {emailEditing && (
              <div className="mt-3 space-y-3">
                {emailStep === 'input' ? (
                  <>
                    <Input
                      type="email"
                      placeholder={t('profile.newEmail', {
                        defaultValue: 'Neue E-Mail-Adresse',
                      })}
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <Input
                      type="password"
                      placeholder={t('profile.currentPassword', {
                        defaultValue: 'Aktuelles Passwort',
                      })}
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleRequestEmailChange}
                        disabled={emailLoading}
                      >
                        {t('profile.sendCode', { defaultValue: 'Code senden' })}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEmailEditing(false)
                          setEmailStep('input')
                          setNewEmail('')
                          setEmailPassword('')
                        }}
                      >
                        {t('common.cancel', { defaultValue: 'Abbrechen' })}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.enterOtp', {
                        defaultValue: 'Gib den Code ein, den wir an',
                      })}{' '}
                      {newEmail}{' '}
                      {t('profile.enterOtpSuffix', {
                        defaultValue: 'gesendet haben.',
                      })}
                    </p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleVerifyEmailChange}
                        disabled={emailLoading}
                      >
                        {t('profile.confirm', { defaultValue: 'Bestätigen' })}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEmailStep('input')
                          setEmailOtp('')
                        }}
                      >
                        {t('common.back', { defaultValue: 'Zurück' })}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.role', { defaultValue: 'Rolle' })}</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{t('profile.logout', { defaultValue: 'Abmelden' })}</h3>
              <p className="text-sm text-muted-foreground">
                {t('profile.logoutDescription', { defaultValue: 'Du wirst von deinem Account abgemeldet.' })}
              </p>
            </div>
            <Button variant="destructive" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('profile.logout', { defaultValue: 'Abmelden' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Image Viewer */}
      {user?.profileImage && (
        <ImageViewer
          images={[resolveImageUrl(user.profileImage) || '']}
          isOpen={profileImageViewerOpen}
          onClose={() => setProfileImageViewerOpen(false)}
          alt={user.name}
        />
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        imageUrl={selectedImageUrl}
        onClose={handleCropClose}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        freeStyle={false}
        title="Profilbild zuschneiden"
      />
    </div>
  )
}
