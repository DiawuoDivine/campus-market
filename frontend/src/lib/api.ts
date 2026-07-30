import type {
  ApiEnvelope,
  AuthResponse,
  CategoryDTO,
  ConversationDTO,
  CreateListingRequest,
  ListingDTO,
  ListingsQuery,
  LoginRequest,
  MessageDTO,
  RegisterRequest,
  UserDTO,
} from './types'

// In dev the Vite proxy forwards /api → localhost:8080, so we use '' (relative).
// Override with VITE_API_BASE_URL if deploying the frontend separately.
const BASE = "https://campus-market-ttui.onrender.com"

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: ApiEnvelope<T>['meta'] }> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${BASE}/api/v1${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const body = (await res.json()) as ApiEnvelope<T>
  if (!res.ok || !body.success) throw new Error(body.error?.message ?? 'Request failed')
  return { data: body.data, meta: body.meta }
}

// ── Auth ──────────────────────────────────────────────────────────────
export const login = async (payload: LoginRequest): Promise<AuthResponse> =>
  (await request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })).data

export const register = async (payload: RegisterRequest): Promise<AuthResponse> =>
  (await request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })).data

export const logout = async (refreshToken: string) =>
  request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) })

// ── Users ─────────────────────────────────────────────────────────────
export const fetchMe = async (): Promise<UserDTO> =>
  (await request<UserDTO>('/users/me')).data

export const fetchUser = async (id: string): Promise<UserDTO> =>
  (await request<UserDTO>(`/users/${id}`)).data

export const updateProfile = async (data: Partial<UserDTO>): Promise<UserDTO> =>
  (await request<UserDTO>('/users/me', { method: 'PATCH', body: JSON.stringify(data) })).data

// ── Categories ────────────────────────────────────────────────────────
export const fetchCategories = async (): Promise<CategoryDTO[]> =>
  (await request<CategoryDTO[]>('/categories')).data

export const createCategory = async (data: { name: string; slug: string; icon?: string }): Promise<CategoryDTO> =>
  (await request<CategoryDTO>('/categories', { method: 'POST', body: JSON.stringify(data) })).data

export const deleteCategory = async (id: string) =>
  request(`/categories/${id}`, { method: 'DELETE' })

// ── Reports ───────────────────────────────────────────────────────────
export const createReport = async (data: { targetType: 'listing' | 'user'; targetId: string; reason: string }) =>
  (await request('/reports', { method: 'POST', body: JSON.stringify(data) })).data

export const fetchReports = async (params: { page?: number; limit?: number; status?: string } = {}) => {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  }
  return request<import('./types').ReportDTO[]>(`/reports${qs.size ? `?${qs}` : ''}`)
}

export const updateReport = async (id: string, data: { status: string; action?: string; note?: string }) =>
  (await request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) })).data

// ── Admin ─────────────────────────────────────────────────────────────
export const fetchAdminDashboard = async (): Promise<import('./types').AdminDashboardDTO> =>
  (await request<import('./types').AdminDashboardDTO>('/admin/dashboard')).data

export const fetchAdminUsers = async (params: { page?: number; limit?: number; search?: string; role?: string; status?: string } = {}) => {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  }
  return request<UserDTO[]>(`/admin/users${qs.size ? `?${qs}` : ''}`)
}

export const updateAdminUser = async (id: string, data: { role?: string; status?: string }): Promise<UserDTO> =>
  (await request<UserDTO>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })).data

export const fetchAuditLogs = async (params: { page?: number; limit?: number } = {}) => {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v))
  }
  return request<import('./types').AuditLogDTO[]>(`/admin/audit-logs${qs.size ? `?${qs}` : ''}`)
}

