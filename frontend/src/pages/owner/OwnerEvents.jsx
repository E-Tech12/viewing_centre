import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { ownerApi } from '../../services/api'
import { format } from 'date-fns'

export default function OwnerEvents() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('upcoming')

  const load = () => {
    setLoading(true)
    ownerApi.myEvents({ status: tab }).then(({ data }) => setEvents(data))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [tab])

  const del = async (id) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try { await ownerApi.deleteEvent(id); toast.success('Deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  const statusColor = { upcoming: 'text-volt-400 bg-volt-400/10', live: 'text-red-400 bg-red-400/10', ended: 'text-slate-400 bg-white/5', draft: 'text-amber-400 bg-amber-400/10' }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">Events</h1>
        <Link to="/owner/events/new" className="btn-volt text-xs"><Plus size={13} /> New Event</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-pitch-800 border border-white/5 rounded-sm p-1 w-fit mb-6">
        {['upcoming', 'live', 'ended', 'draft'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
              tab === t ? 'bg-volt-400 text-pitch-950' : 'text-slate-400 hover:text-white'
            }`}
          >{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-pitch-800 h-16 rounded-sm animate-pulse" />)}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-pitch-800 border border-white/5 rounded-sm">
          <span className="text-4xl mb-4 block opacity-20">📅</span>
          <p className="font-display font-bold text-slate-500 uppercase tracking-wide mb-4">No {tab} events</p>
          <Link to="/owner/events/new" className="btn-volt text-xs"><Plus size={12} /> Create Event</Link>
        </div>
      ) : (
        <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Event', 'Sport', 'Date', 'Categories', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-body text-white text-sm">{ev.display_title}</p>
                    <p className="font-mono text-slate-500 text-[10px]">{ev.venue_name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-lg">{ev.sport_icon}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-400 text-xs whitespace-nowrap">
                    {format(new Date(ev.starts_at), 'dd MMM yy · HH:mm')}
                  </td>
                  <td className="px-5 py-3">
                    {ev.ticket_categories?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ev.ticket_categories.map(tc => (
                          <span key={tc.id} className="label-tag text-[9px] bg-white/5 text-slate-400"
                            style={{ borderLeft: `2px solid ${tc.color_hex}` }}>
                            {tc.name} · ₦{Number(tc.price).toLocaleString()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="label-tag bg-red-400/10 text-red-400 text-[9px]">No categories</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`label-tag text-[10px] ${statusColor[ev.status] || 'bg-white/5 text-slate-400'}`}>{ev.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link to={`/events/${ev.id}`} className="btn-ghost py-1 px-2"><Eye size={12} /></Link>
                      <Link to={`/owner/events/${ev.id}/edit`} className="btn-ghost py-1 px-2"><Pencil size={12} /></Link>
                      <button onClick={() => del(ev.id)} className="btn-ghost py-1 px-2 text-ember-400"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
