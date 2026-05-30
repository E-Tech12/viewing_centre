import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import PublicLayout  from './components/layout/PublicLayout'
import AdminLayout   from './components/layout/AdminLayout'

import HomePage          from './pages/public/HomePage'
import EventsPage        from './pages/public/EventsPage'
import EventDetailPage   from './pages/public/EventDetailPage'
import SeatSelectPage    from './pages/public/SeatSelectPage'
import BookingVerifyPage from './pages/public/BookingVerifyPage'
import MyTicketsPage     from './pages/public/MyTicketsPage'
import LoginPage         from './pages/public/LoginPage'
import RegisterPage      from './pages/public/RegisterPage'
import ProfilePage       from './pages/public/ProfilePage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEvents    from './pages/admin/AdminEvents'
import AdminUsers     from './pages/admin/AdminUsers'
import AdminScanner   from './pages/admin/AdminScanner'

// Only logged-in regular users (not admins)
function UserRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  // Admins trying to access user pages → send to admin dashboard
  if (user.role === 'admin' || user.role === 'staff') {
    return <Navigate to="/admin" replace />
  }
  return children
}

// Must be logged in (any role)
function AuthRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Must be admin or staff
function AdminRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/admin" replace />
  if (user.role !== 'admin' && user.role !== 'staff') return <Navigate to="/" replace />
  return children
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-pitch-950">
      <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1a24',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: { iconTheme: { primary: '#c8f135', secondary: '#020408' } },
            error:   { iconTheme: { primary: '#ff6b35', secondary: '#020408' } },
          }}
        />
        <Routes>
          {/* ── Public layout ──────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/"        element={<HomePage />} />
            <Route path="/events"  element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Regular users only — admins get redirected to /admin */}
            <Route path="/events/:id/seats" element={
              <UserRoute><SeatSelectPage /></UserRoute>
            } />
            <Route path="/booking/verify" element={
              <UserRoute><BookingVerifyPage /></UserRoute>
            } />
            <Route path="/my-tickets" element={
              <UserRoute><MyTicketsPage /></UserRoute>
            } />
            <Route path="/profile" element={
              <UserRoute><ProfilePage /></UserRoute>
            } />
          </Route>

          {/* ── Admin layout ───────────────────────────────── */}
          <Route path="/admin" element={
            <AdminRoute><AdminLayout /></AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="events"  element={<AdminEvents />} />
            <Route path="scanner" element={<AdminScanner />} />
            <Route path="users"   element={
              <AdminRoute adminOnly><AdminUsers /></AdminRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
