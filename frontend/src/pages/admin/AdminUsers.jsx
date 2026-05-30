import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import { Search, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const load = (q = '') => {
    setLoading(true)
    adminApi.users({ search: q, per_page: 30 })
      .then(({ data }) => { setUsers(data.users); setTotal(data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setTimeout(() => load(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const setRole = async (userId, role) => {
    await adminApi.setRole(userId, role).catch(() => toast.error('Failed'))
    toast.success('Role updated')
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  const roleColors = {
    admin: 'bg-ember-400/10 text-ember-400 border-ember-400/20',
    staff: 'bg-ice-400/10 text-ice-400 border-ice-400/20',
    user: 'bg-white/5 text-slate-400 border-white/10',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-900 text-white text-3xl uppercase tracking-wide">Users</h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">{total} registered</p>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="input-dark pl-8 w-56 text-xs"
          />
        </div>
      </div>

      <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['User', 'Email', 'Joined', 'Role', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={5} className="px-5 py-4"><div className="h-4 bg-pitch-700 rounded animate-pulse w-full" /></td>
                </tr>
              ))
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-sm bg-volt-400/10 flex items-center justify-center">
                      <span className="font-display font-700 text-volt-400 text-xs">{u.full_name?.[0]}</span>
                    </div>
                    <span className="font-body text-white text-sm">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-slate-400 text-xs">{u.email}</td>
                <td className="px-5 py-3 font-mono text-slate-500 text-xs">{format(new Date(u.created_at), 'dd MMM yy')}</td>
                <td className="px-5 py-3">
                  <span className={`label-tag text-[10px] border ${roleColors[u.role]}`}>{u.role}</span>
                </td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    onChange={e => setRole(u.id, e.target.value)}
                    className="bg-pitch-700 border border-white/10 rounded-sm px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-volt-400/40"
                  >
                    {['user', 'staff', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
