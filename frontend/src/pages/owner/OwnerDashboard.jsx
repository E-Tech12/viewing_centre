import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Ticket, Users, CheckCircle, Plus, ArrowRight, AlertCircle } from 'lucide-react'
import { ownerApi } from '../../services/api'
import { format } from 'date-fns'

export default function OwnerDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [events,    setEvents]    = useState([])
  const [tenant,    setTenant]    = useState(null)
  const [loading,   setLoading]   = useState(true)

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
    { label: 'Total Revenue',   value: `₦${analytics.total_revenue.toLocaleString()}`,    icon: TrendingUp, color: 'volt'  },
    { label: 'Net (after fees)',value: `₦${analytics.net_revenue.toLocaleString()}`,       icon: TrendingUp, color: 'ice'   },
    { label: 'Total Bookings',  value: analytics.total_bookings.toLocaleString(),          icon: Ticket,     color: 'volt'  },
    { label: 'Check-in Rate',   value: `${analytics.check_in_rate}%`,                     icon: CheckCircle,color: 'ember' },
  ] : []

  const colorMap = {
    volt:  { bg: 'bg-volt-400/10',  text: 'text-volt-400',  border: 'border-volt-400/20'  },
    ice:   { bg: 'bg-ice-400/10',   text: 'text-ice-400',   border: 'border-ice-400/20'   },
    ember: { bg: 'bg-ember-400/10', text: 'text-ember-400', border: 'border-ember-400/20' },
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">
            {tenant?.business_name || 'Dashboard'}
          </h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">
            {tenant?.status === 'active'
              ? `${tenant.city} · ${(100 - tenant.platform_fee_pct).toFixed(0)}% of revenue goes to you`
              : 'Pending platform approval'}
          </p>
        </div>
        <Link to="/owner/events/new" className="btn-volt text-xs">
          <Plus size={13} /> New Event
        </Link>
      </div>

      {/* Pending approval banner */}
      {tenant?.status === 'pending' && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-sm p-4 flex items-start gap-3 mb-6">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-mono text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">Pending Approval</p>
            <p className="font-body text-amber-300/70 text-xs">Your account is under review. You'll be able to create events once approved by the platform team.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-pitch-800 rounded-sm h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color }) => {
              const c = colorMap[color]
              return (
                <div key={label} className="bg-pitch-800 border border-white/5 rounded-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest leading-tight">{label}</p>
                    <div className={`w-7 h-7 rounded-sm ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                      <Icon size={12} className={c.text} />
                    </div>
                  </div>
                  <p className="font-display font-extrabold text-white text-xl">{value}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming events */}
            <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm">Upcoming Events</h2>
                <Link to="/owner/events" className="font-mono text-volt-400 text-[10px] uppercase tracking-widest hover:underline">
                  View all
                </Link>
              </div>
              {events.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-mono text-slate-600 text-xs uppercase tracking-widest mb-3">No events yet</p>
                  <Link to="/owner/events/new" className="btn-volt text-xs">
                    <Plus size={12} /> Create First Event
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {events.map(ev => (
                    <div key={ev.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/2 transition-colors">
                      <div>
                        <p className="font-body text-white text-sm">{ev.display_title}</p>
                        <p className="font-mono text-slate-500 text-[10px]">
                          {ev.sport_icon} {format(new Date(ev.starts_at), 'EEE dd MMM · HH:mm')}
                        </p>
                      </div>
                      <Link to={`/owner/events`}
                        className="text-slate-500 hover:text-volt-400 transition-colors">
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top events revenue */}
            <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm">Revenue by Event</h2>
              </div>
              {!analytics?.top_events?.length ? (
                <div className="p-8 text-center">
                  <p className="font-mono text-slate-600 text-xs uppercase tracking-widest">No revenue data yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {analytics.top_events.map((ev, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between">
                      <p className="font-body text-white text-sm truncate max-w-[60%]">{ev.title}</p>
                      <div className="text-right">
                        <p className="font-mono text-volt-400 text-sm">₦{ev.revenue.toLocaleString()}</p>
                        <p className="font-mono text-slate-600 text-[10px]">{ev.bookings} bookings</p>
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
  )
}
