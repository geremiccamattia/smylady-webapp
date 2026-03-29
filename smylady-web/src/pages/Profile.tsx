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
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { user, logout, updateUser } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileImageViewerOpen, setProfileImageViewerOpen] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('')
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
                  Profil bearbeiten
                </h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Abbrechen
                  </Button>
                  <Button type="submit" variant="gradient" size="sm" loading={isLoading}>
                    <Save className="h-4 w-4 mr-1" />
                    Speichern
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
                  <p className="text-xs text-muted-foreground">Klicke auf die Kamera</p>
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
                    <Label htmlFor="age">Alter</Label>
                    <Input
                      id="age"
                      type="number"
                      min="13"
                      max="120"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Dein Alter"
                      className="max-w-[120px]"
                    />
                  </div>

                  {/* Visibility Settings */}
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Sichtbarkeit
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
                          <p className="text-sm font-medium">Alter anzeigen</p>
                          <p className="text-xs text-muted-foreground">Zeige dein Alter auf deinem Profil</p>
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
                          <p className="text-sm font-medium">Standort anzeigen</p>
                          <p className="text-xs text-muted-foreground">Zeige deinen Standort auf deinem Profil</p>
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
                    to={`/user/${currentUserId}/list?type=subscribers`}
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
                    to={`/user/${currentUserId}/list?type=following`}
                    className="text-center hover:text-primary transition-colors"
                  >
                    <p className="text-2xl font-bold">
                      {profile?.subscribedCount || following.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      Folge ich
                    </p>
                  </Link>
                  <Link
                    to="/my-events"
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Profil bearbeiten
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link to="/my-tickets">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Meine Tickets</h3>
                <p className="text-sm text-muted-foreground">Alle gekauften Tickets</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/favorites">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold">Favoriten</h3>
                <p className="text-sm text-muted-foreground">Gespeicherte Events</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/my-events">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <PartyPopper className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">Meine Events</h3>
                <p className="text-sm text-muted-foreground">Von dir erstellt</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Settings className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <h3 className="font-semibold">Einstellungen</h3>
                <p className="text-sm text-muted-foreground">App konfigurieren</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account-Informationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">E-Mail</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Rolle</p>
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
              <h3 className="font-semibold">Abmelden</h3>
              <p className="text-sm text-muted-foreground">
                Du wirst von deinem Account abgemeldet.
              </p>
            </div>
            <Button variant="destructive" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
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
