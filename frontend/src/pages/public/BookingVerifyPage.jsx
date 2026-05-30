// ── BookingVerifyPage ─────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { paymentsApi } from '../../services/api'

export function BookingVerifyPage() {
  const [params] = useSearchParams()
  const reference = params.get('reference') || params.get('trxref')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (reference) {
      paymentsApi.verify(reference)
        .then(({ data }) => setResult(data))
        .catch(() => setResult({ status: 'failed' }))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [reference])

  if (loading) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <Loader size={32} className="text-volt-400 animate-spin" />
      <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">Verifying payment...</p>
    </div>
  )

  const success = result?.status === 'success'

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-pitch-800 border border-white/10 rounded-sm p-8 text-center">
        {success ? (
          <>
            <CheckCircle size={48} className="text-volt-400 mx-auto mb-4" />
            <h1 className="font-display font-900 text-white text-2xl uppercase tracking-wide mb-2">Booking Confirmed!</h1>
            <p className="text-slate-400 font-body text-sm mb-6">Your tickets have been generated. Check your email or view them below.</p>
            <div className="flex flex-col gap-2">
              <Link to="/my-tickets" className="btn-volt w-full justify-center">View My Tickets</Link>
              <Link to="/events" className="btn-outline w-full justify-center text-xs">Browse More Events</Link>
            </div>
          </>
        ) : (
          <>
            <XCircle size={48} className="text-ember-400 mx-auto mb-4" />
            <h1 className="font-display font-900 text-white text-2xl uppercase tracking-wide mb-2">Payment Failed</h1>
            <p className="text-slate-400 font-body text-sm mb-6">Your payment could not be verified. Please try again.</p>
            <Link to="/events" className="btn-volt w-full justify-center">Back to Events</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default BookingVerifyPage
