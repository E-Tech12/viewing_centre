import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Ticket, User, LogOut, ChevronDown, Shield, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenu, setUserMenu] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'staff'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false); setUserMenu(false) }, [location])

  const handleLogout = () => { logout(); navigate('/') }

  // Admin sees only admin-relevant nav links
  // Regular users see public links
  const navLinks = isAdmin
    ? [
        { to: '/admin',        label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/events', label: 'Events'                           },
        { to: '/admin/users',  label: 'Users',     adminOnly: true       },
        { to: '/admin/scanner',label: 'Scanner'                          },
      ].filter(l => !l.adminOnly || user?.role === 'admin')
    : [
        { to: '/',           label: 'Home'       },
        { to: '/events',     label: 'Events'     },
        ...(user ? [{ to: '/my-tickets', label: 'My Tickets' }] : []),
      ]

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-pitch-950/95 backdrop-blur-md border-b border-white/5 shadow-2xl' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-volt-400 rounded-sm flex items-center justify-center">
              <span className="font-display font-extrabold text-pitch-950 text-xs">SZ</span>
            </div>
            <span className="font-display font-extrabold text-lg text-white tracking-[0.2em] uppercase group-hover:text-volt-400 transition-colors">
              Sport<span className="text-volt-400">Zone</span>
            </span>
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-sm bg-ember-400/10 border border-ember-400/20 font-mono text-ember-400 text-[9px] uppercase tracking-widest ml-1">
                {user.role}
              </span>
            )}
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = to === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(to) && to !== '/'
                  ? true
                  : location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
                    active
                      ? 'text-volt-400 bg-volt-400/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {Icon && <Icon size={12} />}
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Auth section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  <div className={`w-7 h-7 rounded-sm flex items-center justify-center border ${
                    isAdmin
                      ? 'bg-ember-400/20 border-ember-400/30'
                      : 'bg-volt-400/20 border-volt-400/30'
                  }`}>
                    <span className={`font-display font-bold text-xs ${isAdmin ? 'text-ember-400' : 'text-volt-400'}`}>
                      {user.full_name?.[0]}
                    </span>
                  </div>
                  <span className="font-body text-xs max-w-[100px] truncate">{user.full_name}</span>
                  <ChevronDown size={12} className={`transition-transform ${userMenu ? 'rotate-180' : ''}`} />
                </button>

                {userMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-pitch-800 border border-white/10 rounded-sm shadow-2xl overflow-hidden animate-fade-in">
                    {/* Admin menu — no ticket links */}
                    {isAdmin ? (
                      <>
                        <div className="px-4 py-2 border-b border-white/5">
                          <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest">Admin Account</p>
                          <p className="font-body text-white text-xs truncate">{user.email}</p>
                        </div>
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-3 text-xs text-slate-300 hover:text-white hover:bg-white/5 font-mono uppercase tracking-widest transition-all">
                          <LayoutDashboard size={12} /> Dashboard
                        </Link>
                        <Link to="/admin/events" className="flex items-center gap-2 px-4 py-3 text-xs text-slate-300 hover:text-white hover:bg-white/5 font-mono uppercase tracking-widest transition-all">
                          <Shield size={12} /> Manage Events
                        </Link>
                      </>
                    ) : (
                      /* Regular user menu */
                      <>
                        <Link to="/profile" className="flex items-center gap-2 px-4 py-3 text-xs text-slate-300 hover:text-white hover:bg-white/5 font-mono uppercase tracking-widest transition-all">
                          <User size={12} /> Profile
                        </Link>
                        <Link to="/my-tickets" className="flex items-center gap-2 px-4 py-3 text-xs text-slate-300 hover:text-white hover:bg-white/5 font-mono uppercase tracking-widest transition-all">
                          <Ticket size={12} /> My Tickets
                        </Link>
                      </>
                    )}
                    <div className="border-t border-white/5" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-xs text-ember-400 hover:bg-ember-400/10 font-mono uppercase tracking-widest transition-all"
                    >
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-xs">Sign In</Link>
                <Link to="/register" className="btn-volt text-xs px-4 py-2">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-slate-400 hover:text-white p-2">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-pitch-900 border-t border-white/5 px-4 py-4 space-y-1 animate-fade-in">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="block px-4 py-3 text-sm font-mono uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-sm transition-all"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-white/5 pt-3 mt-3 space-y-1">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-ember-400 font-mono uppercase tracking-widest"
              >
                <LogOut size={14} /> Sign Out
              </button>
            ) : (
              <>
                <Link to="/login"    className="block px-4 py-3 text-sm font-mono uppercase tracking-widest text-slate-400">Sign In</Link>
                <Link to="/register" className="block px-4 py-3 text-sm font-mono uppercase tracking-widest text-volt-400 bg-volt-400/10">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
