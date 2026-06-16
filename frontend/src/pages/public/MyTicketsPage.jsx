import { useState, useEffect } from 'react'
import { bookingsApi } from '../../services/api'
import { format } from 'date-fns'
import { Ticket, MapPin, Calendar, QrCode, CheckCircle, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MyTicketsPage() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [openIds,  setOpenIds]  = useState({}) // booking_id -> bool
  const [showQr,   setShowQr]   = useState(null)

  useEffect(() => {
    bookingsApi.mine().then(({ data }) => setBookings(data)).finally(() => setLoading(false))
  }, [])

  const toggle = (id) => setOpenIds(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-10">
          <Ticket size={20} className="text-volt-400" />
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">My Tickets</h1>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-24">
            <Ticket size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="font-display font-bold text-slate-500 text-xl uppercase tracking-wide mb-2">No Tickets Yet</p>
            <p className="text-slate-600 font-body text-sm mb-6">Book your first event to see tickets here.</p>
            <Link to="/events" className="btn-volt">Browse Events</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id}
                className="bg-pitch-800 border border-white/10 rounded-sm overflow-hidden">

                {/* Booking header */}
                <button
                  onClick={() => toggle(booking.id)}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-start gap-3 text-left">
                    <span className="text-2xl mt-0.5">{booking.sport_icon || '🏆'}</span>
                    <div>
                      <p className="font-display font-bold text-white uppercase tracking-wide text-sm">
                        {booking.event_title}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {booking.event_starts_at && (
                          <span className="flex items-center gap-1 font-mono text-slate-500 text-[10px]">
                            <Calendar size={9} /> {format(new Date(booking.event_starts_at), 'EEE dd MMM · HH:mm')}
                          </span>
                        )}
                        {booking.venue_name && (
                          <span className="flex items-center gap-1 font-mono text-slate-500 text-[10px]">
                            <MapPin size={9} /> {booking.venue_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right">
                      <p className="font-mono text-volt-400 text-sm font-bold">
                        {booking.ticket_count} ticket{booking.ticket_count !== 1 ? 's' : ''}
                      </p>
                      <p className="font-mono text-slate-600 text-[10px]">
                        ₦{booking.amount_paid.toLocaleString()}
                      </p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform ${openIds[booking.id] ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Tickets expanded */}
                {openIds[booking.id] && (
                  <div className="border-t border-white/5 animate-fade-in">
                    {(booking.tickets || []).map((ticket, i) => (
                      <div key={ticket.id} className="border-b border-white/5 last:border-b-0">
                        <div className="flex items-center justify-between px-4 sm:px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-volt-400/10 border border-volt-400/20 rounded-sm flex items-center justify-center">
                              <span className="font-mono text-volt-400 text-[10px] font-bold">{i + 1}</span>
                            </div>
                            <div>
                              <p className="font-display font-bold text-white text-sm uppercase tracking-wide">
                                {ticket.category_name}
                              </p>
                              {ticket.status === 'used' && (
                                <span className="flex items-center gap-1 font-mono text-green-400 text-[10px]">
                                  <CheckCircle size={9} /> Used
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowQr(showQr === ticket.id ? null : ticket.id)}
                            className={`flex items-center gap-1.5 transition-colors ${
                              ticket.status === 'used'
                                ? 'text-slate-600 cursor-default'
                                : 'text-volt-400 hover:text-volt-300'
                            }`}
                            disabled={ticket.status === 'used'}
                          >
                            <QrCode size={16} />
                            <span className="font-mono text-[10px] uppercase tracking-widest hidden sm:inline">
                              {showQr === ticket.id ? 'Hide QR' : 'Show QR'}
                            </span>
                          </button>
                        </div>

                        {showQr === ticket.id && (
                          <div className="border-t border-white/5 p-6 bg-white flex flex-col items-center gap-3 animate-fade-in">
                            <img
                              src={`data:image/png;base64,${ticket.qr_payload}`}
                              alt="QR Code"
                              className="w-48 h-48"
                            />
                            <p className="font-mono text-pitch-700 text-xs">Present at entrance · Do not share</p>
                          </div>
                        )}
                      </div>
                    ))}
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
