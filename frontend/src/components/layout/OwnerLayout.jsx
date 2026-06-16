import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, MapPin, Ticket,
  QrCode, Settings, LogOut, ChevronLeft, UtensilsCrossed
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/owner',          label: 'Dashboard', icon: LayoutDashboard,  exact: true },
  { to: '/owner/events',   label: 'Events',    icon: Calendar                      },
  { to: '/owner/venues',   label: 'Venues',    icon: MapPin                        },
  { to: '/owner/bookings', label: 'Bookings',  icon: Ticket                        },
  { to: '/owner/menu',     label: 'Menu',      icon: UtensilsCrossed               },
  { to: '/owner/scanner',  label: 'Scanner',   icon: QrCode                        },
  { to: '/owner/settings', label: 'Settings',  icon: Settings                      },
]

export default function OwnerLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-pitch-950 flex">
      <aside className="w-56 bg-pitch-900 border-r border-white/5 flex flex-col fixed inset-y-0 z-40">
        <div className="p-4 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-volt-400 rounded-sm flex items-center justify-center">
              <span className="font-display font-extrabold text-pitch-950 text-xs">SZ</span>
            </div>
            <span className="font-display font-extrabold text-white text-sm tracking-widest uppercase">SportZone</span>
          </Link>
          <div className="label-tag bg-ice-400/10 border border-ice-400/20 text-ice-400 text-[9px]">
            Event Owner
          </div>
          <p className="font-body text-slate-500 text-xs mt-1 truncate">{user?.full_name}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact
              ? location.pathname === to
              : location.pathname.startsWith(to)
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
                  active
                    ? 'bg-volt-400/10 text-volt-400 border-l-2 border-volt-400 pl-[10px]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={13} /> {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-0.5">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-mono uppercase tracking-widest text-slate-600 hover:text-white hover:bg-white/5 transition-all">
            <ChevronLeft size={13} /> Public Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-mono uppercase tracking-widest text-ember-400/60 hover:text-ember-400 hover:bg-ember-400/10 transition-all">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="ml-56 flex-1 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
