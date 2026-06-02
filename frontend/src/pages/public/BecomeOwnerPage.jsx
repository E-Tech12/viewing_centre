import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, MapPin, Phone, FileText, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { ownerApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function BecomeOwnerPage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: '', description: '', address: '',
    city: '', state: '', phone: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/register?next=/become-owner'); return }
    setLoading(true)
    try {
      await ownerApi.registerTenant(form)
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  if (step === 2) return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-volt-400/10 border border-volt-400/20 flex items-center justify-center">
          <CheckCircle size={36} className="text-volt-400" />
        </div>
        <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide mb-3">
          Application Submitted
        </h1>
        <p className="text-slate-400 font-body text-sm leading-relaxed mb-6">
          Your event owner account is pending platform approval. We'll review your details and activate your account shortly. You'll be able to create events once approved.
        </p>
        <div className="space-y-2">
          <Link to="/" className="btn-volt w-full justify-center">Back to Home</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="label-tag bg-volt-400/10 border border-volt-400/20 text-volt-400 mx-auto mb-4 inline-flex">
            For Business Owners
          </div>
          <h1 className="font-display font-extrabold text-white text-4xl uppercase tracking-wide mb-3">
            List Your Venue
          </h1>
          <p className="text-slate-400 font-body text-sm max-w-lg mx-auto leading-relaxed">
            Sell tickets online, manage events, validate QR tickets at the door, and track your revenue — all in one place.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: '🎟️', title: 'Sell Tickets', sub: 'Online booking flow' },
            { icon: '📊', title: 'Analytics',    sub: 'Revenue & attendance' },
            { icon: '📱', title: 'QR Scanner',   sub: 'Validate at door' },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="bg-pitch-800 border border-white/5 rounded-sm p-4 text-center">
              <span className="text-2xl mb-2 block">{icon}</span>
              <p className="font-display font-bold text-white text-sm uppercase tracking-wide">{title}</p>
              <p className="font-mono text-slate-500 text-[10px] uppercase mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {!user ? (
          <div className="bg-pitch-800 border border-white/10 rounded-sm p-8 text-center">
            <p className="text-slate-400 font-body mb-5">You need an account to register as an event owner.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/register?next=/become-owner" className="btn-volt">Create Account <ArrowRight size={14} /></Link>
              <Link to="/login?next=/become-owner"    className="btn-outline">Sign In</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-pitch-800 border border-white/10 rounded-sm p-8 space-y-5">
            <h2 className="font-display font-bold text-white uppercase tracking-wide border-b border-white/5 pb-3">
              Business Details
            </h2>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">
                Business Name *
              </label>
              <input type="text" required value={form.business_name} onChange={set('business_name')}
                className="input-dark" placeholder="e.g. SportZone Abuja" />
            </div>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">
                Description
              </label>
              <textarea value={form.description} onChange={set('description')} rows={2}
                className="input-dark resize-none" placeholder="Brief description of your venue..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">City *</label>
                <input type="text" required value={form.city} onChange={set('city')} className="input-dark" placeholder="Lagos" />
              </div>
              <div>
                <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">State</label>
                <input type="text" value={form.state} onChange={set('state')} className="input-dark" placeholder="Lagos State" />
              </div>
            </div>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Address</label>
              <input type="text" value={form.address} onChange={set('address')} className="input-dark" placeholder="Street address" />
            </div>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-1.5">Phone *</label>
              <input type="tel" required value={form.phone} onChange={set('phone')} className="input-dark" placeholder="+234 800 000 0000" />
            </div>

            <div className="bg-volt-400/5 border border-volt-400/15 rounded-sm p-3">
              <p className="font-mono text-volt-400 text-[10px] uppercase tracking-widest mb-1">Platform Fee</p>
              <p className="font-body text-slate-400 text-xs">SportZone takes a 5% fee per successful ticket sale. No monthly charges.</p>
            </div>

            <button type="submit" disabled={loading} className="btn-volt w-full justify-center py-3.5">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
