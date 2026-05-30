import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, ChevronRight, AlertCircle, Ticket } from 'lucide-react'
import { format } from 'date-fns'
import { eventsApi } from '../../services/api'
import CountdownTimer from '../../components/ui/CountdownTimer'
import { useAuth } from '../../context/AuthContext'

export default function EventDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventsApi.get(id)
      .then(({ data }) => setEvent(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!event) return (
    <div className="min-h-screen pt-24 flex items-center justify-center text-slate-500 font-mono text-sm">
      Event not found.
    </div>
  )

  const hasSections  = event.sections?.length > 0
  const isSoldOut    = hasSections && event.sections.every(s => s.sold_out)
  const isPast       = new Date(event.starts_at) < new Date()
  const lowestPrice  = hasSections
    ? Math.min(...event.sections.map(s => Number(s.price)))
    : null

  // Decide what to show in the booking CTA
  const renderCTA = () => {
    if (isPast) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-sm p-4 text-center">
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">This event has ended</p>
        </div>
      )
    }

    if (!hasSections) {
      return (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-sm p-4 flex items-start gap-3">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="font-mono text-amber-400 text-xs leading-relaxed">
            Ticket pricing hasn't been configured for this event yet. Check back soon.
          </p>
        </div>
      )
    }

    if (isSoldOut) {
      return (
        <div className="bg-red-500/10 border border-red-400/20 rounded-sm p-4 text-center">
          <p className="font-display font-bold text-red-400 uppercase tracking-wide">Sold Out</p>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="space-y-2">
          <Link
            to={`/login?next=/events/${event.id}/seats`}
            className="btn-volt w-full justify-center"
          >
            <Ticket size={14} /> Sign In to Book Tickets
          </Link>
          <Link to="/register" className="btn-outline w-full justify-center text-xs">
            Create Free Account
          </Link>
          <p className="text-slate-600 text-[10px] font-mono text-center pt-1">
            You need an account to purchase tickets
          </p>
        </div>
      )
    }

    // Logged in + sections available = show the big button
    return (
      <Link
        to={`/events/${event.id}/seats`}
        className="btn-volt w-full justify-center text-base py-4"
      >
        <Ticket size={16} /> Select Seats &amp; Buy Tickets
      </Link>
    )
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Banner */}
      <div className="relative h-[45vh] min-h-[280px] overflow-hidden">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover opacity-40" />
        ) : (
          <div className="w-full h-full bg-pitch-800 flex items-center justify-center">
            <span className="text-[100px] opacity-10">
              {event.category === 'football' ? '⚽' : event.category === 'gaming' ? '🎮' : '🏆'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-950 via-pitch-950/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            {event.competition && (
              <p className="font-mono text-volt-400 text-xs uppercase tracking-widest mb-2">{event.competition}</p>
            )}
            <h1
              className="font-display font-extrabold text-white uppercase leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)' }}
            >
              {event.match_teams || event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── Left: event info ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Meta row */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar size={13} className="text-volt-400 shrink-0" />
                <span className="font-mono">{format(new Date(event.starts_at), 'EEEE, dd MMMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock size={13} className="text-volt-400 shrink-0" />
                <span className="font-mono">{format(new Date(event.starts_at), 'HH:mm')} WAT</span>
              </div>
              {event.venue_name && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <MapPin size={13} className="text-volt-400 shrink-0" />
                  <span className="font-mono">{event.venue_name}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="font-display font-bold text-white uppercase tracking-wide text-base mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-volt-400 rounded-full inline-block" />
                  About This Event
                </h2>
                <p className="text-slate-400 font-body leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Ticket categories */}
            {hasSections ? (
              <div>
                <h2 className="font-display font-bold text-white uppercase tracking-wide text-base mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-volt-400 rounded-full inline-block" />
                  Ticket Categories
                </h2>
                <div className="space-y-2">
                  {event.sections.map(sec => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between bg-pitch-800 border border-white/5 rounded-sm px-5 py-4 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sec.color_hex || '#3B82F6' }} />
                        <div>
                          <p className="font-display font-bold text-white text-sm uppercase tracking-wide">
                            {sec.section_name}
                          </p>
                          <p className="font-mono text-slate-500 text-[10px] uppercase">{sec.section_category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-volt-400 text-xl">
                          ₦{Number(sec.price).toLocaleString()}
                        </p>
                        {sec.sold_out ? (
                          <span className="font-mono text-red-400 text-[10px] uppercase">Sold out</span>
                        ) : (
                          <span className="font-mono text-slate-500 text-[10px]">{sec.available_count} seats left</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-pitch-800 border border-white/5 rounded-sm p-5 text-center">
                <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">
                  Ticket pricing coming soon
                </p>
              </div>
            )}
          </div>

          {/* ── Right: booking sidebar ────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-pitch-800 border border-white/10 rounded-sm p-6 space-y-5">

              {/* Countdown */}
              {!isPast && (
                <>
                  <div>
                    <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest mb-2">Kickoff In</p>
                    <CountdownTimer targetDate={event.starts_at} />
                  </div>
                  <div className="border-t border-white/5" />
                </>
              )}

              {/* Price */}
              {lowestPrice !== null && (
                <div>
                  <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest mb-1">Starting From</p>
                  <p className="font-display font-extrabold text-volt-400 text-4xl">
                    ₦{lowestPrice.toLocaleString()}
                  </p>
                </div>
              )}

              {/* CTA */}
              {renderCTA()}

              {hasSections && !isPast && !isSoldOut && (
                <p className="text-slate-600 text-[10px] font-mono text-center">
                  🔒 Secure checkout via Paystack
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
