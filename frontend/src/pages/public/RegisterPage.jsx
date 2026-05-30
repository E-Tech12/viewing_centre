import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password })
      toast.success('Account created!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 bg-volt-glow pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-volt-400 rounded-sm flex items-center justify-center">
              <span className="font-display font-900 text-pitch-950 text-sm">SZ</span>
            </div>
            <span className="font-display font-900 text-2xl text-white tracking-widest uppercase">
              Sport<span className="text-volt-400">Zone</span>
            </span>
          </Link>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-3">Create your account</p>
        </div>

        <form onSubmit={submit} className="bg-pitch-800 border border-white/10 rounded-sm p-8 space-y-4">
          {[
            { k: 'full_name', label: 'Full Name', type: 'text', ph: 'John Doe' },
            { k: 'email', label: 'Email', type: 'email', ph: 'you@example.com' },
            { k: 'phone', label: 'Phone (optional)', type: 'tel', ph: '+234 800 000 0000' },
          ].map(({ k, label, type, ph }) => (
            <div key={k}>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">{label}</label>
              <input type={type} value={form[k]} onChange={set(k)} className="input-dark" placeholder={ph} required={k !== 'phone'} />
            </div>
          ))}

          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} className="input-dark pr-10" placeholder="Min 8 characters" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Confirm Password</label>
            <input type="password" value={form.confirm} onChange={set('confirm')} className="input-dark" placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} className="btn-volt w-full justify-center mt-2">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center font-mono text-slate-500 text-xs">
            Already have an account?{' '}
            <Link to="/login" className="text-volt-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
