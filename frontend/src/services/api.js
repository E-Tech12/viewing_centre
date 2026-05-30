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

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (d) => api.post('/auth/register', d),
  login: (d) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  updateMe: (d) => api.patch('/auth/me', d),
}

// ── Events ────────────────────────────────────────────────────
export const eventsApi = {
  list: (params) => api.get('/events/', { params }),
  get: (id) => api.get(`/events/${id}`),
  create: (d) => api.post('/events/', d),
  update: (id, d) => api.patch(`/events/${id}`, d),
  delete: (id) => api.delete(`/events/${id}`),
  getVenues: () => api.get('/admin/venues'),
}

// ── Seats ─────────────────────────────────────────────────────
export const seatsApi = {
  getSeatMap: (eventId) => api.get(`/seats/event/${eventId}`),
  hold: (eventId, seatIds) => api.post('/seats/hold', { event_id: eventId, seat_ids: seatIds }),
  release: (eventId, seatIds) => api.delete('/seats/hold', { data: { event_id: eventId, seat_ids: seatIds } }),
}

// ── Payments ──────────────────────────────────────────────────
export const paymentsApi = {
  initialize: (d) => api.post('/payments/initialize', d),
  verify: (ref) => api.get(`/payments/verify/${ref}`),
}

// ── Bookings ──────────────────────────────────────────────────
export const bookingsApi = {
  list: () => api.get('/bookings/'),
  get: (id) => api.get(`/bookings/${id}`),
}

// ── Tickets ───────────────────────────────────────────────────
export const ticketsApi = {
  myTickets: () => api.get('/tickets/my'),
  scan: (qrData) => api.post('/tickets/scan', { qr_data: qrData }),
}

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  setRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  attendance: (eventId) => api.get(`/admin/attendance/${eventId}`),
}
