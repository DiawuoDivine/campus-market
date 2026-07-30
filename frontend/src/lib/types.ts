export interface ListingImageDTO {
  id?: string
  url: string
  position: number
  isPrimary: boolean
}

export interface CategoryDTO {
  id: string
  name: string
  slug: string
  icon?: string
}

export interface SellerDTO {
  id: string
  fullName: string
  avatarUrl?: string
  campus?: string
  hostel?: string
  isVerified: boolean
  ratingAvg: number
  ratingCount: number
}

export interface ListingDTO {
  id: string
  sellerId: string
  categoryId?: string
  title: string
  description: string
  price: number // in smallest unit (pesewas)
  condition: 'new' | 'like_new' | 'used' | 'fair' | 'poor'
  quantity: number
  status: 'draft' | 'published' | 'sold' | 'archived'
  viewCount: number
  expiresAt?: string
  createdAt?: string
  updatedAt?: string
  images?: ListingImageDTO[]
  seller?: SellerDTO
  category?: CategoryDTO
}

export interface UserDTO {
  id: string
  indexNumber: string
  email: string
  fullName: string
  avatarUrl?: string
  campus?: string
  hostel?: string
  bio?: string
  role: 'student' | 'moderator' | 'admin'
  status: string
  isVerified: boolean
  ratingAvg: number
  ratingCount: number
  createdAt?: string
}

export interface MessageDTO {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachmentUrl?: string
  readAt?: string
  createdAt: string
  sender?: { id: string; name: string; avatar: string | null }
}

export interface ConversationDTO {
  id: string
  listingId?: string | null
  listingTitle?: string | null
  listingPrice?: number | null
  listingStatus?: string | null
  buyerId: string
  sellerId: string
  createdAt: string
  otherParty?: { id: string; name: string; avatar: string | null }
  lastMessage?: {
    content: string
    senderId: string
    createdAt: string
    isRead: boolean
  } | null
  unreadCount?: number
}

export interface OrderDTO {
  id: string
  listingId?: string | null
  listingTitle?: string | null
  buyerId: string
  sellerId: string
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
  meetupLocation?: string | null
  meetupTime?: string | null
  createdAt: string
  completedAt?: string | null
}

export interface ReviewDTO {
  id: string
  orderId?: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user: UserDTO
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  indexNumber: string
  email: string
  password: string
}

export interface CreateListingRequest {
  categoryId?: string
  title: string
  description: string
  price: number
  condition: string
  quantity: number
  status: string
  images?: ListingImageDTO[]
}

export interface ListingsQuery {
  page?: number
  limit?: number
  search?: string
  category_id?: string
  condition?: string
  min_price?: number
  max_price?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  seller_id?: string
}

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ReportDTO {
  id: string
  reporterId: string
  targetType: 'listing' | 'user'
  targetId: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
  createdAt: string
  reporterName?: string
  targetLabel?: string
}

export interface AdminDashboardDTO {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  publishedListings: number
  soldListings: number
  pendingReports: number
  verifiedStudents: number
  totalListings: number
  newThisWeek: number
  topCategories: { id: string; name: string; slug: string; icon: string | null; count: number }[]
}

export interface AuditLogDTO {
  id: string
  adminId: string
  action: string
  targetType?: string | null
  targetId?: string | null
  meta: Record<string, unknown>
  createdAt: string
  adminName?: string
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  meta?: PaginationMeta
  error?: { code: string; message: string; details?: string[] }
}
