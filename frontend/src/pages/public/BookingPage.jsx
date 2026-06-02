import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Minus, Plus, Ticket, ArrowLeft, ShoppingCart, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { eventsApi, bookingsApi } from '../../services/api'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export default function BookingPage() {
  const { id: eventId } = useParams()
  const navigate = useNavigate()

  const [event,      setEvent]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [paying,     setPaying]     = useState(false)
  const [quantities, setQuantities] = useState({}) // { category_id: quantity }

  useEffect(() => {
    eventsApi.get(eventId)
      .then(({ data }) => {
        setEvent(data)
        const init = {}
        data.ticket_categories?.forEach(c => { init[c.id] = 0 })
        setQuantities(init)
      })
      .catch(() => toast.error('Failed to load event'))
      .finally(() => setLoading(false))
  }, [eventId])

  const cats = event?.ticket_categories || []

  const adjust = (catId, delta) => {
    setQuantities(prev => {
      const cat = cats.find(c => c.id === catId)
      const current = prev[catId] || 0
      const next = Math.max(0, Math.min(current + delta, Math.min(6, cat?.available || 0)))
      return { ...prev, [catId]: next }
    })
  }

  const selections = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([category_id, quantity]) => ({ category_id, quantity }))

  const total = selections.reduce((acc, { category_id, quantity }) => {
    const cat = cats.find(c => c.id === category_id)
    return acc + (cat ? Number(cat.price) * quantity : 0)
  }, 0)

  const totalTickets = selections.reduce((acc, { quantity }) => acc + quantity, 0)

  const handlePay = async () => {
    if (!selections.length) { toast.error('Select at least one ticket'); return }
    setPaying(true)
    try {
      const { data } = await bookingsApi.initialize({
        event_id: eventId,
        selections,
        idempotency_key: uuidv4(),
      })
      window.location.href = data.authorization_url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed to start')
      setPaying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!event) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <p className="font-mono text-slate-500 text-sm">Event not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen pt-16 pb-32 lg:pb-10">

      {/* Top bar */}
      <div className="bg-pitch-900 border-b border-white/5 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to={`/events/${eventId}`} className="text-slate-500 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-white text-lg uppercase tracking-wide truncate">
              {event.display_title}
            </h1>
            <p className="font-mono text-slate-500 text-[10px]">
              {event.sport_icon} {format(new Date(event.starts_at), 'EEE dd MMM yyyy · HH:mm')} · {event.venue_name}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: category selector */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-volt-400 rounded-full" />
              <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm">
                Select Ticket Type &amp; Quantity
              </h2>
            </div>

            {cats.length === 0 ? (
              <div className="bg-pitch-800 border border-white/5 rounded-sm p-8 text-center">
                <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">No ticket categories available</p>
              </div>
            ) : cats.map(cat => {
              const qty     = quantities[cat.id] || 0
              const subtotal= Number(cat.price) * qty
              const isOut   = cat.available <= 0

              return (
                <div
                  key={cat.id}
                  className={`bg-pitch-800 border rounded-sm p-5 transition-all ${
                    qty > 0 ? 'border-volt-400/30 bg-volt-400/5' : isOut ? 'border-white/5 opacity-50' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color_hex }} />
                        <h3 className="font-display font-bold text-white uppercase tracking-wide text-base">{cat.name}</h3>
                        {isOut && <span className="label-tag bg-red-400/10 text-red-400 text-[9px]">Sold Out</span>}
                      </div>
                      {cat.description && (
                        <p className="font-mono text-slate-500 text-xs mb-2">{cat.description}</p>
                      )}
                      <p className="font-display font-extrabold text-volt-400 text-2xl">
                        ₦{Number(cat.price).toLocaleString()}
                        <span className="font-body font-normal text-slate-500 text-sm"> / ticket</span>
                      </p>
                      <p className="font-mono text-slate-600 text-[10px] uppercase tracking-widest mt-0.5">
                        {cat.available} available
                      </p>
                    </div>

                    {/* Quantity control */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjust(cat.id, -1)}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-display font-bold text-white text-lg w-6 text-center">{qty}</span>
                        <button
                          onClick={() => adjust(cat.id, +1)}
                          disabled={isOut || qty >= Math.min(6, cat.available)}
                          className="w-8 h-8 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center text-volt-400 hover:bg-volt-400/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      {qty > 0 && (
                        <p className="font-mono text-volt-400 text-xs">
                          = ₦{subtotal.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            <p className="font-mono text-slate-600 text-[10px] uppercase tracking-widest text-center">
              Maximum 6 tickets per order
            </p>
          </div>

          {/* Right: order summary (desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <OrderSummary
              selections={selections}
              cats={cats}
              total={total}
              totalTickets={totalTickets}
              paying={paying}
              onPay={handlePay}
              onRemove={(catId) => setQuantities(prev => ({ ...prev, [catId]: 0 }))}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-pitch-900/95 backdrop-blur border-t border-white/10 px-4 py-3">
        {totalTickets > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-mono text-slate-400 text-[10px] uppercase tracking-widest">
                {totalTickets} ticket{totalTickets > 1 ? 's' : ''}
              </p>
              <p className="font-display font-extrabold text-volt-400 text-2xl leading-none">
                ₦{total.toLocaleString()}
              </p>
            </div>
            <button onClick={handlePay} disabled={paying} className="btn-volt shrink-0 px-6">
              <Ticket size={14} />
              {paying ? 'Please wait...' : 'Pay Now'}
            </button>
          </div>
        ) : (
          <p className="text-center font-mono text-slate-600 text-xs uppercase tracking-widest py-1">
            Select tickets above
          </p>
        )}
      </div>
    </div>
  )
}

function OrderSummary({ selections, cats, total, totalTickets, paying, onPay, onRemove }) {
  return (
    <div className="sticky top-36 bg-pitch-800 border border-white/10 rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <ShoppingCart size={13} className="text-volt-400" />
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">Order Summary</h3>
      </div>

      <div className="p-4 space-y-2 min-h-[80px]">
        {selections.length === 0 ? (
          <p className="font-mono text-slate-600 text-xs text-center py-4 uppercase tracking-widest">
            No tickets selected
          </p>
        ) : selections.map(({ category_id, quantity }) => {
          const cat = cats.find(c => c.id === category_id)
          if (!cat) return null
          return (
            <div key={category_id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color_hex }} />
                <div className="min-w-0">
                  <p className="font-mono text-white text-xs truncate">{cat.name}</p>
                  <p className="font-mono text-slate-500 text-[10px]">× {quantity}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-volt-400 text-sm">
                  ₦{(Number(cat.price) * quantity).toLocaleString()}
                </span>
                <button onClick={() => onRemove(category_id)} className="text-slate-600 hover:text-red-400 transition-colors">
                  <X size={11} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selections.length > 0 && (
        <div className="border-t border-white/5">
          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-mono text-slate-400 text-[10px] uppercase tracking-widest">Total</p>
              <p className="font-mono text-slate-600 text-[10px]">{totalTickets} ticket{totalTickets > 1 ? 's' : ''}</p>
            </div>
            <span className="font-display font-extrabold text-volt-400 text-2xl">
              ₦{total.toLocaleString()}
            </span>
          </div>
          <div className="px-4 pb-4">
            <button onClick={onPay} disabled={paying} className="btn-volt w-full justify-center py-3">
              <Ticket size={14} />
              {paying ? 'Redirecting...' : 'Pay with Paystack'}
            </button>
            <p className="font-mono text-slate-600 text-[10px] text-center mt-2">
              🔒 Secure checkout · 5% platform fee included
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
