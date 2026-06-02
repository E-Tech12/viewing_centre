import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Ticket, QrCode } from 'lucide-react'
import { bookingsApi } from '../../services/api'

export default function BookingVerifyPage() {
  const [params]   = useSearchParams()
  const reference  = params.get('reference') || params.get('trxref')
  const [result,   setResult]  = useState(null)
  const [loading,  setLoading] = useState(true)
  const [showQr,   setShowQr]  = useState(null)

  useEffect(() => {
    if (reference) {
      bookingsApi.verify(reference)
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
  const tickets = result?.booking?.tickets || []

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className={`rounded-sm border p-8 text-center mb-6 ${
          success ? 'bg-green-500/10 border-green-400/30' : 'bg-red-500/10 border-red-400/30'
        }`}>
          {success
            ? <CheckCircle size={48} className="text-volt-400 mx-auto mb-4" />
            : <XCircle    size={48} className="text-ember-400 mx-auto mb-4" />
          }
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-wide mb-2">
            {success ? 'Booking Confirmed!' : 'Payment Failed'}
          </h1>
          <p className="text-slate-400 font-body text-sm">
            {success
              ? `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} generated. Show the QR code at the entrance.`
              : 'Your payment could not be verified. Please try again.'
            }
          </p>
        </div>

        {/* Tickets */}
        {success && tickets.length > 0 && (
          <div className="space-y-3 mb-6">
            {tickets.map((ticket, i) => (
              <div key={ticket.id} className="bg-pitch-800 border border-white/10 rounded-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-volt-400/10 border border-volt-400/20 rounded-sm flex items-center justify-center">
                      <Ticket size={14} className="text-volt-400" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-white text-sm uppercase tracking-wide">
                        {ticket.category_name}
                      </p>
                      <p className="font-mono text-slate-500 text-[10px]">Ticket {i + 1} of {tickets.length}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQr(showQr === ticket.id ? null : ticket.id)}
                    className="flex items-center gap-1.5 text-volt-400 hover:text-volt-300 transition-colors"
                  >
                    <QrCode size={16} />
                    <span className="font-mono text-[10px] uppercase tracking-widest">
                      {showQr === ticket.id ? 'Hide' : 'Show'}
                    </span>
                  </button>
                </div>

                {showQr === ticket.id && (
                  <div className="border-t border-white/5 p-6 bg-white flex flex-col items-center gap-3 animate-fade-in">
                    <img
                      src={`data:image/png;base64,${ticket.qr_payload}`}
                      alt="QR Ticket"
                      className="w-48 h-48"
                    />
                    <p className="font-mono text-pitch-700 text-xs text-center">
                      Present at entrance · Do not share
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {success
            ? <>
                <Link to="/my-tickets" className="btn-volt w-full justify-center">View All My Tickets</Link>
                <Link to="/events"     className="btn-outline w-full justify-center text-xs">Browse More Events</Link>
              </>
            : <Link to="/events" className="btn-volt w-full justify-center">Back to Events</Link>
          }
        </div>
      </div>
    </div>
  )
}
