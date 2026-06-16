import { useState, useEffect } from 'react'
import { ownerApi } from '../../services/api'
import { format } from 'date-fns'

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-white text-2xl sm:text-3xl uppercase tracking-wide">Bookings</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">{bookings.length} confirmed</p>
        </div>
        <select value={eventId} onChange={e => setEventId(e.target.value)} className="input-dark w-full sm:w-64 text-xs">
          <option value="">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.display_title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-pitch-800 h-20 sm:h-14 rounded-sm animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-pitch-800 border border-white/5 rounded-sm">
          <p className="font-mono text-slate-600 text-xs uppercase tracking-widest">No bookings yet</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: card list ──────────────────────────── */}
          <div className="sm:hidden space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="bg-pitch-800 border border-white/5 rounded-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-body text-white text-sm truncate">{b.event_title}</p>
                    <p className="font-mono text-slate-500 text-[10px]">
                      {b.user_id?.slice(0, 8)}… · {b.ticket_count} ticket{b.ticket_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-mono text-slate-500 text-[10px] shrink-0 whitespace-nowrap">
                    {format(new Date(b.booked_at), 'dd MMM · HH:mm')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                  <div>
                    <p className="font-mono text-slate-600 text-[9px] uppercase tracking-widest">Amount</p>
                    <p className="font-mono text-volt-400 text-sm">₦{b.amount_paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-mono text-slate-600 text-[9px] uppercase tracking-widest">Fee</p>
                    <p className="font-mono text-ember-400 text-sm">-₦{b.platform_fee.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-mono text-slate-600 text-[9px] uppercase tracking-widest">Net</p>
                    <p className="font-mono text-green-400 text-sm">₦{b.net_to_owner.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop: table ─────────────────────────────── */}
          <div className="hidden sm:block bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Customer', 'Event', 'Tickets', 'Amount', 'Platform Fee', 'Your Net', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
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
        </>
      )}
    </div>
  )
}
