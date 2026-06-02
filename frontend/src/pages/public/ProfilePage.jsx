import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../services/api'
import { User, Shield, Star, Eye, EyeOff, Check, ArrowRight } from 'lucide-react'

const roleConfig = {
  user:           { label: 'Fan',           color: 'text-volt-400  bg-volt-400/10  border-volt-400/20',  icon: '👤' },
  event_owner:    { label: 'Event Owner',   color: 'text-ice-400   bg-ice-400/10   border-ice-400/20',   icon: '🏟️' },
  platform_admin: { label: 'Platform Admin',color: 'text-ember-400 bg-ember-400/10 border-ember-400/20', icon: '⚡' },
}

export default function ProfilePage() {
  const { user, setUser, isEventOwner, isPlatformAdmin } = useAuth()

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone:     user?.phone     || '',
  })
  const [pwForm, setPwForm] = useState({
    current_password: '', password: '', confirm: ''
  })
  const [showPw,      setShowPw]      = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw,      setSavingPw]      = useState(false)
  const [activeTab,     setActiveTab]     = useState('profile')

  const setP  = (k) => (e) => setProfileForm(f => ({ ...f, [k]: e.target.value }))
  const setPw = (k) => (e) => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await authApi.updateMe(profileForm)
      setUser(data)
      toast.success('Profile updated')
    } catch { toast.error('Update failed') }
    finally { setSavingProfile(false) }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) { toast.error("New passwords don't match"); return }
    if (pwForm.password.length < 8)         { toast.error('Password must be at least 8 characters'); return }
    setSavingPw(true)
    try {
      await authApi.updateMe({
        password:         pwForm.password,
        current_password: pwForm.current_password,
      })
      toast.success('Password changed')
      setPwForm({ current_password: '', password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally { setSavingPw(false) }
  }

  const role   = roleConfig[user?.role] || roleConfig.user
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Profile header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center shrink-0">
            <span className="font-display font-extrabold text-volt-400 text-2xl">{initials}</span>
          </div>
          <div>
            <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-wide">
              {user?.full_name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`label-tag border text-[10px] ${role.color}`}>
                {role.icon} {role.label}
              </span>
              {user?.loyalty_points > 0 && (
                <span className="label-tag bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] flex items-center gap-1">
                  <Star size={9} /> {user.loyalty_points} pts
                </span>
              )}
            </div>
            <p className="font-mono text-slate-500 text-xs mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Owner / Admin shortcut banner */}
        {(isEventOwner || isPlatformAdmin) && (
          <div className={`rounded-sm border p-4 flex items-center justify-between mb-6 ${
            isPlatformAdmin
              ? 'bg-ember-400/10 border-ember-400/20'
              : 'bg-ice-400/10 border-ice-400/20'
          }`}>
            <div>
              <p className={`font-display font-bold text-sm uppercase tracking-wide ${isPlatformAdmin ? 'text-ember-400' : 'text-ice-400'}`}>
                {isPlatformAdmin ? 'Platform Admin Access' : 'Event Owner Dashboard'}
              </p>
              <p className="font-mono text-slate-400 text-xs mt-0.5">
                {isPlatformAdmin ? 'Manage all tenants, users and events' : 'Manage events, venues and bookings'}
              </p>
            </div>
            <Link
              to={isPlatformAdmin ? '/platform' : '/owner'}
              className="btn-ghost text-xs flex items-center gap-1 shrink-0"
            >
              Go to Dashboard <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-pitch-800 border border-white/5 rounded-sm p-1 w-fit mb-6">
          {[
            { id: 'profile',  label: 'Profile'  },
            { id: 'password', label: 'Password' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
                activeTab === t.id ? 'bg-volt-400 text-pitch-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <form onSubmit={saveProfile} className="bg-pitch-800 border border-white/10 rounded-sm p-6 space-y-5">
            <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm border-b border-white/5 pb-3">
              Personal Information
            </h2>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Full Name</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={setP('full_name')}
                className="input-dark"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="input-dark opacity-40 cursor-not-allowed"
              />
              <p className="font-mono text-slate-600 text-[10px] mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Phone</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={setP('phone')}
                className="input-dark"
                placeholder="+234 800 000 0000"
              />
            </div>

            <button type="submit" disabled={savingProfile} className="btn-volt">
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Password tab */}
        {activeTab === 'password' && (
          <form onSubmit={savePassword} className="bg-pitch-800 border border-white/10 rounded-sm p-6 space-y-5">
            <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm border-b border-white/5 pb-3">
              Change Password
            </h2>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Current Password</label>
              <input
                type="password"
                required
                value={pwForm.current_password}
                onChange={setPw('current_password')}
                className="input-dark"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={pwForm.password}
                  onChange={setPw('password')}
                  className="input-dark pr-10"
                  placeholder="Min 8 characters"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                value={pwForm.confirm}
                onChange={setPw('confirm')}
                className={`input-dark ${pwForm.confirm && pwForm.password !== pwForm.confirm ? 'border-red-400/60' : ''}`}
                placeholder="••••••••"
              />
              {pwForm.confirm && pwForm.password !== pwForm.confirm && (
                <p className="font-mono text-red-400 text-[10px] mt-1">Passwords don't match</p>
              )}
            </div>

            <button type="submit" disabled={savingPw} className="btn-volt">
              {savingPw ? 'Saving...' : 'Change Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
