import { useState, useEffect } from 'react'
import { Plus, Pencil, X, Check, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { ownerApi } from '../../services/api'

const EMPTY = { name: '', address: '', city: '', state: '', total_capacity: '' }

export default function OwnerVenues() {
  const [venues,  setVenues]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)

  const load = () => { ownerApi.myVenues().then(({ data }) => setVenues(data)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = (v)  => { setForm({ ...v }); setModal(v) }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'create') { await ownerApi.createVenue(form); toast.success('Venue created') }
      else { await ownerApi.updateVenue(modal.id, form); toast.success('Venue updated') }
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">Venues</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">Manage your physical locations</p>
        </div>
        <button onClick={openCreate} className="btn-volt text-xs"><Plus size={13} /> Add Venue</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="bg-pitch-800 h-32 rounded-sm animate-pulse" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20 bg-pitch-800 border border-white/5 rounded-sm">
          <MapPin size={36} className="text-slate-700 mx-auto mb-4" />
          <p className="font-display font-bold text-slate-500 uppercase tracking-wide mb-4">No venues yet</p>
          <button onClick={openCreate} className="btn-volt text-xs"><Plus size={12} /> Add First Venue</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {venues.map(v => (
            <div key={v.id} className="bg-pitch-800 border border-white/5 rounded-sm p-5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-white text-base uppercase tracking-wide">{v.name}</h3>
                  <p className="font-mono text-slate-500 text-xs">{v.city}{v.state ? `, ${v.state}` : ''}</p>
                </div>
                <button onClick={() => openEdit(v)} className="text-slate-500 hover:text-volt-400 transition-colors">
                  <Pencil size={14} />
                </button>
              </div>
              {v.address && <p className="font-body text-slate-500 text-xs mb-2">{v.address}</p>}
              <div className="flex items-center gap-2">
                <span className="label-tag bg-volt-400/10 text-volt-400 border border-volt-400/20 text-[10px]">
                  {v.total_capacity} capacity
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-pitch-800 border border-white/10 rounded-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="font-display font-bold text-white uppercase tracking-wide">
                {modal === 'create' ? 'Add Venue' : 'Edit Venue'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white"><X size={15} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              {[
                { k: 'name',           label: 'Venue Name *',  type: 'text',   ph: 'SportZone VI', req: true },
                { k: 'address',        label: 'Address',       type: 'text',   ph: '12 Adeola Odeku St' },
                { k: 'city',           label: 'City *',        type: 'text',   ph: 'Lagos', req: true },
                { k: 'state',          label: 'State',         type: 'text',   ph: 'Lagos State' },
                { k: 'total_capacity', label: 'Total Capacity',type: 'number', ph: '200' },
              ].map(({ k, label, type, ph, req }) => (
                <div key={k}>
                  <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">{label}</label>
                  <input type={type} value={form[k]} onChange={set(k)} className="input-dark" placeholder={ph} required={req} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-outline flex-1 justify-center text-xs">Cancel</button>
                <button type="submit" disabled={saving} className="btn-volt flex-1 justify-center">
                  {saving ? 'Saving...' : 'Save Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
