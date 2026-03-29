import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import Layout from '@/components/layout/Layout'
import CookieConsent from '@/components/CookieConsent'

// Redirect "/" based on auth state: logged in → /explore, not logged in → /login
function HomeRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  return <Navigate to={isAuthenticated ? '/explore' : '/login'} replace />
}

// Pages
import EventDetail from '@/pages/EventDetail'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPasswordPage from '@/pages/auth/ForgotPassword'
import Profile from '@/pages/Profile'
import UserProfile from '@/pages/UserProfile'
import MyEvents from '@/pages/MyEvents'
import MyTickets from '@/pages/MyTickets'
import TicketDetail from '@/pages/TicketDetail'
import CreateEvent from '@/pages/CreateEvent'
import EditEvent from '@/pages/EditEvent'
import Explore from '@/pages/Explore'
import Chat from '@/pages/Chat'
import Conversation from '@/pages/Conversation'
import Favorites from '@/pages/Favorites'
import Settings from '@/pages/Settings'
import Notifications from '@/pages/Notifications'
import SafetyCompanions from '@/pages/SafetyCompanions'
import BlockedUsers from '@/pages/BlockedUsers'
import Feed from '@/pages/Feed'
import QRScanner from '@/pages/QRScanner'
import NotFound from '@/pages/NotFound'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// New Pages
import HostEvents from '@/pages/HostEvents'
import PostDetail from '@/pages/PostDetail'
import EventReviews from '@/pages/EventReviews'
import OrganizerReviews from '@/pages/OrganizerReviews'
import EventDrafts from '@/pages/EventDrafts'
import ManageGuest from '@/pages/ManageGuest'
import OrganizerSubscribers from '@/pages/OrganizerSubscribers'
import PaymentComplete from '@/pages/PaymentComplete'
import ScanStatistics from '@/pages/ScanStatistics'
import UserList from '@/pages/UserList'
import SearchUsers from '@/pages/SearchUsers'

// Auth flow pages
import OTP from '@/pages/OTP'
import ChangePassword from '@/pages/ChangePassword'
import ForgotPassword from '@/pages/ForgotPassword'
import Interest from '@/pages/Interest'
import Onboarding from '@/pages/Onboarding'

// Organizer pages
import PreviewEvent from '@/pages/PreviewEvent'
import Taxes from '@/pages/Taxes'

// Friends & Social pages
import FriendsFeed from '@/pages/FriendsFeed'
import StoryViewer from '@/pages/StoryViewer'
import EventMemories from '@/pages/EventMemories'

// Legal Pages
import Privacy from '@/pages/legal/Privacy'
import Impressum from '@/pages/legal/Impressum'
import Terms from '@/pages/legal/Terms'
import Contact from '@/pages/legal/Contact'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/otp" element={<OTP />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        <Route path="/interest" element={<Interest />} />
        
        {/* App routes with layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="explore" element={<Explore />} />
          <Route path="event/:id" element={<EventDetail />} />
          <Route path="event/:eventId/reviews" element={<EventReviews />} />
          <Route path="event/:eventId/memories" element={<EventMemories />} />
          <Route path="user/:userId" element={<UserProfile />} />
          <Route path="user/:userId/events" element={<HostEvents />} />
          <Route path="user/:userId/reviews" element={<OrganizerReviews />} />
          <Route path="user/:userId/list" element={<UserList />} />
          <Route path="search-users" element={<SearchUsers />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="profile" element={<Profile />} />
            <Route path="my-events" element={<MyEvents />} />
            <Route path="my-tickets" element={<MyTickets />} />
            <Route path="ticket/:ticketId" element={<TicketDetail />} />
            <Route path="create-event" element={<CreateEvent />} />
            <Route path="edit-event/:id" element={<EditEvent />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="safety-companions" element={<SafetyCompanions />} />
            <Route path="blocked-users" element={<BlockedUsers />} />
            <Route path="feed" element={<Feed />} />
            <Route path="post/:postId" element={<PostDetail />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:conversationId" element={<Conversation />} />
            <Route path="scan/:eventId" element={<QRScanner />} />
            <Route path="scan/:eventId/statistics" element={<ScanStatistics />} />
            <Route path="event/:eventId/guests" element={<ManageGuest />} />
            <Route path="drafts" element={<EventDrafts />} />
            <Route path="subscribers" element={<OrganizerSubscribers />} />
            <Route path="preview-event/:id" element={<PreviewEvent />} />
            <Route path="taxes" element={<Taxes />} />
            <Route path="payment-complete" element={<PaymentComplete />} />
            <Route path="friends" element={<FriendsFeed />} />
            <Route path="stories" element={<StoryViewer />} />
          </Route>
          {/* Legal Pages (inside Layout so they have Header/Footer) */}
          <Route path="privacy" element={<Privacy />} />
          <Route path="imprint" element={<Impressum />} />
          <Route path="terms" element={<Terms />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <CookieConsent />
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
