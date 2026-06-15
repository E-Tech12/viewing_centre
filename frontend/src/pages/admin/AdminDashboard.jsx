import { useState, useEffect } from 'react'
import { Check, X, Users, Ticket, DollarSign, CheckCircle, BarChart3 } from 'lucide-react'
import { adminApi } from '../../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.stats(),
      adminApi.pendingTenants()
    ])
      .then(([statsRes, tenantRes]) => {
        setStats(statsRes.data)
        setTenants(tenantRes.data)
      })
      .catch(err => {
        console.error("Admin dashboard error:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Approve Tenant ─────────────────────────────
  const approveTenant = async (id) => {
    try {
      await adminApi.approveTenant(id)

      setTenants(prev =>
        prev.map(t =>
          t.id === id ? { ...t, status: 'active' } : t
        )
      )
    } catch (err) {
      console.error("Approve failed:", err)
    }
  }

  // ── Reject Tenant ─────────────────────────────
  const rejectTenant = async (id) => {
    try {
      await adminApi.rejectTenant(id)

      setTenants(prev =>
        prev.map(t =>
          t.id === id ? { ...t, status: 'suspended' } : t
        )
      )
    } catch (err) {
      console.error("Reject failed:", err)
    }
  }

  const cards = stats ? [
    { label: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users },
    { label: 'Confirmed Bookings', value: stats.total_bookings.toLocaleString(), icon: Ticket },
    { label: 'Tickets Scanned', value: `${stats.tickets_scanned}/${stats.total_tickets}`, icon: CheckCircle },
    { label: 'Total Revenue', value: `₦${stats.total_revenue.toLocaleString()}`, icon: DollarSign },
  ] : []

  return (
    <div className="p-8">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-white text-3xl font-bold uppercase">
          Admin Dashboard
        </h1>
        <p className="text-slate-400 text-sm">
          Overview & Tenant Approval System
        </p>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* STATS CARDS */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {cards.map((c, i) => {
              const Icon = c.icon
              return (
                <div key={i} className="bg-gray-900 p-4 rounded border border-gray-800">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-400 text-xs uppercase">{c.label}</p>
                    <Icon size={16} className="text-slate-500" />
                  </div>
                  <p className="text-white text-xl mt-2">{c.value}</p>
                </div>
              )
            })}
          </div>

          {/* TENANTS SECTION */}
          <div className="bg-gray-900 rounded border border-gray-800 mb-8">
            <div className="p-4 border-b border-gray-800 flex items-center gap-2">
              <Users size={16} className="text-yellow-400" />
              <h2 className="text-white font-semibold">
                Pending Viewing Centres
              </h2>
            </div>

            <table className="w-full text-left text-white">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-gray-800">
                  <th className="p-3">Business</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className="border-b border-gray-800">
                    <td className="p-3">{t.business_name}</td>
                    <td className="p-3 text-slate-400">{t.slug}</td>
                    <td className="p-3 text-yellow-400">{t.status}</td>

                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => approveTenant(t.id)}
                        className="bg-green-600 hover:bg-green-700 p-2 rounded"
                      >
                        <Check size={14} />
                      </button>

                      <button
                        onClick={() => rejectTenant(t.id)}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOP EVENTS */}
          {stats?.top_events?.length > 0 && (
            <div className="bg-gray-900 rounded border border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-400" />
                <h2 className="text-white font-semibold">
                  Top Events by Revenue
                </h2>
              </div>

              <div>
                {stats.top_events.map((ev, i) => (
                  <div
                    key={i}
                    className="flex justify-between p-3 border-b border-gray-800 text-white"
                  >
                    <span>{ev.title}</span>
                    <span>{ev.bookings} bookings</span>
                    <span className="text-yellow-400">
                      ₦{ev.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}