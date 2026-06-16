import { useState, useEffect } from 'react'
import { platformApi } from '../../services/api'
import { CheckCircle, Ban, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function PlatformTenants() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('pending')

  const load = () => {
    setLoading(true)
    platformApi.tenants({ status: tab }).then(({ data }) => setTenants(data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [tab])

  const approve = async (id) => {
    await platformApi.approveTenant(id)
    toast.success('Tenant approved'); load()
  }
  const suspend = async (id) => {
    if (!confirm('Suspend this tenant?')) return
    await platformApi.suspendTenant(id)
    toast.success('Tenant suspended'); load()
  }

  const statusColor = {
    pending:   'bg-amber-400/10 text-amber-400 border-amber-400/20',
    active:    'bg-green-400/10 text-green-400 border-green-400/20',
    suspended: 'bg-red-400/10  text-red-400  border-red-400/20',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-wide">Tenants</h1>
        <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mt-1">Approve & manage event owners</p>
      </div>

      <div className="flex gap-1 bg-pitch-800 border border-white/5 rounded-sm p-1 w-fit mb-6">
        {['pending', 'active', 'suspended'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono uppercase tracking-widest transition-all ${
              tab === t ? 'bg-volt-400 text-pitch-950' : 'text-slate-400 hover:text-white'
            }`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-pitch-800 h-20 rounded-sm animate-pulse" />)}</div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-16 bg-pitch-800 border border-white/5 rounded-sm">
          <Building2 size={36} className="text-slate-700 mx-auto mb-4" />
          <p className="font-mono text-slate-600 text-xs uppercase tracking-widest">No {tab} tenants</p>
        </div>
      ) : (
        <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Business', 'Location', 'Fee %', 'Revenue', 'Status', 'Since', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-mono text-slate-500 text-[10px] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-body text-white text-sm">{t.business_name}</p>
                    <p className="font-mono text-slate-500 text-[10px]">{t.slug}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-400 text-xs">{t.city}</td>
                  <td className="px-5 py-4 font-mono text-volt-400 text-sm">{t.platform_fee_pct}%</td>
                  <td className="px-5 py-4 font-mono text-volt-400 text-sm">₦{t.total_revenue?.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`label-tag text-[10px] border ${statusColor[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-500 text-xs">
                    {format(new Date(t.created_at), 'dd MMM yy')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 justify-end">
                      {t.status === 'pending' && (
                        <button onClick={() => approve(t.id)} className="flex items-center gap-1 px-2 py-1 rounded-sm bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-all text-[10px] font-mono uppercase tracking-widest">
                          <CheckCircle size={10} /> Approve
                        </button>
                      )}
                      {t.status === 'active' && (
                        <button onClick={() => suspend(t.id)} className="flex items-center gap-1 px-2 py-1 rounded-sm bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-all text-[10px] font-mono uppercase tracking-widest">
                          <Ban size={10} /> Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
