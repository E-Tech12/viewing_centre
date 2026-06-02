import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [params]   = useSearchParams()
  const next       = params.get('next')

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)

      // Role-based redirect — each role has its own home
      if (next) {
        navigate(next)
      } else if (user.role === 'platform_admin') {
        navigate('/platform')
      } else if (user.role === 'event_owner') {
        navigate('/owner')
      } else {
        navigate('/')
      }

      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid email or password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-10">
      {/* Background glow */}
      <div className="absolute inset-0 bg-volt-glow pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(200,241,53,0.04),transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-volt-400 rounded-sm flex items-center justify-center">
              <span className="font-display font-extrabold text-pitch-950 text-sm">SZ</span>
            </div>
            <span className="font-display font-extrabold text-2xl text-white tracking-[0.2em] uppercase">
              Sport<span className="text-volt-400">Zone</span>
            </span>
          </Link>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">
            Sign in to your account
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={submit} className="bg-pitch-800 border border-white/10 rounded-sm p-8 space-y-5 shadow-2xl">

          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input-dark"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-slate-400 text-[10px] uppercase tracking-widest">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-dark pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-volt w-full justify-center py-3.5 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-pitch-950/40 border-t-pitch-950 rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In <ArrowRight size={14} />
              </span>
            )}
          </button>

          <div className="border-t border-white/5 pt-4 space-y-2 text-center">
            <p className="font-mono text-slate-500 text-xs">
              No account?{' '}
              <Link to="/register" className="text-volt-400 hover:underline transition-colors">
                Create one free
              </Link>
            </p>
            <p className="font-mono text-slate-600 text-xs">
              Own a venue?{' '}
              <Link to="/become-owner" className="text-ice-400 hover:underline transition-colors">
                List your venue →
              </Link>
            </p>
          </div>
        </form>

        {/* Role hint */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: '👤', label: 'Fans',        sub: 'Buy & track tickets' },
            { icon: '🏟️', label: 'Venue Owners', sub: 'Sell & manage events' },
            { icon: '⚡', label: 'Platform',    sub: 'Admin access' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="bg-pitch-800/50 border border-white/5 rounded-sm p-3">
              <span className="text-lg block mb-1">{icon}</span>
              <p className="font-display font-bold text-white text-[10px] uppercase tracking-wide">{label}</p>
              <p className="font-mono text-slate-600 text-[9px] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
