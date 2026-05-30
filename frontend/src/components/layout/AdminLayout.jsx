import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Calendar, Users, QrCode, LogOut, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/events', label: 'Events', icon: Calendar },
  { to: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/admin/scanner', label: 'Scanner', icon: QrCode },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-pitch-950 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-pitch-900 border-r border-white/5 flex flex-col fixed inset-y-0 z-40">
        <div className="p-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-volt-400 rounded-sm flex items-center justify-center">
              <span className="font-display font-900 text-pitch-950 text-xs">SZ</span>
            </div>
            <span className="font-display font-900 text-white text-sm tracking-widest uppercase">SportZone</span>
          </Link>
          <div className="mt-1 flex items-center gap-1">
            <span className="label-tag bg-ember-400/10 text-ember-400 text-[10px]">
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems
            .filter(item => !item.adminOnly || user?.role === 'admin')
            .map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? location.pathname === to : location.pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
                    active ? 'bg-volt-400/10 text-volt-400 border-l-2 border-volt-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              )
            })
          }
        </nav>

        <div className="p-3 border-t border-white/5 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            <ChevronLeft size={14} /> Back to Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest text-ember-400/70 hover:text-ember-400 hover:bg-ember-400/10 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-60 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
