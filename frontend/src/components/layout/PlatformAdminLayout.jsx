import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, Calendar, LogOut, ChevronLeft, Shield, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/platform',         label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/platform/tenants', label: 'Tenants',   icon: Building2 },
  { to: '/platform/users',   label: 'Users',     icon: Users },
  { to: '/platform/events',  label: 'Events',    icon: Calendar },
]

export default function PlatformAdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout   = () => { logout(); navigate('/') }
  const handleNavClick = () => setOpen(false)

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 mb-2" onClick={handleNavClick}>
            <div className="w-7 h-7 bg-volt-400 rounded-sm flex items-center justify-center shrink-0">
              <span className="font-display font-extrabold text-pitch-950 text-xs">SZ</span>
            </div>
            <span className="font-display font-extrabold text-white text-sm tracking-widest uppercase">SportZone</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
        <div className="label-tag bg-ember-400/10 border border-ember-400/20 text-ember-400 text-[9px] flex items-center gap-1">
          <Shield size={8} /> Platform Admin
        </div>
        <p className="font-body text-slate-500 text-xs mt-1 truncate">{user?.full_name}</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <Link key={to} to={to} onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
                active
                  ? 'bg-ember-400/10 text-ember-400 border-l-2 border-ember-400 pl-[10px]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={13} className="shrink-0" /> {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-0.5">
        <Link to="/" onClick={handleNavClick}
          className="flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-mono uppercase tracking-widest text-slate-600 hover:text-white hover:bg-white/5 transition-all">
          <ChevronLeft size={13} className="shrink-0" /> Public Site
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-mono uppercase tracking-widest text-ember-400/60 hover:text-ember-400 hover:bg-ember-400/10 transition-all">
          <LogOut size={13} className="shrink-0" /> Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-pitch-950 flex">

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-pitch-900 border-b border-white/5 flex items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-volt-400 rounded-sm flex items-center justify-center shrink-0">
            <span className="font-display font-extrabold text-pitch-950 text-[10px]">SZ</span>
          </div>
          <span className="font-display font-extrabold text-white text-xs tracking-widest uppercase">SportZone</span>
          <span className="label-tag bg-ember-400/10 border border-ember-400/20 text-ember-400 text-[8px] ml-1">Admin</span>
        </Link>
        <button onClick={() => setOpen(true)} className="text-slate-300 hover:text-white p-1">
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        bg-pitch-900 border-r border-white/5 flex flex-col fixed inset-y-0 z-50
        w-64 lg:w-56
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <SidebarContent />
      </aside>

      <main className="flex-1 min-h-screen overflow-y-auto w-full lg:ml-56 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
