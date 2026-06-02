import { Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'

export default function EventCard({ event }) {
  const cats       = event.ticket_categories || []
  const lowestPrice= cats.length ? Math.min(...cats.map(c => c.price)) : null
  const isPast     = new Date(event.starts_at) < new Date()

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block bg-pitch-800 border border-white/5 rounded-sm overflow-hidden hover:border-white/10 transition-all duration-300"
    >
      {/* Banner */}
      <div className="aspect-[16/7] bg-pitch-700 relative overflow-hidden">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.display_title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-20">{event.sport_icon || '🏆'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-800 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {event.sport_name && (
            <span className="label-tag bg-black/50 text-white border border-white/10 text-[9px] backdrop-blur-sm">
              {event.sport_icon} {event.sport_name}
            </span>
          )}
          {event.status === 'live' && (
            <span className="label-tag bg-red-500/80 text-white border border-red-400/40 flex items-center gap-1 text-[9px]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
          )}
          {event.is_featured && (
            <span className="label-tag bg-amber-400/80 text-pitch-950 text-[9px]">Featured</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {event.sport_meta?.competition && (
          <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest mb-1">
            {event.sport_meta.competition}
          </p>
        )}
        <h3 className="font-display font-extrabold text-white text-lg uppercase tracking-wide mb-2 group-hover:text-volt-400 transition-colors leading-tight">
          {event.display_title || event.title}
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Calendar size={10} />
            <span className="font-mono">{format(new Date(event.starts_at), 'EEE dd MMM · HH:mm')}</span>
          </div>
          {event.venue_name && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <MapPin size={10} />
              <span className="font-mono truncate max-w-[120px]">{event.venue_name}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          {lowestPrice !== null ? (
            <div>
              <p className="font-mono text-slate-500 text-[9px] uppercase tracking-widest">From</p>
              <p className="font-display font-extrabold text-volt-400 text-lg">₦{Number(lowestPrice).toLocaleString()}</p>
            </div>
          ) : (
            <span className="font-mono text-slate-600 text-xs uppercase tracking-widest">Pricing TBA</span>
          )}
          <span className="font-mono text-volt-400 text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            {isPast ? 'Ended' : 'Book →'}
          </span>
        </div>
      </div>
    </Link>
  )
}
