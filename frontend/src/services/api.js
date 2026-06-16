import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Inject JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refresh}` },
          })
          localStorage.setItem('access_token', data.access_token)
          err.config.headers.Authorization = `Bearer ${data.access_token}`
          return api(err.config)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register:  (d) => api.post('/auth/register', d),
  login:     (d) => api.post('/auth/login', d),
  refresh:   ()  => api.post('/auth/refresh'),
  me:        ()  => api.get('/auth/me'),
  updateMe:  (d) => api.patch('/auth/me', d),
}

// ── Sports categories ─────────────────────────────────────────────
export const sportsApi = {
  list: () => api.get('/sports/'),
  get:  (id) => api.get(`/sports/${id}`),
}

// ── Events (public discovery) ────────────────────────────────────
export const eventsApi = {
  list:   (params) => api.get('/events/', { params }),
  get:    (id)     => api.get(`/events/${id}`),
}

// ── Event Owner APIs ─────────────────────────────────────────────
export const ownerApi = {
  // Tenant
  registerTenant: (d)  => api.post('/tenants/register', d),
  myTenant:       ()   => api.get('/tenants/me'),
  updateTenant:   (d)  => api.patch('/tenants/me', d),

  // Venues
  myVenues:      ()         => api.get('/tenants/me/venues'),
  createVenue:   (d)        => api.post('/tenants/me/venues', d),
  updateVenue:   (id, d)    => api.patch(`/tenants/me/venues/${id}`, d),

  // Events
  myEvents:      (params)   => api.get('/events/owner/mine', { params }),
  createEvent:   (d)        => api.post('/events/owner/create', d),
  updateEvent:   (id, d)    => api.patch(`/events/owner/${id}`, d),
  deleteEvent:   (id)       => api.delete(`/events/owner/${id}`),

  // Analytics
  analytics:     ()         => api.get('/bookings/owner/analytics'),
  bookings:      (params)   => api.get('/bookings/owner/bookings', { params }),

  // Scanner
  scanTicket:    (qr_data)  => api.post('/bookings/scan', { qr_data }),
}

// ── User booking ─────────────────────────────────────────────────
export const bookingsApi = {
  initialize: (d)    => api.post('/bookings/initialize', d),
  verify:     (ref)  => api.get(`/bookings/verify/${ref}`),
  mine:       ()     => api.get('/bookings/mine'),
}


export const platformApi = {
  tenants:       (params)    => api.get('/tenants/', { params }),
  approveTenant: (id)        => api.post(`/tenants/${id}/approve`),
  suspendTenant: (id)        => api.post(`/tenants/${id}/suspend`),
  analytics:     ()          => api.get('/bookings/admin/analytics'),
  users:         (params)    => api.get('/admin/users', { params }),
  setRole:       (id, role)  => api.patch(`/admin/users/${id}/role`, { role }),
  allEvents:     (params)    => api.get('/events/admin/all', { params }),
}


// ── Food & drinks ─────────────────────────────────────────────────
export const foodApi = {
  eventMenu:         (eventId)          => api.get(`/food/menu/event/${eventId}`),
  placeOrder:        (bookingId, d)     => api.post(`/food/order/${bookingId}`, d),
  getOrder:          (bookingId)        => api.get(`/food/order/${bookingId}`),

  ownerMenu:         ()                 => api.get('/food/owner/menu'),
  createMenuItem:    (d)                => api.post('/food/owner/menu', d),
  updateMenuItem:    (id, d)            => api.patch(`/food/owner/menu/${id}`, d),
  deleteMenuItem:    (id)               => api.delete(`/food/owner/menu/${id}`),

  ownerOrders:       (params)           => api.get('/food/owner/orders', { params }),
  updateOrderStatus: (id, status)       => api.patch(`/food/owner/orders/${id}/status`, { status }),
}