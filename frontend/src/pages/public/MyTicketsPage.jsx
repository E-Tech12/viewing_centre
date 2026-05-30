import { useState, useEffect } from 'react'
import { ticketsApi } from '../../services/api'
import { format } from 'date-fns'
import { Ticket, MapPin, Calendar, QrCode, CheckCircle } from 'lucide-react'

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeQr, setActiveQr] = useState(null)

  useEffect(() => {
    ticketsApi.myTickets()
      .then(({ data }) => setTickets(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-10">
          <Ticket size={20} className="text-volt-400" />
          <h1 className="font-display font-900 text-white text-3xl uppercase tracking-wide">My Tickets</h1>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-24">
            <Ticket size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="font-display font-700 text-slate-500 text-xl uppercase tracking-wide mb-2">No Tickets Yet</p>
            <p className="text-slate-600 font-body text-sm mb-6">Book your first event to see tickets here.</p>
            <a href="/events" className="btn-volt">Browse Events</a>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className={`bg-pitch-800 border rounded-sm overflow-hidden transition-all ${ticket.scanned ? 'border-white/5 opacity-70' : 'border-white/10 hover:border-volt-400/20'}`}>
                <div className="flex flex-col sm:flex-row">
                  {/* Left: ticket info */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-display font-800 text-white uppercase tracking-wide">{ticket.match_teams || ticket.event_title}</p>
                        <p className="font-mono text-volt-400 text-xs uppercase tracking-widest">Seat {ticket.seat_label}</p>
                      </div>
                      {ticket.scanned && (
                        <span className="label-tag bg-green-500/10 text-green-400 border border-green-400/20 flex items-center gap-1">
                          <CheckCircle size={10} /> Scanned
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={10} />
                        <span className="font-mono">{ticket.event_starts_at ? format(new Date(ticket.event_starts_at), 'EEE dd MMM · HH:mm') : '—'}</span>
                      </div>
                      {ticket.venue_name && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin size={10} />
                          <span className="font-mono">{ticket.venue_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: QR button */}
                  <div className="border-t sm:border-t-0 sm:border-l border-white/5 p-5 flex items-center justify-center sm:w-32">
                    <button
                      onClick={() => setActiveQr(activeQr === ticket.id ? null : ticket.id)}
                      className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-volt-400 transition-colors"
                    >
                      <QrCode size={28} />
                      <span className="font-mono text-[10px] uppercase tracking-widest">Show QR</span>
                    </button>
                  </div>
                </div>

                {/* QR Code expanded */}
                {activeQr === ticket.id && (
                  <div className="border-t border-white/5 p-6 flex flex-col items-center gap-3 bg-white animate-fade-in">
                    <img
                      src={`data:image/png;base64,${ticket.qr_payload}`}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                    <p className="font-mono text-pitch-700 text-xs">Present this at the entrance</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