// ── Upload ────────────────────────────────────────────────────────────
export const uploadFile = async (file: File): Promise<string> => {
  const token = localStorage.getItem('access_token')
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE}/api/v1/upload`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const body = await res.json() as ApiEnvelope<{ url: string }>
  if (!res.ok || !body.success) throw new Error(body.error?.message ?? 'Upload failed')
  return body.data.url
}

// ── Listings ──────────────────────────────────────────────────────────
export const fetchListingStats = async () =>
  (await request<{
    totalListings: number
    totalSold: number
    totalUsers: number
    newThisWeek: number
    topCategories: { id: string; name: string; slug: string; icon: string | null; count: number }[]
  }>('/listings/stats')).data

export const fetchListings = async (params: ListingsQuery = {}) => {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  }
  return request<ListingDTO[]>(`/listings${qs.size ? `?${qs}` : ''}`)
}

export const fetchListing = async (id: string): Promise<ListingDTO> =>
  (await request<ListingDTO>(`/listings/${id}`)).data

export const createListing = async (payload: CreateListingRequest): Promise<ListingDTO> =>
  (await request<ListingDTO>('/listings', { method: 'POST', body: JSON.stringify(payload) })).data

export const updateListing = async (id: string, payload: Partial<CreateListingRequest>): Promise<ListingDTO> =>
  (await request<ListingDTO>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).data

export const deleteListing = async (id: string) =>
  request(`/listings/${id}`, { method: 'DELETE' })

// ── Orders ────────────────────────────────────────────────────────────
export const fetchOrders = async (): Promise<import('./types').OrderDTO[]> =>
  (await request<import('./types').OrderDTO[]>('/orders')).data

export const createOrder = async (data: { listingId: string; meetupLocation?: string; meetupTime?: string }): Promise<import('./types').OrderDTO> =>
  (await request<import('./types').OrderDTO>('/orders', { method: 'POST', body: JSON.stringify(data) })).data

export const updateOrderStatus = async (id: string, status: string): Promise<import('./types').OrderDTO> =>
  (await request<import('./types').OrderDTO>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })).data

// ── Favorites ─────────────────────────────────────────────────────────
export const fetchFavorites = async () =>
  (await request<{ id: string; listingId: string }[]>('/favorites')).data

export const toggleFavorite = async (listingId: string) =>
  (await request<{ added: boolean }>('/favorites', { method: 'POST', body: JSON.stringify({ listing_id: listingId }) })).data

// ── Conversations ─────────────────────────────────────────────────────
export const fetchConversations = async (): Promise<ConversationDTO[]> =>
  (await request<ConversationDTO[]>('/conversations')).data

export const startConversation = async (listingId: string, sellerId: string): Promise<ConversationDTO> =>
  (await request<ConversationDTO>('/conversations', { method: 'POST', body: JSON.stringify({ listingId, sellerId }) })).data

export const fetchMessages = async (conversationId: string): Promise<MessageDTO[]> => {
  const result = await request<unknown[]>(`/conversations/${conversationId}/messages`)
  // Normalize: backend may return flat objects or nested { message, sender } depending on version
  return (result.data ?? []).map((item: unknown) => {
    const row = item as Record<string, unknown>
    // Nested shape: { message: {...}, sender: {...} }
    if (row['message'] && typeof row['message'] === 'object') {
      const m = row['message'] as Record<string, unknown>
      const s = (row['sender'] as Record<string, unknown> | null) ?? null
      return {
        id:             m['id'] as string,
        conversationId: m['conversationId'] as string,
        senderId:       m['senderId'] as string,
        content:        m['content'] as string,
        attachmentUrl:  m['attachmentUrl'] as string | undefined,
        readAt:         m['readAt'] as string | undefined,
        createdAt:      m['createdAt'] as string,
        sender: s
          ? {
              id:     (s['id'] ?? m['senderId']) as string,
              name:   (s['fullName'] ?? s['name'] ?? 'Unknown') as string,
              avatar: (s['avatarUrl'] ?? s['avatar'] ?? null) as string | null,
            }
          : undefined,
      } satisfies MessageDTO
    }
    // Flat shape (new backend)
    const flat = row as Record<string, unknown>
    const sender = flat['sender'] as Record<string, unknown> | null | undefined
    return {
      id:             flat['id'] as string,
      conversationId: flat['conversationId'] as string,
      senderId:       flat['senderId'] as string,
      content:        flat['content'] as string,
      attachmentUrl:  flat['attachmentUrl'] as string | undefined,
      readAt:         flat['readAt'] as string | undefined,
      createdAt:      flat['createdAt'] as string,
      sender: sender
        ? {
            id:     (sender['id'] ?? flat['senderId']) as string,
            name:   (sender['name'] ?? sender['fullName'] ?? 'Unknown') as string,
            avatar: (sender['avatar'] ?? sender['avatarUrl'] ?? null) as string | null,
          }
        : undefined,
    } satisfies MessageDTO
  })
}

export const sendMessage = async (conversationId: string, content: string): Promise<MessageDTO> =>
  (await request<MessageDTO>(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) })).data

// ── Notifications ─────────────────────────────────────────────────────
export const fetchNotifications = async () =>
  (await request<{ id: string; type: string; payload: string; isRead: boolean; createdAt: string }[]>('/notifications')).data
