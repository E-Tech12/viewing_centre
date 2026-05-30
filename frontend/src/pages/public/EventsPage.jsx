import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { eventsApi } from '../../services/api'
import EventCard from '../../components/ui/EventCard'

const CATEGORIES = ['all', 'football', 'gaming', 'entertainment']
const STATUSES = ['upcoming', 'live', 'ended']

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const category = searchParams.get('category') || 'all'
  const status = searchParams.get('status') || 'upcoming'
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = { page, per_page: 9, status }
    if (category !== 'all') params.category = category

    eventsApi.list(params)
      .then(({ data }) => { setEvents(data.events); setTotal(data.total) })
      .finally(() => setLoading(false))
  }, [category, status, page])

  const setFilter = (key, val) => {
    setSearchParams(prev => { prev.set(key, val); return prev })
    setPage(1)
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Header */}
      <div className="border-b border-white/5 pb-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="font-display font-900 text-white text-4xl uppercase tracking-wide mb-1">Events</h1>
          <p className="text-slate-500 font-body text-sm">{total} events available</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Category */}
          <div className="flex items-center gap-1 bg-pitch-800 border border-white/5 rounded-sm p-1">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilter('category', c)}
                className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
                  category === c ? 'bg-volt-400 text-pitch-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 bg-pitch-800 border border-white/5 rounded-sm p-1">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setFilter('status', s)}
                className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
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
            <p className="font-display font-700 text-slate-500 text-xl uppercase tracking-wide">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}

        {/* Pagination */}
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
