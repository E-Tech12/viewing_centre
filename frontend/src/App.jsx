import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Layouts
import PublicLayout       from './components/layout/PublicLayout'
import OwnerLayout        from './components/layout/OwnerLayout'
import PlatformAdminLayout from './components/layout/PlatformAdminLayout'

// Public pages
import HomePage          from './pages/public/HomePage'
import EventsPage        from './pages/public/EventsPage'
import EventDetailPage   from './pages/public/EventDetailPage'
import BookingPage       from './pages/public/BookingPage'
import BookingVerifyPage from './pages/public/BookingVerifyPage'
import MyTicketsPage     from './pages/public/MyTicketsPage'
import LoginPage         from './pages/public/LoginPage'
import RegisterPage      from './pages/public/RegisterPage'
import ProfilePage       from './pages/public/ProfilePage'
import BecomeOwnerPage   from './pages/public/BecomeOwnerPage'

// Event Owner pages
import OwnerDashboard    from './pages/owner/OwnerDashboard'
import OwnerEvents       from './pages/owner/OwnerEvents'
import OwnerCreateEvent  from './pages/owner/OwnerCreateEvent'
import OwnerVenues       from './pages/owner/OwnerVenues'
import OwnerBookings     from './pages/owner/OwnerBookings'
import OwnerScanner      from './pages/owner/OwnerScanner'
import OwnerSettings     from './pages/owner/OwnerSettings'

// Platform Admin pages
import PlatformDashboard from './pages/platform/PlatformDashboard'
import PlatformTenants   from './pages/platform/PlatformTenants'
import PlatformUsers     from './pages/platform/PlatformUsers'
import PlatformEvents    from './pages/platform/PlatformEvents'

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-pitch-950">
      <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Regular users only — owners/admins bounce to their dashboard
function UserRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'event_owner')    return <Navigate to="/owner"    replace />
  if (user.role === 'platform_admin') return <Navigate to="/platform" replace />
  return children
}

// Must be logged in (any role)
function AuthRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Event owners only
function OwnerRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'event_owner') return <Navigate to="/" replace />
  return children
}

// Platform admins only
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'platform_admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1a24', color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: { iconTheme: { primary: '#c8f135', secondary: '#020408' } },
            error:   { iconTheme: { primary: '#ff6b35', secondary: '#020408' } },
          }}
        />
        <Routes>
          {/* ── Public ──────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/"             element={<HomePage />} />
            <Route path="/events"       element={<EventsPage />} />
            <Route path="/events/:id"   element={<EventDetailPage />} />
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/register"     element={<RegisterPage />} />
            <Route path="/become-owner" element={<BecomeOwnerPage />} />

            <Route path="/events/:id/book" element={
              <UserRoute><BookingPage /></UserRoute>
            } />
            <Route path="/booking/verify" element={
              <UserRoute><BookingVerifyPage /></UserRoute>
            } />
            <Route path="/my-tickets" element={
              <UserRoute><MyTicketsPage /></UserRoute>
            } />
            <Route path="/profile" element={
              <AuthRoute><ProfilePage /></AuthRoute>
            } />
          </Route>

          {/* ── Event Owner ──────────────────────────────────── */}
          <Route path="/owner" element={
            <OwnerRoute><OwnerLayout /></OwnerRoute>
          }>
            <Route index              element={<OwnerDashboard />} />
            <Route path="events"      element={<OwnerEvents />} />
            <Route path="events/new"  element={<OwnerCreateEvent />} />
            <Route path="events/:id/edit" element={<OwnerCreateEvent />} />
            <Route path="venues"      element={<OwnerVenues />} />
            <Route path="bookings"    element={<OwnerBookings />} />
            <Route path="scanner"     element={<OwnerScanner />} />
            <Route path="settings"    element={<OwnerSettings />} />
          </Route>

          {/* ── Platform Admin ───────────────────────────────── */}
          <Route path="/platform" element={
            <AdminRoute><PlatformAdminLayout /></AdminRoute>
          }>
            <Route index            element={<PlatformDashboard />} />
            <Route path="tenants"   element={<PlatformTenants />} />
            <Route path="users"     element={<PlatformUsers />} />
            <Route path="events"    element={<PlatformEvents />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
