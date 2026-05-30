import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import { Users, Ticket, DollarSign, TrendingUp, BarChart3, CheckCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats()
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users, color: 'volt' },
    { label: 'Confirmed Bookings', value: stats.total_bookings.toLocaleString(), icon: Ticket, color: 'ice' },
    { label: 'Tickets Scanned', value: `${stats.tickets_scanned}/${stats.total_tickets}`, icon: CheckCircle, color: 'ember' },
    { label: 'Total Revenue', value: `₦${stats.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'volt' },
  ] : []

  const colorMap = {
    volt: { bg: 'bg-volt-400/10', text: 'text-volt-400', border: 'border-volt-400/20' },
    ice: { bg: 'bg-ice-400/10', text: 'text-ice-400', border: 'border-ice-400/20' },
    ember: { bg: 'bg-ember-400/10', text: 'text-ember-400', border: 'border-ember-400/20' },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display font-900 text-white text-3xl uppercase tracking-wide">Dashboard</h1>
        <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">Overview & Analytics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-pitch-800 rounded-sm h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map(({ label, value, icon: Icon, color }) => {
              const c = colorMap[color]
              return (
                <div key={label} className="bg-pitch-800 border border-white/5 rounded-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest">{label}</p>
                    <div className={`w-8 h-8 rounded-sm ${c.bg} border ${c.border} flex items-center justify-center`}>
                      <Icon size={14} className={c.text} />
                    </div>
                  </div>
                  <p className="font-display font-900 text-white text-2xl">{value}</p>
                </div>
              )
            })}
          </div>

          {/* Top events table */}
          {stats?.top_events?.length > 0 && (
            <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                <BarChart3 size={14} className="text-volt-400" />
                <h2 className="font-display font-700 text-white uppercase tracking-wide text-sm">Top Events by Revenue</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Event', 'Bookings', 'Revenue'].map(h => (
                      <th key={h} className="text-left px-6 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.top_events.map((ev, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 font-body text-white text-sm">{ev.title}</td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-sm">{ev.bookings}</td>
                      <td className="px-6 py-4 font-mono text-volt-400 text-sm">₦{ev.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
