import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { ownerApi } from '../../services/api'
import { Building2, DollarSign } from 'lucide-react'

export default function OwnerSettings() {
  const [tenant,  setTenant]  = useState(null)
  const [form,    setForm]    = useState({ business_name:'', description:'', address:'', city:'', state:'', phone:'', logo_url:'' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    ownerApi.myTenant().then(({ data }) => {
      setTenant(data)
      setForm({ business_name: data.business_name || '', description: data.description || '',
        address: data.address || '', city: data.city || '', state: data.state || '',
        phone: data.phone || '', logo_url: data.logo_url || '' })
    }).finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { const { data } = await ownerApi.updateTenant(form); setTenant(data); toast.success('Settings saved') }
    catch { toast.error('Update failed') } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <h1 className="font-display font-extrabold text-white text-2xl sm:text-3xl uppercase tracking-wide mb-8">Settings</h1>

      {/* Fee info */}
      <div className="bg-pitch-800 border border-white/5 rounded-sm p-5 mb-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center shrink-0">
          <DollarSign size={16} className="text-volt-400" />
        </div>
        <div>
          <p className="font-display font-bold text-white uppercase tracking-wide text-sm mb-1">Platform Fee</p>
          <p className="font-body text-slate-400 text-sm">
            SportZone charges a <span className="text-volt-400 font-bold">{tenant?.platform_fee_pct}%</span> fee per ticket sale. Your net per booking = ticket price − {tenant?.platform_fee_pct}%.
          </p>
          <p className="font-mono text-slate-600 text-xs mt-1 uppercase tracking-widest">
            Total earned: ₦{tenant?.total_revenue?.toLocaleString()} · Total fees: ₦{tenant?.total_fees?.toLocaleString()}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-pitch-800 border border-white/5 rounded-sm p-6 space-y-4">
        <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm border-b border-white/5 pb-3">Business Profile</h2>
        {[
          { k: 'business_name', label: 'Business Name', req: true },
          { k: 'phone',         label: 'Phone',         req: true },
          { k: 'address',       label: 'Address' },
          { k: 'city',          label: 'City', req: true },
          { k: 'state',         label: 'State' },
          { k: 'logo_url',      label: 'Logo URL' },
        ].map(({ k, label, req }) => (
          <div key={k}>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">{label} {req && '*'}</label>
            <input type="text" value={form[k]} onChange={set(k)} className="input-dark" required={req} />
          </div>
        ))}
        <div>
          <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={2} className="input-dark resize-none" />
        </div>
        <button type="submit" disabled={saving} className="btn-volt">{saving ? 'Saving...' : 'Save Settings'}</button>
      </form>
    </div>
  )
}
