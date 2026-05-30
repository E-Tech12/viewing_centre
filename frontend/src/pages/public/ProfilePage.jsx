import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../services/api'
import { User, Star, Shield } from 'lucide-react'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.updateMe(form)
      setUser(data)
      toast.success('Profile updated')
    } catch { toast.error('Update failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center">
            <span className="font-display font-900 text-volt-400 text-2xl">{user?.full_name?.[0]}</span>
          </div>
          <div>
            <h1 className="font-display font-900 text-white text-2xl uppercase tracking-wide">{user?.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="label-tag bg-volt-400/10 text-volt-400 border border-volt-400/20 flex items-center gap-1">
                <Shield size={9} /> {user?.role}
              </span>
              <span className="label-tag bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center gap-1">
                <Star size={9} /> {user?.loyalty_points} pts
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-pitch-800 border border-white/10 rounded-sm p-6 space-y-5">
          <h2 className="font-display font-700 text-white uppercase tracking-wide text-sm border-b border-white/5 pb-3">Edit Profile</h2>

          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="input-dark" />
          </div>

          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Email</label>
            <input type="email" value={user?.email} disabled className="input-dark opacity-50 cursor-not-allowed" />
          </div>

          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-dark" />
          </div>

          <button type="submit" disabled={loading} className="btn-volt">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
