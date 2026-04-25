// User Types
export interface User {
  id: string
  _id?: string
  email: string
  name: string
  username: string
  phoneNumber?: string
  locationName?: string
  location?: {
    type: string
    coordinates: number[]
  }
  dateOfBirth?: string
  age?: number
  role: 'user' | 'organizer'
  profileImage?: string
  bio?: string
  showAge?: boolean
  showLocation?: boolean
  followersCount?: number
  followingCount?: number
  eventCount?: number
  createdAt?: string
  updatedAt?: string
  // Additional profile fields
  interest?: string
  partiesAttended?: boolean
  partiesHosted?: boolean
  language?: 'en' | 'de'
}

// Auth Types
export interface LoginCredentials {
  emailOrUsername: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  dateOfBirth: string
}

export interface AuthResponse {
  token: string
  user: User
  message?: string
  // Additional fields for OTP verification
  userId?: string
  email?: string
  role?: string
  resetToken?: string
}

// Event Types
export interface Event {
  id: string
  _id?: string
  name: string
  description: string
  category: string
  partyType: string
  musicType: string
  // Backend returns offerings/restrictions as comma-separated string, but may also be array
  offerings: string | string[]
  restrictions: string | string[]
  price: number
  totalTickets: number
  soldTickets: number
  availableTickets: number
  soldOut?: boolean
  eventDate: string
  eventStartTime: string
  eventEndTime: string
  locationName: string
  location: {
    type: string
    coordinates: number[]
  }
  images: string[]
  locationImages?: { url: string; fileName: string }[]
  thumbnailUrl?: string
  creator: User | string
  userId?: User | string
  visibility: 'public' | 'private' | 'friends' | 'subscribers' | 'selected'
  minimumAge?: number
  ticketTiers?: {
    _id: string
    name: string
    description?: string
    price: number
    quantity?: number
    soldCount: number
  }[]
  allowGuestMemories?: boolean
  status: 'draft' | 'published' | 'cancelled' | 'completed' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
  isFavorite?: boolean
  createdAt: string
  updatedAt: string
  // Ticketmaster/External event specific fields
  isTicketmaster?: boolean
  ticketmasterUrl?: string
  isExternalEvent?: boolean
  externalSource?: string
  externalEventId?: string
  externalUrl?: string
  source?: 'internal' | 'ticketmaster'
  startDate?: string
  venue?: {
    name: string
    address?: string
    city?: string
  }
  boostStatus?: 'none' | 'active' | 'expired'
  boostBudget?: number
  boostDailyBudget?: number
  boostStartDate?: string
  boostEndDate?: string
  boostRadius?: number
  boostImpressions?: number
}

export interface EventFilters {
  category?: string
  musicType?: string
  minPrice?: number
  maxPrice?: number
  startDate?: string
  endDate?: string
  location?: string
  latitude?: string
  longitude?: string
  radius?: number | string
  search?: string
  city?: string
  upcoming?: boolean
}

// Ticket Types
export interface Ticket {
  id: string
  _id?: string
  event: Event | string
  eventId?: string
  user: User | string
  userId?: string
  organizerId?: string
  qrCode: string
  verificationCode?: string
  status: 'valid' | 'active' | 'used' | 'cancelled' | 'refunded'
  purchaseDate: string
  price: number
  quantity?: number
  totalAmount?: number
  isScanned?: boolean
  scannedAt?: string
  scannedBy?: string
  stripePaymentId?: string
  paymentIntentId?: string
  tierId?: string
  createdAt: string
  updatedAt?: string
}

// Chat Types
export interface ChatMessage {
  _id: string
  senderId: string
  receiverId?: string
  content: string
  media?: {
    url: string
    mediaType: string
  }
  timestamp: string
  isRead?: boolean
  readBy?: string[]
  parentMessage?: ChatMessage
  senderName?: string
  senderImage?: string
}

export interface ChatUser {
  id: string
  _id?: string
  name: string
  image: string
  profileImage?: string
}

export interface ChatRoom {
  _id: string
  roomId: string
  isGroup: boolean
  senderId?: string
  receiverId?: string
  otherUser?: ChatUser
  groupName?: string
  groupImage?: string
  groupDescription?: string
  memberCount?: number
  members?: Array<{
    userId: string
    name: string
    profileImage: string
    role: string
  }>
  unreadMessagesCount: number
  lastMessages: ChatMessage[]
}

export interface ChatMessagesResponse {
  messages: ChatMessage[]
  otherUser?: ChatUser
  isGroup: boolean
  groupName?: string
  groupDescription?: string
  groupImage?: string
  members?: Array<{
    userId: string
    name: string
    profileImage: string
    role: string
  }>
  roomId?: string
}

// Legacy types for backwards compatibility
export interface Message {
  id: string
  _id?: string
  conversationId: string
  sender: User | string
  content: string
  type: 'text' | 'image' | 'system'
  readBy: string[]
  createdAt: string
}

export interface Conversation {
  id: string
  _id?: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  createdAt: string
  updatedAt: string
}

// Notification Types
export interface Notification {
  id: string
  _id?: string
  user: string
  type: 'event' | 'ticket' | 'chat' | 'follow' | 'system'
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  createdAt: string
}

// Review Types
export interface Review {
  id: string
  _id?: string
  event: string
  user: User | string
  rating: number
  comment: string
  createdAt: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}
