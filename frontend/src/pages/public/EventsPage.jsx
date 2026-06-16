import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventsApi, sportsApi } from '../../services/api'
import EventCard from '../../components/ui/EventCard'

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events,  setEvents]  = useState([])
  const [sports,  setSports]  = useState([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)

  const sport  = searchParams.get('sport')  || 'all'
  const status = searchParams.get('status') || 'upcoming'

  useEffect(() => { sportsApi.list().then(({ data }) => setSports(data)) }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, per_page: 9, status }
    if (sport !== 'all') params.sport = sport
    eventsApi.list(params)
      .then(({ data }) => { setEvents(data.events); setTotal(data.total) })
      .finally(() => setLoading(false))
  }, [sport, status, page])

  const setFilter = (key, val) => {
    setSearchParams(prev => { prev.set(key, val); return prev })
    setPage(1)
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="border-b border-white/5 pb-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="font-display font-extrabold text-white text-4xl uppercase tracking-wide mb-1">Events</h1>
          <p className="text-slate-500 font-body text-sm">{total} events available</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-6 sm:mb-8">
          {/* Sport filter */}
          <div className="w-full sm:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1 bg-pitch-800 border border-white/5 rounded-sm p-1 min-w-max">
            <button
              onClick={() => setFilter('sport', 'all')}
              className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
                sport === 'all' ? 'bg-volt-400 text-pitch-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {sports.map(s => (
              <button
                key={s.slug}
                onClick={() => setFilter('sport', s.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all whitespace-nowrap ${
                  sport === s.slug ? 'bg-volt-400 text-pitch-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{s.icon}</span> {s.name}
              </button>
            ))}
          </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-pitch-800 border border-white/5 rounded-sm p-1 w-full sm:w-auto">
            {['upcoming', 'live', 'ended'].map(s => (
              <button
                key={s}
                onClick={() => setFilter('status', s)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
                  status === s ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-pitch-800 rounded-sm h-72 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24">
            <span className="text-6xl mb-4 block opacity-20">📭</span>
            <p className="font-display font-bold text-slate-500 text-xl uppercase tracking-wide">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}

        {total > 9 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-30">← Prev</button>
            <span className="font-mono text-slate-500 text-xs px-4">Page {page} of {Math.ceil(total / 9)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 9)} className="btn-ghost disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
