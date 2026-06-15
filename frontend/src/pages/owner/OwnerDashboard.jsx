import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  TrendingUp, Ticket, Users, CheckCircle, Plus, ArrowRight, AlertCircle, 
  Menu, X, LayoutDashboard, Calendar, Settings, LogOut, DollarSign, 
  Home, ChevronDown 
} from 'lucide-react'
import { ownerApi } from '../../services/api'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'

export default function OwnerDashboard() {
  const { logout } = useAuth()
  const location = useLocation()
  const [analytics, setAnalytics] = useState(null)
  const [events, setEvents] = useState([])
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      ownerApi.analytics(),
      ownerApi.myEvents({ status: 'upcoming', per_page: 5 }),
      ownerApi.myTenant(),
    ]).then(([a, e, t]) => {
      setAnalytics(a.data)
      setEvents(e.data)
      setTenant(t.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statCards = analytics ? [
    { label: 'Total Revenue', value: `₦${analytics.total_revenue.toLocaleString()}`, icon: TrendingUp, color: 'volt' },
    { label: 'Net (after fees)', value: `₦${analytics.net_revenue.toLocaleString()}`, icon: DollarSign, color: 'ice' },
    { label: 'Total Bookings', value: analytics.total_bookings.toLocaleString(), icon: Ticket, color: 'volt' },
    { label: 'Check-in Rate', value: `${analytics.check_in_rate}%`, icon: CheckCircle, color: 'ember' },
  ] : []

  const navItems = [
    { path: '/owner', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/owner/events', label: 'My Events', icon: Calendar },
    { path: '/owner/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/owner/settings', label: 'Settings', icon: Settings },
  ]

  const colorMap = {
    volt: { bg: 'bg-volt-400/10', text: 'text-volt-400', border: 'border-volt-400/20' },
    ice: { bg: 'bg-ice-400/10', text: 'text-ice-400', border: 'border-ice-400/20' },
    ember: { bg: 'bg-ember-400/10', text: 'text-ember-400', border: 'border-ember-400/20' },
  }

  return (
    <div className="min-h-screen bg-pitch-950">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-pitch-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-white text-sm uppercase tracking-wider">
              {tenant?.business_name || 'Owner Portal'}
            </h1>
            <p className="font-mono text-slate-500 text-[9px]">
              {tenant?.status === 'active' ? 'Active Account' : 'Pending Approval'}
            </p>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center"
          >
            {mobileMenuOpen ? <X size={18} className="text-volt-400" /> : <Menu size={18} className="text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-pitch-900 border-r border-white/10 z-50 lg:hidden animate-slide-in-left">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-volt-400 rounded-sm flex items-center justify-center">
                  <span className="font-display font-black text-pitch-950 text-xs">SZ</span>
                </div>
                <span className="font-display font-bold text-white text-sm uppercase tracking-wider">
                  Sport<span className="text-volt-400">Zone</span>
                </span>
              </div>
              <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest">
                Owner Portal
              </p>
            </div>
            
            <nav className="p-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all mb-1 ${
                      isActive 
                        ? 'bg-volt-400/10 text-volt-400 border-l-2 border-volt-400' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Link>
                )
              })}
              
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest text-ember-400 hover:bg-ember-400/10 transition-all mt-2"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-pitch-900 border-r border-white/10 z-30">
        <div className="p-6 border-b border-white/10">
          <Link to="/owner" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-volt-400 rounded-sm flex items-center justify-center">
              <span className="font-display font-black text-pitch-950 text-xs">SZ</span>
            </div>
            <span className="font-display font-bold text-white text-sm uppercase tracking-wider">
              Sport<span className="text-volt-400">Zone</span>
            </span>
          </Link>
          <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest">
            Owner Portal
          </p>
        </div>
        
        <nav className="p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all mb-1 ${
                  isActive 
                    ? 'bg-volt-400/10 text-volt-400 border-l-2 border-volt-400' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            )
          })}
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-mono uppercase tracking-widest text-ember-400 hover:bg-ember-400/10 transition-all mt-2"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </nav>
      </div>

      {/* Main Content - Responsive with padding for sidebar */}
      <div className="lg:ml-64">
        {/* Top Bar - Desktop */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-white/5 bg-pitch-950/50">
          <div>
            <h1 className="font-display font-extrabold text-white text-xl uppercase tracking-wide">
              {tenant?.business_name || 'Dashboard'}
            </h1>
            <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest mt-0.5">
              {tenant?.status === 'active'
                ? `${tenant.city || 'Lagos'} · ${(100 - tenant.platform_fee_pct).toFixed(0)}% of revenue goes to you`
                : 'Pending platform approval'}
            </p>
          </div>
          <Link to="/owner/events/new" className="btn-volt text-xs px-5 py-2.5 flex items-center gap-1.5">
            <Plus size={13} /> New Event
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-6">
          
          {/* Pending approval banner */}
          {tenant?.status === 'pending' && (
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-sm p-3 sm:p-4 flex items-start gap-2 sm:gap-3 mb-6">
              <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-mono text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Pending Approval</p>
                <p className="font-body text-amber-300/70 text-[11px] sm:text-xs">Your account is under review. You'll be able to create events once approved by the platform team.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-pitch-800 rounded-sm h-24 sm:h-28 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {statCards.map(({ label, value, icon: Icon, color }) => {
                  const c = colorMap[color]
                  return (
                    <div key={label} className="bg-pitch-800 border border-white/5 rounded-sm p-4 sm:p-5 hover:border-white/10 transition-all hover:-translate-y-0.5">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <p className="font-mono text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest leading-tight">{label}</p>
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm ${c.bg} border ${c.border} flex items-center justify-center shrink-0 ml-2`}>
                          <Icon size={11} className={c.text} />
                        </div>
                      </div>
                      <p className="font-display font-extrabold text-white text-lg sm:text-xl break-words">{value}</p>
                    </div>
                  )
                })}
              </div>

              {/* Two column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                {/* Upcoming events */}
                <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5">
                    <h2 className="font-display font-bold text-white uppercase tracking-wide text-xs sm:text-sm">Upcoming Events</h2>
                    <Link to="/owner/events" className="font-mono text-volt-400 text-[9px] sm:text-[10px] uppercase tracking-widest hover:underline">
                      View all
                    </Link>
                  </div>
                  {events.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center">
                      <p className="font-mono text-slate-600 text-[10px] sm:text-xs uppercase tracking-widest mb-3">No events yet</p>
                      <Link to="/owner/events/new" className="btn-volt text-xs inline-flex items-center gap-1">
                        <Plus size={12} /> Create First Event
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {events.map(ev => (
                        <div key={ev.id} className="px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between hover:bg-white/2 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-white text-sm sm:text-base truncate">{ev.display_title || ev.title}</p>
                            <p className="font-mono text-slate-500 text-[9px] sm:text-[10px] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span>{ev.sport_icon || '⚽'}</span>
                              <span>{format(new Date(ev.starts_at), 'EEE dd MMM · HH:mm')}</span>
                            </p>
                          </div>
                          <Link to={`/owner/events`} className="text-slate-500 hover:text-volt-400 transition-colors ml-3 shrink-0">
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top events revenue */}
                <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
                  <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5">
                    <h2 className="font-display font-bold text-white uppercase tracking-wide text-xs sm:text-sm">Revenue by Event</h2>
                  </div>
                  {!analytics?.top_events?.length ? (
                    <div className="p-6 sm:p-8 text-center">
                      <p className="font-mono text-slate-600 text-[10px] sm:text-xs uppercase tracking-widest">No revenue data yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {analytics.top_events.map((ev, i) => (
                        <div key={i} className="px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="font-body text-white text-sm sm:text-base truncate max-w-full sm:max-w-[55%]">{ev.title}</p>
                          <div className="text-left sm:text-right">
                            <p className="font-mono text-volt-400 text-sm sm:text-base font-semibold">₦{ev.revenue.toLocaleString()}</p>
                            <p className="font-mono text-slate-600 text-[9px] sm:text-[10px]">{ev.bookings} bookings</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile New Event FAB */}
      <Link 
        to="/owner/events/new" 
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-volt-400 rounded-full flex items-center justify-center shadow-2xl z-40 active:scale-95 transition-transform"
      >
        <Plus size={22} className="text-pitch-950 font-bold" />
      </Link>

      <style>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}