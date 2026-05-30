import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()

  const navigate = useNavigate()

  const [params] = useSearchParams()

  const next = params.get('next') || '/events'

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [showPw, setShowPw] = useState(false)

  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()

    setLoading(true)

    try {
      const loggedInUser = await login(form.email, form.password)

      toast.success(`Welcome back, ${loggedInUser.full_name || 'Champion'}!`)

      if (
        loggedInUser.role === 'admin' ||
        loggedInUser.role === 'staff'
      ) {
        navigate('/admin')
      } else {
        navigate(next)
      }
    } catch (error) {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070&auto=format&fit=crop"
          alt="Football Stadium"
          className="w-full h-full object-cover opacity-20"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-pitch-950 via-pitch-950/95 to-pitch-950/80" />
      </div>

      <div className="absolute inset-0 bg-volt-glow pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-volt-400 rounded-sm flex items-center justify-center">
              <span className="font-display font-900 text-pitch-950 text-sm">
                SZ
              </span>
            </div>

            <span className="font-display font-900 text-2xl text-white tracking-widest uppercase">
              Sport<span className="text-volt-400">Zone</span>
            </span>
          </Link>

          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-3">
            Welcome back to the arena
          </p>
        </div>

        <form className="bg-pitch-800/90 backdrop-blur border border-white/10 rounded-sm p-8 space-y-5" onSubmit={submit}>
          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">
              Email
            </label>

            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  email: e.target.value,
                }))
              }
              className="input-dark"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    password: e.target.value,
                  }))
                }
                className="input-dark pr-10"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-volt w-full justify-center mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center font-mono text-slate-500 text-xs">
            No account?{' '}
            <Link
              to="/register"
              className="text-volt-400 hover:underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}