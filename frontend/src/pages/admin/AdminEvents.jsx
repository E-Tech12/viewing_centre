import { useState, useEffect } from 'react'
import { eventsApi } from '../../services/api'
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EMPTY_FORM = {
  title: '', match_teams: '', competition: '', category: 'football',
  starts_at: '', banner_url: '', description: '', is_featured: false,
  venue_id: '', sections: [],
}

export default function AdminEvents() {
  const [events, setEvents]       = useState([])
  const [venues, setVenues]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)

  const [venueError, setVenueError] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      eventsApi.list({ per_page: 50, status: 'upcoming' }),
      eventsApi.getVenues(),
    ]).then(([evRes, vRes]) => {
      setEvents(evRes.data.events)
      setVenues(vRes.data)
      setVenueError(null)
    }).catch(err => {
      setVenueError(err.response?.data?.error || err.message || 'Failed to load venues')
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // When venue changes, pre-populate sections list with empty prices
  const handleVenueChange = (venueId) => {
    const venue = venues.find(v => v.id === venueId)
    const sections = (venue?.sections || []).map(s => ({
      section_id: s.id,
      name: s.name,
      category: s.category,
      capacity: s.capacity,
      price: '',
    }))
    setForm(f => ({ ...f, venue_id: venueId, sections }))
  }

  const handleSectionPrice = (sectionId, price) => {
    setForm(f => ({
      ...f,
      sections: f.sections.map(s =>
        s.section_id === sectionId ? { ...s, price } : s
      ),
    }))
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    // Auto-select first venue if only one
    if (venues.length === 1) handleVenueChange(venues[0].id)
    setModal('create')
  }

  const openEdit = (ev) => {
    const venue = venues.find(v => v.id === ev.venue_id)
    // Merge existing section prices with venue sections
    const sections = (venue?.sections || []).map(s => {
      const existing = ev.sections?.find(es => es.section_id === s.id)
      return {
        section_id: s.id,
        name: s.name,
        category: s.category,
        capacity: s.capacity,
        price: existing ? existing.price : '',
      }
    })
    setForm({
      ...EMPTY_FORM, ...ev,
      starts_at: ev.starts_at ? ev.starts_at.slice(0, 16) : '',
      sections,
    })
    setModal(ev)
  }

  const save = async (e) => {
    e.preventDefault()

    // Validate: at least one section must have a price
    const pricedSections = form.sections.filter(s => s.price && Number(s.price) > 0)
    if (pricedSections.length === 0) {
      toast.error('Set a price for at least one seating section')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        sections: pricedSections.map(s => ({
          section_id: s.section_id,
          price: Number(s.price),
        })),
      }
      if (modal === 'create') {
        await eventsApi.create(payload)
        toast.success('Event created')
      } else {
        await eventsApi.update(modal.id, payload)
        toast.success('Event updated')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save event')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    try {
      await eventsApi.delete(id)
      toast.success('Event deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const set = (k) => (e) =>
    setForm(f => ({ ...f, [k]: e.target?.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">Events</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">{events.length} upcoming</p>
        </div>
        <button onClick={openCreate} className="btn-volt text-xs">
          <Plus size={14} /> New Event
        </button>
      </div>

      {/* Error banner */}
      {venueError && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-sm p-4 flex items-start gap-3 mb-6">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-mono text-red-400 text-xs font-bold mb-1">Could not load venues</p>
            <p className="font-mono text-red-300 text-xs">{venueError}</p>
          </div>
        </div>
      )}

      {/* No venues warning */}
      {!loading && !venueError && venues.length === 0 && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-sm p-4 flex items-start gap-3 mb-6">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="font-mono text-amber-400 text-xs">
            No venues found. Run <code className="bg-black/30 px-1 rounded">flask seed</code> in the backend to create the default venue and seats.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-pitch-800 h-16 rounded-sm animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-pitch-800 border border-white/5 rounded-sm">
          <span className="text-5xl mb-4 block opacity-20">📅</span>
          <p className="font-display font-bold text-slate-500 uppercase tracking-wide mb-4">No events yet</p>
          <button onClick={openCreate} className="btn-volt text-xs">
            <Plus size={14} /> Create First Event
          </button>
        </div>
      ) : (
        <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Event', 'Category', 'Date', 'Sections', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-body text-white text-sm">{ev.match_teams || ev.title}</p>
                    {ev.competition && <p className="font-mono text-slate-500 text-[10px]">{ev.competition}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="label-tag bg-white/5 text-slate-400 text-[10px]">{ev.category}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-400 text-xs">
                    {format(new Date(ev.starts_at), 'dd MMM yy · HH:mm')}
                  </td>
                  <td className="px-5 py-4">
                    {ev.sections?.length > 0 ? (
                      <span className="label-tag bg-volt-400/10 text-volt-400 text-[10px]">
                        {ev.sections.length} section{ev.sections.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="label-tag bg-red-400/10 text-red-400 text-[10px]">No pricing</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`label-tag text-[10px] ${
                      ev.status === 'live'     ? 'bg-red-500/10 text-red-400'
                    : ev.status === 'upcoming' ? 'bg-volt-400/10 text-volt-400'
                    :                            'bg-white/5 text-slate-400'
                    }`}>{ev.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(ev)} className="btn-ghost py-1 px-2"><Pencil size={12} /></button>
                      <button onClick={() => del(ev.id)} className="btn-ghost py-1 px-2 text-ember-400 hover:text-ember-400"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────── */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-pitch-800 border border-white/10 rounded-sm shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-pitch-800 z-10">
              <h2 className="font-display font-bold text-white uppercase tracking-wide">
                {modal === 'create' ? 'Create Event' : 'Edit Event'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={save} className="p-6 space-y-5">

              {/* Basic fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Event Title *</label>
                  <input type="text" required value={form.title} onChange={set('title')} className="input-dark" placeholder="e.g. UCL Final Screening" />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Match Teams</label>
                  <input type="text" value={form.match_teams} onChange={set('match_teams')} className="input-dark" placeholder="e.g. Arsenal vs Chelsea" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Competition</label>
                    <input type="text" value={form.competition} onChange={set('competition')} className="input-dark" placeholder="e.g. Premier League" />
                  </div>
                  <div>
                    <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Category *</label>
                    <select value={form.category} onChange={set('category')} className="input-dark">
                      {['football', 'gaming', 'entertainment'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Start Date & Time *</label>
                  <input type="datetime-local" required value={form.starts_at} onChange={set('starts_at')} className="input-dark" />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Banner Image URL</label>
                  <input type="url" value={form.banner_url} onChange={set('banner_url')} className="input-dark" placeholder="https://..." />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={2} className="input-dark resize-none" />
                </div>
              </div>

              {/* Venue selector */}
              <div>
                <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Venue *</label>
                {venues.length === 0 ? (
                  <p className="text-red-400 font-mono text-xs">No venues — run <code>flask seed</code> first</p>
                ) : (
                  <select
                    value={form.venue_id}
                    onChange={e => handleVenueChange(e.target.value)}
                    className="input-dark"
                    required
                  >
                    <option value="">-- Select venue --</option>
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name} — {v.location}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Section pricing — THE KEY MISSING PIECE */}
              {form.sections.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="font-mono text-slate-400 text-[10px] uppercase tracking-widest">Ticket Prices per Section *</label>
                  </div>
                  <div className="space-y-2">
                    {form.sections.map(s => (
                      <div key={s.section_id} className="flex items-center gap-3 bg-pitch-700 border border-white/5 rounded-sm px-4 py-3">
                        <div className="flex-1">
                          <p className="font-display font-bold text-white text-sm uppercase tracking-wide">{s.name}</p>
                          <p className="font-mono text-slate-500 text-[10px]">{s.category} · {s.capacity} seats</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-sm">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="e.g. 5000"
                            value={s.price}
                            onChange={e => handleSectionPrice(s.section_id, e.target.value)}
                            className="input-dark w-32 text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="font-mono text-slate-600 text-[10px] mt-2">Leave price empty to exclude a section from this event</p>
                </div>
              )}

              {/* Featured toggle */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
              >
                <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${
                  form.is_featured ? 'bg-volt-400 border-volt-400' : 'border-white/20 bg-transparent'
                }`}>
                  {form.is_featured && <Check size={11} className="text-pitch-950" />}
                </div>
                <span className="font-mono text-slate-400 text-xs uppercase tracking-widest">Feature this event on homepage</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button type="button" onClick={() => setModal(null)} className="btn-outline flex-1 justify-center text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-volt flex-1 justify-center">
                  {saving ? 'Saving...' : modal === 'create' ? 'Create Event' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
