import { useState, useEffect } from 'react'
import { platformApi } from '../../services/api'
import { format } from 'date-fns'

export default function PlatformEvents() {
  const [events,  setEvents]  = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)

  useEffect(() => {
    setLoading(true)
    platformApi.allEvents({ page }).then(({ data }) => { setEvents(data.events); setTotal(data.total) })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">All Events</h1>
        <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">{total} total across all tenants</p>
      </div>

      <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Event', 'Sport', 'Tenant', 'Date', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-pitch-700 rounded animate-pulse" /></td></tr>
            )) : events.map(ev => (
              <tr key={ev.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-body text-white text-sm">{ev.display_title}</p>
                  <p className="font-mono text-slate-500 text-[10px]">{ev.venue_name}</p>
                </td>
                <td className="px-5 py-3 text-lg">{ev.sport_icon}</td>
                <td className="px-5 py-3 font-mono text-slate-400 text-xs">{ev.tenant_name}</td>
                <td className="px-5 py-3 font-mono text-slate-400 text-xs whitespace-nowrap">
                  {format(new Date(ev.starts_at), 'dd MMM yy · HH:mm')}
                </td>
                <td className="px-5 py-3">
                  <span className={`label-tag text-[10px] ${ev.status === 'upcoming' ? 'bg-volt-400/10 text-volt-400' : 'bg-white/5 text-slate-400'}`}>
                    {ev.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-ghost disabled:opacity-30">← Prev</button>
          <span className="font-mono text-slate-500 text-xs px-4 self-center">Page {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/20)} className="btn-ghost disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  )
}
