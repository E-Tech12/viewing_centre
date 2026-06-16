import { useState, useEffect } from 'react'
import { platformApi } from '../../services/api'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function PlatformUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)
  const [search,  setSearch]  = useState('')

  const load = (q = '') => {
    setLoading(true)
    platformApi.users({ search: q, per_page: 30 })
      .then(({ data }) => { setUsers(data.users); setTotal(data.total) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  useEffect(() => { const t = setTimeout(() => load(search), 400); return () => clearTimeout(t) }, [search])

  const roleColors = {
    platform_admin: 'bg-ember-400/10 text-ember-400 border-ember-400/20',
    event_owner:    'bg-ice-400/10  text-ice-400  border-ice-400/20',
    user:           'bg-white/5     text-slate-400 border-white/10',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">Users</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">{total} registered</p>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..." className="input-dark pl-8 w-52 text-xs" />
        </div>
      </div>

      <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['User', 'Email', 'Role', 'Joined'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-white/5"><td colSpan={4} className="px-5 py-4"><div className="h-4 bg-pitch-700 rounded animate-pulse" /></td></tr>
            )) : users.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-sm bg-volt-400/10 flex items-center justify-center">
                      <span className="font-display font-bold text-volt-400 text-xs">{u.full_name?.[0]}</span>
                    </div>
                    <span className="font-body text-white text-sm">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-slate-400 text-xs">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`label-tag text-[10px] border ${roleColors[u.role] || roleColors.user}`}>{u.role}</span>
                </td>
                <td className="px-5 py-3 font-mono text-slate-500 text-xs">{format(new Date(u.created_at), 'dd MMM yy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
