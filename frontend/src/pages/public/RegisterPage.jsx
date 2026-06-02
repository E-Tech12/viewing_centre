import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Check, ArrowRight, User, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8,          label: 'At least 8 characters'  },
  { test: (p) => /[A-Z]/.test(p),        label: 'One uppercase letter'    },
  { test: (p) => /[0-9]/.test(p),        label: 'One number'              },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const next         = params.get('next')

  const [accountType, setAccountType] = useState('user') // 'user' | 'owner'
  const [form,    setForm]    = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const passwordValid  = PASSWORD_RULES.every(r => r.test(form.password))
  const passwordsMatch = form.password === form.confirm

  const submit = async (e) => {
    e.preventDefault()
    if (!passwordValid)  { toast.error('Password does not meet requirements'); return }
    if (!passwordsMatch) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const user = await register({
        full_name: form.full_name,
        email:     form.email,
        phone:     form.phone,
        password:  form.password,
      })

      toast.success(`Welcome to SportZone, ${user.full_name.split(' ')[0]}!`)

      // If they chose "venue owner", send them to register their venue
      if (accountType === 'owner') {
        navigate('/become-owner')
      } else if (next) {
        navigate(next)
      } else {
        navigate('/')
      }
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
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">Create your account</p>
        </div>

        {/* Account type selector */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { type: 'user',  icon: User,      label: 'Fan / Viewer',    sub: 'Buy tickets, attend events' },
            { type: 'owner', icon: Building2, label: 'Venue Owner',     sub: 'Sell tickets, manage events' },
          ].map(({ type, icon: Icon, label, sub }) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={`relative p-4 rounded-sm border text-left transition-all ${
                accountType === type
                  ? 'border-volt-400 bg-volt-400/10'
                  : 'border-white/10 bg-pitch-800 hover:border-white/20'
              }`}
            >
              {accountType === type && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-volt-400 flex items-center justify-center">
                  <Check size={9} className="text-pitch-950" />
                </div>
              )}
              <Icon size={18} className={accountType === type ? 'text-volt-400 mb-2' : 'text-slate-500 mb-2'} />
              <p className={`font-display font-bold text-sm uppercase tracking-wide ${accountType === type ? 'text-volt-400' : 'text-white'}`}>
                {label}
              </p>
              <p className="font-mono text-slate-500 text-[10px] mt-0.5">{sub}</p>
            </button>
          ))}
        </div>

        {accountType === 'owner' && (
          <div className="bg-ice-400/10 border border-ice-400/20 rounded-sm px-4 py-3 mb-5 flex items-start gap-2">
            <Building2 size={13} className="text-ice-400 mt-0.5 shrink-0" />
            <p className="font-mono text-ice-400 text-xs leading-relaxed">
              You'll fill in your venue details after creating your account. Platform approval required before going live.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="bg-pitch-800 border border-white/10 rounded-sm p-8 space-y-4 shadow-2xl">

          {/* Name */}
          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Full Name *</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={form.full_name}
              onChange={set('full_name')}
              className="input-dark"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Email Address *</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              className="input-dark"
              placeholder="you@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">
              Phone {accountType === 'owner' ? '*' : '(optional)'}
            </label>
            <input
              type="tel"
              required={accountType === 'owner'}
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
              className="input-dark"
              placeholder="+234 800 000 0000"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Password *</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                className="input-dark pr-10"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Password strength indicators */}
            {form.password && (
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map(rule => (
                  <div key={rule.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                      rule.test(form.password) ? 'bg-volt-400' : 'bg-white/10'
                    }`}>
                      {rule.test(form.password) && <Check size={7} className="text-pitch-950" />}
                    </div>
                    <span className={`font-mono text-[10px] transition-colors ${
                      rule.test(form.password) ? 'text-volt-400' : 'text-slate-600'
                    }`}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Confirm Password *</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              className={`input-dark transition-all ${
                form.confirm && !passwordsMatch ? 'border-red-400/60 focus:border-red-400' : ''
              }`}
              placeholder="••••••••"
            />
            {form.confirm && !passwordsMatch && (
              <p className="font-mono text-red-400 text-[10px] mt-1">Passwords don't match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordValid || !passwordsMatch}
            className="btn-volt w-full justify-center py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-pitch-950/40 border-t-pitch-950 rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {accountType === 'owner' ? 'Create Account & List Venue' : 'Create Free Account'}
                <ArrowRight size={14} />
              </span>
            )}
          </button>

          <p className="text-center font-mono text-slate-500 text-xs pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-volt-400 hover:underline">Sign in</Link>
          </p>
        </form>

        {/* T&C note */}
        <p className="text-center font-mono text-slate-600 text-[10px] mt-4 px-4">
          By creating an account you agree to our Terms of Service and Privacy Policy.
          SportZone charges a 5% platform fee on all ticket sales.
        </p>
      </div>
    </div>
  )
}
