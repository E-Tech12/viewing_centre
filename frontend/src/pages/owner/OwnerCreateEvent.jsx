import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Plus, Trash2, ChevronLeft, Check, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { ownerApi, sportsApi } from '../../services/api'

const COLORS = ['#F59E0B','#3B82F6','#8B5CF6','#EC4899','#10B981','#EF4444','#F97316','#06B6D4']

const EMPTY_CATEGORY = { name: '', description: '', price: '', capacity: '', color_hex: '#3B82F6', sort_order: 0 }

export default function OwnerCreateEvent() {
  const navigate  = useNavigate()
  const { id }    = useParams()  // if present = edit mode
  const isEdit    = !!id

  const [step,     setStep]     = useState(1)  // 1=sport, 2=details, 3=tickets
  const [sports,   setSports]   = useState([])
  const [venues,   setVenues]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  const [form, setForm] = useState({
    sport_id: '', venue_id: '', title: '', description: '',
    starts_at: '', banner_url: '', is_public: true, is_featured: false,
    sport_meta: {},
    ticket_categories: [{ ...EMPTY_CATEGORY }],
  })

  useEffect(() => {
    Promise.all([sportsApi.list(), ownerApi.myVenues()]).then(([s, v]) => {
      setSports(s.data)
      setVenues(v.data)
    })
    if (isEdit) {
      ownerApi.myEvents().then(({ data }) => {
        const ev = data.find(e => e.id === id)
        if (ev) {
          setForm({
            sport_id: ev.sport_id, venue_id: ev.venue_id, title: ev.title,
            description: ev.description || '', banner_url: ev.banner_url || '',
            starts_at: ev.starts_at?.slice(0, 16) || '',
            is_public: ev.is_public, is_featured: ev.is_featured,
            sport_meta: ev.sport_meta || {},
            ticket_categories: ev.ticket_categories?.length
              ? ev.ticket_categories.map(tc => ({
                  name: tc.name, description: tc.description || '',
                  price: tc.price, capacity: tc.capacity,
                  color_hex: tc.color_hex, sort_order: tc.sort_order,
                }))
              : [{ ...EMPTY_CATEGORY }],
          })
          setStep(2)
        }
      })
    }
  }, [id])

  const selectedSport = sports.find(s => s.id === form.sport_id)
  const set  = (k)    => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setMeta = (k) => (e) => setForm(f => ({ ...f, sport_meta: { ...f.sport_meta, [k]: e.target.value } }))

  const addCategory = () => setForm(f => ({
    ...f,
    ticket_categories: [...f.ticket_categories, { ...EMPTY_CATEGORY, sort_order: f.ticket_categories.length }],
  }))

  const removeCategory = (i) => setForm(f => ({
    ...f,
    ticket_categories: f.ticket_categories.filter((_, idx) => idx !== i),
  }))

  const setCategory = (i, k, v) => setForm(f => ({
    ...f,
    ticket_categories: f.ticket_categories.map((c, idx) => idx === i ? { ...c, [k]: v } : c),
  }))

  const save = async () => {
    const validCats = form.ticket_categories.filter(c => c.name && c.price && c.capacity)
    if (!validCats.length) { toast.error('Add at least one ticket category with name, price and capacity'); return }
    setSaving(true)
    try {
      const payload = { ...form, ticket_categories: validCats }
      if (isEdit) {
        await ownerApi.updateEvent(id, payload)
        toast.success('Event updated')
      } else {
        await ownerApi.createEvent(payload)
        toast.success('Event created!')
      }
      navigate('/owner/events')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save event')
    } finally { setSaving(false) }
  }

  // ── Step 1: Sport selection ──────────────────────────────────
  if (step === 1) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/owner/events" className="text-slate-500 hover:text-white transition-colors"><ChevronLeft size={18} /></Link>
        <div>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-wide">Create Event</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-0.5">Step 1 of 3 — Select Sport</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sports.map(sport => (
          <button
            key={sport.id}
            onClick={() => { setForm(f => ({ ...f, sport_id: sport.id })); setStep(2) }}
            className={`group relative bg-pitch-800 border rounded-sm p-5 text-left hover:border-volt-400/40 transition-all ${
              form.sport_id === sport.id ? 'border-volt-400' : 'border-white/5'
            }`}
          >
            <span className="text-3xl mb-3 block">{sport.icon}</span>
            <p className="font-display font-bold text-white text-sm uppercase tracking-wide">{sport.name}</p>
          </button>
        ))}
      </div>
    </div>
  )

  // ── Step 2: Event details ────────────────────────────────────
  if (step === 2) return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setStep(1)} className="text-slate-500 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
        <div>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-wide">Event Details</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-0.5">
            Step 2 of 3 — {selectedSport?.icon} {selectedSport?.name}
          </p>
        </div>
      </div>

      <div className="bg-pitch-800 border border-white/5 rounded-sm p-6 space-y-5">

        {/* Venue */}
        <div>
          <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Venue *</label>
          {venues.length === 0 ? (
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-sm p-3 flex items-center gap-2">
              <span className="font-mono text-amber-400 text-xs">No venues — </span>
              <Link to="/owner/venues" className="font-mono text-volt-400 text-xs underline">create one first</Link>
            </div>
          ) : (
            <select value={form.venue_id} onChange={set('venue_id')} className="input-dark" required>
              <option value="">-- Select venue --</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name} — {v.city}</option>)}
            </select>
          )}
        </div>

        {/* Generic fields */}
        <div>
          <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Event Title *</label>
          <input type="text" value={form.title} onChange={set('title')} required className="input-dark"
            placeholder="e.g. UCL Semi-Final Screening" />
        </div>

        {/* Sport-specific metadata fields */}
        {selectedSport?.metadata_schema?.map(field => (
          <div key={field.key}>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">
              {field.label} {field.required && '*'}
            </label>
            <input type="text" value={form.sport_meta[field.key] || ''}
              onChange={setMeta(field.key)} className="input-dark"
              placeholder={field.label}
              required={field.required}
            />
          </div>
        ))}

        <div>
          <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Start Date & Time *</label>
          <input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} className="input-dark" required />
        </div>

        <div>
          <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Banner Image URL</label>
          <input type="url" value={form.banner_url} onChange={set('banner_url')} className="input-dark" placeholder="https://..." />
        </div>

        <div>
          <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={2} className="input-dark resize-none" />
        </div>

        <div className="flex gap-4">
          {[['is_public', 'Public Event'], ['is_featured', 'Feature on homepage']].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer" onClick={() => setForm(f => ({ ...f, [k]: !f[k] }))}>
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
                form[k] ? 'bg-volt-400 border-volt-400' : 'border-white/20 bg-transparent'
              }`}>
                {form[k] && <Check size={10} className="text-pitch-950" />}
              </div>
              <span className="font-mono text-slate-400 text-xs uppercase tracking-widest">{label}</span>
            </label>
          ))}
        </div>

        <button onClick={() => setStep(3)} disabled={!form.venue_id || !form.title || !form.starts_at}
          className="btn-volt w-full justify-center">
          Next: Set Ticket Prices <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )

  // ── Step 3: Ticket categories ────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setStep(2)} className="text-slate-500 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
        <div>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-wide">Ticket Categories</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-0.5">Step 3 of 3 — Set prices & capacity</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {form.ticket_categories.map((cat, i) => (
          <div key={i} className="bg-pitch-800 border border-white/5 rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-400 text-[10px] uppercase tracking-widest">Category {i + 1}</span>
              {form.ticket_categories.length > 1 && (
                <button onClick={() => removeCategory(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-slate-500 text-[9px] uppercase tracking-widest mb-1">Name *</label>
                <input type="text" value={cat.name} onChange={e => setCategory(i, 'name', e.target.value)}
                  className="input-dark text-sm" placeholder="e.g. VIP, Regular, Balcony" />
              </div>
              <div>
                <label className="block font-mono text-slate-500 text-[9px] uppercase tracking-widest mb-1">Description</label>
                <input type="text" value={cat.description} onChange={e => setCategory(i, 'description', e.target.value)}
                  className="input-dark text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block font-mono text-slate-500 text-[9px] uppercase tracking-widest mb-1">Price (₦) *</label>
                <input type="number" min="0" value={cat.price} onChange={e => setCategory(i, 'price', e.target.value)}
                  className="input-dark text-sm" placeholder="5000" />
              </div>
              <div>
                <label className="block font-mono text-slate-500 text-[9px] uppercase tracking-widest mb-1">Capacity *</label>
                <input type="number" min="1" value={cat.capacity} onChange={e => setCategory(i, 'capacity', e.target.value)}
                  className="input-dark text-sm" placeholder="50" />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block font-mono text-slate-500 text-[9px] uppercase tracking-widest mb-1.5">Colour</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setCategory(i, 'color_hex', c)}
                    className={`w-6 h-6 rounded-sm transition-all ${cat.color_hex === c ? 'ring-2 ring-white ring-offset-1 ring-offset-pitch-800 scale-110' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addCategory}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 rounded-sm text-slate-500 hover:border-volt-400/30 hover:text-volt-400 transition-all text-xs font-mono uppercase tracking-widest mb-6">
        <Plus size={13} /> Add Category
      </button>

      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="btn-outline flex-1 justify-center text-xs">Back</button>
        <button onClick={save} disabled={saving} className="btn-volt flex-1 justify-center">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Publish Event'}
        </button>
      </div>
    </div>
  )
}
