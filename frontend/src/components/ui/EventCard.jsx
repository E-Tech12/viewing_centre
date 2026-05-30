import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'

const categoryColors = {
  football: { bg: 'bg-volt-400/10', text: 'text-volt-400', border: 'border-volt-400/20' },
  gaming: { bg: 'bg-ice-400/10', text: 'text-ice-400', border: 'border-ice-400/20' },
  entertainment: { bg: 'bg-ember-400/10', text: 'text-ember-400', border: 'border-ember-400/20' },
}

export default function EventCard({ event }) {
  const colors = categoryColors[event.category] || categoryColors.football
  const isPast = new Date(event.starts_at) < new Date()

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block card-dark hover:border-white/10 transition-all duration-300 relative overflow-hidden"
    >
      {/* Banner */}
      <div className="aspect-[16/7] bg-pitch-700 relative overflow-hidden">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-20">
              {event.category === 'football' ? '⚽' : event.category === 'gaming' ? '🎮' : '🏆'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-800 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`label-tag ${colors.bg} ${colors.text} ${colors.border} border`}>
            {event.category}
          </span>
          {event.status === 'live' && (
            <span className="label-tag bg-red-500/20 text-red-400 border border-red-400/20 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" /> Live
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {event.competition && (
          <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest mb-1">{event.competition}</p>
        )}
        {event.match_teams ? (
          <h3 className="font-display font-800 text-white text-lg uppercase tracking-wide mb-1 group-hover:text-volt-400 transition-colors">
            {event.match_teams}
          </h3>
        ) : (
          <h3 className="font-display font-700 text-white text-base uppercase tracking-wide mb-1 group-hover:text-volt-400 transition-colors">
            {event.title}
          </h3>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Calendar size={10} />
            <span className="font-mono">{format(new Date(event.starts_at), 'EEE dd MMM · HH:mm')}</span>
          </div>
          {event.venue_name && (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <MapPin size={10} />
              <span className="font-mono">{event.venue_name}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="font-mono text-volt-400 text-xs uppercase tracking-widest">
            {isPast ? 'Ended' : 'Book Now →'}
          </span>
          {event.is_featured && (
            <span className="label-tag bg-amber-400/10 text-amber-400 border border-amber-400/20">Featured</span>
          )}
        </div>
      </div>
    </Link>
  )
}
