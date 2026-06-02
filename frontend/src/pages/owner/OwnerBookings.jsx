import { useState, useEffect } from 'react'
import { ownerApi } from '../../services/api'
import { format } from 'date-fns'
import { Search } from 'lucide-react'

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [events,   setEvents]   = useState([])
  const [eventId,  setEventId]  = useState('')

  useEffect(() => {
    ownerApi.myEvents().then(({ data }) => setEvents(data))
  }, [])

  useEffect(() => {
    setLoading(true)
    ownerApi.bookings(eventId ? { event_id: eventId } : {})
      .then(({ data }) => setBookings(data))
      .finally(() => setLoading(false))
  }, [eventId])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">Bookings</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">{bookings.length} confirmed</p>
        </div>
        <select value={eventId} onChange={e => setEventId(e.target.value)} className="input-dark w-64 text-xs">
          <option value="">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.display_title}</option>)}
        </select>
      </div>

      <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Customer', 'Event', 'Tickets', 'Amount', 'Platform Fee', 'Your Net', 'Date'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={7} className="px-5 py-4"><div className="h-4 bg-pitch-700 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 font-mono text-slate-600 text-xs uppercase tracking-widest">No bookings yet</td></tr>
            ) : bookings.map(b => (
              <tr key={b.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3 font-body text-white text-sm">{b.user_id?.slice(0, 8)}…</td>
                <td className="px-5 py-3 font-body text-slate-300 text-xs max-w-[160px] truncate">{b.event_title}</td>
                <td className="px-5 py-3 font-mono text-slate-400 text-sm">{b.ticket_count}</td>
                <td className="px-5 py-3 font-mono text-volt-400 text-sm">₦{b.amount_paid.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-ember-400 text-sm">-₦{b.platform_fee.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-green-400 text-sm">₦{b.net_to_owner.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-slate-500 text-xs whitespace-nowrap">
                  {format(new Date(b.booked_at), 'dd MMM · HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
