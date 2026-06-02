import { useState, useEffect } from 'react'
import { platformApi } from '../../services/api'
import { Building2, DollarSign, Ticket, Calendar, TrendingUp } from 'lucide-react'

export default function PlatformDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    platformApi.analytics().then(({ data }) => setStats(data)).finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: 'Platform Revenue (5%)', value: `₦${stats.total_platform_revenue.toLocaleString()}`, icon: DollarSign, color: 'volt' },
    { label: 'Total GMV',             value: `₦${stats.total_gmv.toLocaleString()}`,              icon: TrendingUp, color: 'ice'  },
    { label: 'Total Bookings',        value: stats.total_bookings.toLocaleString(),                icon: Ticket,     color: 'ember'},
    { label: 'Active Tenants',        value: stats.active_tenants.toLocaleString(),                icon: Building2,  color: 'volt' },
    { label: 'Total Events',          value: stats.total_events.toLocaleString(),                  icon: Calendar,   color: 'ice'  },
  ] : []

  const c = {
    volt:  { bg: 'bg-volt-400/10',  text: 'text-volt-400',  border: 'border-volt-400/20'  },
    ice:   { bg: 'bg-ice-400/10',   text: 'text-ice-400',   border: 'border-ice-400/20'   },
    ember: { bg: 'bg-ember-400/10', text: 'text-ember-400', border: 'border-ember-400/20' },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">Platform Overview</h1>
        <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">SportZone SaaS · Platform Admin</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-pitch-800 h-24 rounded-sm animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-pitch-800 border border-white/5 rounded-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="font-mono text-slate-500 text-[9px] uppercase tracking-widest leading-tight">{label}</p>
                <div className={`w-7 h-7 rounded-sm ${c[color].bg} border ${c[color].border} flex items-center justify-center shrink-0`}>
                  <Icon size={12} className={c[color].text} />
                </div>
              </div>
              <p className="font-display font-extrabold text-white text-xl">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
