import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, UtensilsCrossed, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { foodApi } from '../../services/api'

const CATEGORIES = [
  { value: 'food',   label: 'Food',   emoji: '🍽️' },
  { value: 'drinks', label: 'Drinks', emoji: '🥤' },
  { value: 'snacks', label: 'Snacks', emoji: '🍿' },
]

const EMPTY = { name: '', description: '', price: '', category: 'food', emoji: '🍽️', sort_order: 0 }

export default function OwnerMenu() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    foodApi.ownerMenu().then(({ data }) => setItems(data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit   = (item) => { setForm({ ...item, price: item.price.toString() }); setModal(item) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    setSaving(true)
    try {
      if (modal === 'create') {
        await foodApi.createMenuItem(form)
        toast.success('Item added')
      } else {
        await foodApi.updateMenuItem(modal.id, form)
        toast.success('Item updated')
      }
      setModal(null); load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Remove this item?')) return
    await foodApi.deleteMenuItem(id).catch(() => toast.error('Delete failed'))
    toast.success('Item removed'); load()
  }

  const toggleAvailable = async (item) => {
    await foodApi.updateMenuItem(item.id, { is_available: !item.is_available })
    load()
  }

  const grouped = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display font-extrabold text-white text-2xl sm:text-3xl uppercase tracking-wide">Menu</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">
            Food & drinks available for pre-order
          </p>
        </div>
        <button onClick={openCreate} className="btn-volt text-xs w-full sm:w-auto justify-center"><Plus size={13} /> Add Item</button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-pitch-800 h-16 rounded-sm animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-14 sm:py-20 bg-pitch-800 border border-white/5 rounded-sm">
          <UtensilsCrossed size={36} className="text-slate-700 mx-auto mb-4" />
          <p className="font-display font-bold text-slate-500 uppercase tracking-wide mb-2">No menu items yet</p>
          <p className="text-slate-600 font-mono text-xs mb-6">Add food & drinks that fans can pre-order with their tickets</p>
          <button onClick={openCreate} className="btn-volt text-xs"><Plus size={12} /> Add First Item</button>
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.map(({ value, label, emoji }) => {
            const catItems = grouped[value] || []
            if (!catItems.length) return null
            return (
              <div key={value}>
                <h2 className="font-mono text-slate-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>{emoji}</span> {label}
                </h2>
                <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden divide-y divide-white/5">
                  {catItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-white text-sm truncate">{item.emoji} {item.name}</p>
                        {item.description && <p className="font-mono text-slate-500 text-[10px] truncate">{item.description}</p>}
                        <p className="font-mono text-volt-400 text-sm sm:hidden mt-0.5">₦{Number(item.price).toLocaleString()}</p>
                      </div>

                      <p className="hidden sm:block font-mono text-volt-400 text-sm shrink-0 w-20 text-right">
                        ₦{Number(item.price).toLocaleString()}
                      </p>

                      <button onClick={() => toggleAvailable(item)} className="hidden sm:flex items-center gap-1.5 transition-colors shrink-0 w-28">
                        {item.is_available
                          ? <ToggleRight size={18} className="text-volt-400" />
                          : <ToggleLeft  size={18} className="text-slate-600" />
                        }
                        <span className={`font-mono text-[10px] uppercase tracking-widest ${item.is_available ? 'text-volt-400' : 'text-slate-600'}`}>
                          {item.is_available ? 'Available' : 'Hidden'}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleAvailable(item)} className="sm:hidden p-1.5">
                          {item.is_available
                            ? <ToggleRight size={18} className="text-volt-400" />
                            : <ToggleLeft  size={18} className="text-slate-600" />
                          }
                        </button>
                        <button onClick={() => openEdit(item)} className="btn-ghost py-1 px-2"><Pencil size={12} /></button>
                        <button onClick={() => del(item.id)} className="btn-ghost py-1 px-2 text-ember-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-pitch-800 border border-white/10 rounded-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="font-display font-bold text-white uppercase tracking-wide">
                {modal === 'create' ? 'Add Menu Item' : 'Edit Item'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white"><X size={15} /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Emoji</label>
                  <input type="text" value={form.emoji} onChange={set('emoji')} className="input-dark text-center text-xl" maxLength={2} />
                </div>
                <div>
                  <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Category</label>
                  <select value={form.category} onChange={set('category')} className="input-dark">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Name *</label>
                <input type="text" required value={form.name} onChange={set('name')} className="input-dark" placeholder="e.g. Jollof Rice" />
              </div>
              <div>
                <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={set('description')} className="input-dark" placeholder="Optional short description" />
              </div>
              <div>
                <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Price (₦) *</label>
                <input type="number" required min="0" step="50" value={form.price} onChange={set('price')} className="input-dark" placeholder="1500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-outline flex-1 justify-center text-xs">Cancel</button>
                <button type="submit" disabled={saving} className="btn-volt flex-1 justify-center">
                  {saving ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
