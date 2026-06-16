import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Minus, Plus, Ticket, ArrowLeft, ShoppingCart, X, Mail, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { eventsApi, bookingsApi, foodApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

const FOOD_CATEGORY_LABELS = {
  food:   { label: 'Food',   emoji: '🍽️' },
  drinks: { label: 'Drinks', emoji: '🥤' },
  snacks: { label: 'Snacks', emoji: '🍿' },
}

export default function BookingPage() {
  const { id: eventId } = useParams()
  const { user }        = useAuth()
  const navigate        = useNavigate()

  const [event,          setEvent]         = useState(null)
  const [menu,           setMenu]          = useState({})
  const [hasMenu,        setHasMenu]       = useState(false)
  const [loading,        setLoading]       = useState(true)
  const [paying,         setPaying]        = useState(false)
  const [quantities,     setQuantities]    = useState({})
  const [foodQty,        setFoodQty]       = useState({})
  const [deliveryEmail,  setDeliveryEmail] = useState(user?.email || '')
  const [showFood,       setShowFood]      = useState(false)

  useEffect(() => {
    Promise.all([
      eventsApi.get(eventId),
      foodApi.eventMenu(eventId),
    ]).then(([evRes, menuRes]) => {
      const ev = evRes.data
      setEvent(ev)
      const init = {}
      ev.ticket_categories?.forEach(c => { init[c.id] = 0 })
      setQuantities(init)
      setMenu(menuRes.data.menu || {})
      setHasMenu(menuRes.data.has_menu)
    }).catch(() => toast.error('Failed to load event'))
      .finally(() => setLoading(false))
  }, [eventId])

  const cats = event?.ticket_categories || []

  const adjustTicket = (catId, delta) => {
    setQuantities(prev => {
      const cat     = cats.find(c => c.id === catId)
      const current = prev[catId] || 0
      const next    = Math.max(0, Math.min(current + delta, Math.min(6, cat?.available || 0)))
      return { ...prev, [catId]: next }
    })
  }

  const adjustFood = (itemId, delta) => {
    setFoodQty(prev => {
      const current = prev[itemId] || 0
      const next    = Math.max(0, Math.min(current + delta, 10))
      return { ...prev, [itemId]: next }
    })
  }

  const allMenuItems = Object.values(menu).flat()

  const ticketSelections = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([category_id, quantity]) => ({ category_id, quantity }))

  const foodSelections = Object.entries(foodQty)
    .filter(([, qty]) => qty > 0)
    .map(([menu_item_id, quantity]) => ({ menu_item_id, quantity }))

  const ticketTotal = ticketSelections.reduce((acc, { category_id, quantity }) => {
    const cat = cats.find(c => c.id === category_id)
    return acc + (cat ? Number(cat.price) * quantity : 0)
  }, 0)

  const foodTotal = foodSelections.reduce((acc, { menu_item_id, quantity }) => {
    const item = allMenuItems.find(i => i.id === menu_item_id)
    return acc + (item ? Number(item.price) * quantity : 0)
  }, 0)

  const grandTotal    = ticketTotal + foodTotal
  const totalTickets  = ticketSelections.reduce((a, s) => a + s.quantity, 0)

  const handlePay = async () => {
    if (!ticketSelections.length) { toast.error('Select at least one ticket'); return }
    if (!deliveryEmail) { toast.error('Enter an email to receive your tickets'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(deliveryEmail)) { toast.error('Enter a valid email address'); return }

    setPaying(true)
    try {
      const { data } = await bookingsApi.initialize({
        event_id:       eventId,
        selections:     ticketSelections,
        food_items:     foodSelections,
        delivery_email: deliveryEmail,
        idempotency_key:uuidv4(),
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
              {event?.display_title || event?.title}
            </h1>
            <p className="font-mono text-slate-500 text-[10px]">
              {event?.sport_icon} {event && format(new Date(event.starts_at), 'EEE dd MMM · HH:mm')} · {event?.venue_name}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: selections */}
          <div className="lg:col-span-3 space-y-6">

            {/* ── Ticket categories ──────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-volt-400 rounded-full" />
                <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm">
                  Select Tickets
                </h2>
              </div>
              <div className="space-y-3">
                {cats.map(cat => {
                  const qty     = quantities[cat.id] || 0
                  const isOut   = cat.available <= 0
                  const subtotal= Number(cat.price) * qty

                  return (
                    <div key={cat.id} className={`bg-pitch-800 border rounded-sm p-3 sm:p-5 transition-all ${
                      qty > 0 ? 'border-volt-400/30 bg-volt-400/5' : isOut ? 'border-white/5 opacity-50' : 'border-white/5 hover:border-white/10'
                    }`}>
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color_hex }} />
                            <h3 className="font-display font-bold text-white uppercase tracking-wide text-base">{cat.name}</h3>
                            {isOut && <span className="label-tag bg-red-400/10 text-red-400 text-[9px]">Sold Out</span>}
                          </div>
                          {cat.description && <p className="font-mono text-slate-500 text-xs mb-2">{cat.description}</p>}
                          <p className="font-display font-extrabold text-volt-400 text-xl sm:text-2xl">
                            ₦{Number(cat.price).toLocaleString()}
                            <span className="font-body font-normal text-slate-500 text-sm"> / ticket</span>
                          </p>
                          <p className="font-mono text-slate-600 text-[10px] uppercase tracking-widest mt-0.5">
                            {cat.available} available
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <button onClick={() => adjustTicket(cat.id, -1)} disabled={qty === 0}
                              className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                              <Minus size={12} />
                            </button>
                            <span className="font-display font-bold text-white text-lg w-6 text-center">{qty}</span>
                            <button onClick={() => adjustTicket(cat.id, +1)} disabled={isOut || qty >= Math.min(6, cat.available)}
                              className="w-8 h-8 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center text-volt-400 hover:bg-volt-400/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                              <Plus size={12} />
                            </button>
                          </div>
                          {qty > 0 && (
                            <p className="font-mono text-volt-400 text-xs">= ₦{subtotal.toLocaleString()}</p>
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
            </div>

            {/* ── Delivery email ────────────────────────────── */}
            <div className="bg-pitch-800 border border-white/5 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Mail size={14} className="text-volt-400 shrink-0" />
                <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm">
                  Ticket Delivery Email
                </h2>
              </div>
              <p className="font-mono text-slate-500 text-xs mb-3">
                Your QR tickets will be sent to this email after payment.
              </p>
              <input
                type="email"
                value={deliveryEmail}
                onChange={e => setDeliveryEmail(e.target.value)}
                className="input-dark"
                placeholder="tickets@example.com"
              />
              {user?.email && deliveryEmail !== user.email && (
                <button
                  onClick={() => setDeliveryEmail(user.email)}
                  className="font-mono text-volt-400/70 text-[10px] uppercase tracking-widest hover:text-volt-400 transition-colors mt-2"
                >
                  ← Use my account email ({user.email})
                </button>
              )}
            </div>

            {/* ── Food pre-order ────────────────────────────── */}
            {hasMenu && (
              <div className="bg-pitch-800 border border-white/5 rounded-sm overflow-hidden">
                <button
                  onClick={() => setShowFood(!showFood)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed size={14} className="text-volt-400" />
                    <h2 className="font-display font-bold text-white uppercase tracking-wide text-sm">
                      Add Food & Drinks
                    </h2>
                    {foodSelections.length > 0 && (
                      <span className="label-tag bg-volt-400/10 text-volt-400 border border-volt-400/20 text-[9px]">
                        {foodSelections.reduce((a, s) => a + s.quantity, 0)} items
                      </span>
                    )}
                  </div>
                  {showFood ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </button>

                {showFood && (
                  <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-5">
                    <p className="font-mono text-slate-500 text-xs">
                      Pre-order food & drinks to be ready when you arrive.
                    </p>
                    {Object.entries(menu).map(([category, items]) => (
                      <div key={category}>
                        <p className="font-mono text-slate-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1">
                          <span>{FOOD_CATEGORY_LABELS[category]?.emoji || '🍽️'}</span>
                          {FOOD_CATEGORY_LABELS[category]?.label || category}
                        </p>
                        <div className="space-y-2">
                          {items.map(item => {
                            const qty = foodQty[item.id] || 0
                            return (
                              <div key={item.id} className={`flex items-center justify-between rounded-sm px-4 py-3 transition-all ${
                                qty > 0 ? 'bg-volt-400/5 border border-volt-400/20' : 'bg-pitch-700 border border-transparent'
                              }`}>
                                <div>
                                  <p className="font-body text-white text-sm">{item.emoji} {item.name}</p>
                                  {item.description && <p className="font-mono text-slate-500 text-[10px]">{item.description}</p>}
                                  <p className="font-mono text-volt-400 text-xs mt-0.5">₦{Number(item.price).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button onClick={() => adjustFood(item.id, -1)} disabled={qty === 0}
                                    className="w-7 h-7 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                    <Minus size={10} />
                                  </button>
                                  <span className="font-mono text-white text-sm w-5 text-center">{qty}</span>
                                  <button onClick={() => adjustFood(item.id, +1)}
                                    className="w-7 h-7 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center text-volt-400 hover:bg-volt-400/20 transition-all">
                                    <Plus size={10} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: order summary (desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <OrderSummary
              ticketSelections={ticketSelections}
              foodSelections={foodSelections}
              cats={cats}
              allMenuItems={allMenuItems}
              ticketTotal={ticketTotal}
              foodTotal={foodTotal}
              grandTotal={grandTotal}
              totalTickets={totalTickets}
              paying={paying}
              onPay={handlePay}
              onRemoveTicket={(catId) => setQuantities(prev => ({ ...prev, [catId]: 0 }))}
              onRemoveFood={(itemId) => setFoodQty(prev => ({ ...prev, [itemId]: 0 }))}
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
                {totalTickets} ticket{totalTickets > 1 ? 's' : ''}{foodTotal > 0 ? ' + food' : ''}
              </p>
              <p className="font-display font-extrabold text-volt-400 text-2xl leading-none">
                ₦{grandTotal.toLocaleString()}
              </p>
            </div>
            <button onClick={handlePay} disabled={paying} className="btn-volt shrink-0 px-6">
              <Ticket size={14} /> {paying ? 'Please wait...' : 'Pay Now'}
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

function OrderSummary({ ticketSelections, foodSelections, cats, allMenuItems,
  ticketTotal, foodTotal, grandTotal, totalTickets, paying, onPay, onRemoveTicket, onRemoveFood }) {
  return (
    <div className="sticky top-36 bg-pitch-800 border border-white/10 rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <ShoppingCart size={13} className="text-volt-400" />
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">Order Summary</h3>
      </div>

      <div className="p-4 space-y-2 min-h-[80px]">
        {ticketSelections.length === 0 && foodSelections.length === 0 ? (
          <p className="font-mono text-slate-600 text-xs text-center py-4 uppercase tracking-widest">Nothing selected yet</p>
        ) : (
          <>
            {ticketSelections.map(({ category_id, quantity }) => {
              const cat = cats.find(c => c.id === category_id)
              if (!cat) return null
              return (
                <div key={category_id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color_hex }} />
                    <div>
                      <p className="font-mono text-white text-xs truncate">{cat.name}</p>
                      <p className="font-mono text-slate-500 text-[10px]">× {quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-volt-400 text-sm">₦{(Number(cat.price) * quantity).toLocaleString()}</span>
                    <button onClick={() => onRemoveTicket(category_id)} className="text-slate-600 hover:text-red-400 transition-colors"><X size={11} /></button>
                  </div>
                </div>
              )
            })}

            {foodSelections.length > 0 && (
              <>
                <div className="border-t border-white/5 pt-2 mt-2">
                  <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest mb-2">Food & Drinks</p>
                  {foodSelections.map(({ menu_item_id, quantity }) => {
                    const item = allMenuItems.find(i => i.id === menu_item_id)
                    if (!item) return null
                    return (
                      <div key={menu_item_id} className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-mono text-slate-300 text-xs">{item.emoji} {item.name} ×{quantity}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-slate-400 text-xs">₦{(Number(item.price) * quantity).toLocaleString()}</span>
                          <button onClick={() => onRemoveFood(menu_item_id)} className="text-slate-600 hover:text-red-400 transition-colors"><X size={11} /></button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {(ticketSelections.length > 0 || foodSelections.length > 0) && (
        <div className="border-t border-white/5">
          {foodTotal > 0 && (
            <div className="px-4 py-2 flex justify-between text-xs">
              <span className="font-mono text-slate-500">Tickets</span>
              <span className="font-mono text-slate-400">₦{ticketTotal.toLocaleString()}</span>
            </div>
          )}
          {foodTotal > 0 && (
            <div className="px-4 py-2 flex justify-between text-xs border-t border-white/5">
              <span className="font-mono text-slate-500">Food & Drinks</span>
              <span className="font-mono text-slate-400">₦{foodTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="px-4 py-3 flex justify-between items-center border-t border-white/5">
            <div>
              <p className="font-mono text-slate-400 text-[10px] uppercase tracking-widest">Total</p>
              <p className="font-mono text-slate-600 text-[10px]">{totalTickets} ticket{totalTickets > 1 ? 's' : ''}</p>
            </div>
            <span className="font-display font-extrabold text-volt-400 text-2xl">₦{grandTotal.toLocaleString()}</span>
          </div>
          <div className="px-4 pb-4">
            <button onClick={onPay} disabled={paying} className="btn-volt w-full justify-center py-3">
              <Ticket size={14} /> {paying ? 'Redirecting...' : 'Pay with Paystack'}
            </button>
            <p className="font-mono text-slate-600 text-[10px] text-center mt-2">
              🔒 QR tickets sent to your email after payment
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
