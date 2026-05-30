import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, X, Zap, Ticket, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { eventsApi, seatsApi, paymentsApi } from '../../services/api'
import SeatMap from '../../components/seat-map/SeatMap'
import CountdownTimer from '../../components/ui/CountdownTimer'
import { format } from 'date-fns'

const HOLD_SECONDS = 600

export default function SeatSelectPage() {
  const { id: eventId } = useParams()
  const navigate = useNavigate()

  const [event,       setEvent]       = useState(null)
  const [sections,    setSections]    = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [holdExpiry,  setHoldExpiry]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState(null)
  const [paying,      setPaying]      = useState(false)
  const holdTimer = useRef(null)

  // ── Load event + seat map ──────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([
      eventsApi.get(eventId),
      seatsApi.getSeatMap(eventId),
    ])
      .then(([evRes, mapRes]) => {
        setEvent(evRes.data)
        setSections(mapRes.data.sections || [])
      })
      .catch(err => {
        const msg = err.response?.data?.error || err.message || 'Failed to load seat map'
        setLoadError(msg)
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }, [eventId])

  // ── Hold-expiry countdown ──────────────────────────────────────
  useEffect(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    if (selectedIds.length > 0) {
      setHoldExpiry(new Date(Date.now() + HOLD_SECONDS * 1000).toISOString())
      holdTimer.current = setTimeout(() => {
        setSelectedIds([])
        setHoldExpiry(null)
        toast.error('Hold expired — please reselect your seats')
      }, HOLD_SECONDS * 1000)
    } else {
      setHoldExpiry(null)
    }
    return () => clearTimeout(holdTimer.current)
  }, [selectedIds.length])

  // ── Toggle seat — instant UI, async hold ───────────────────────
  const toggleSeat = (seat) => {
    const alreadySelected = selectedIds.includes(seat.id)

    if (alreadySelected) {
      // Deselect immediately
      setSelectedIds(prev => prev.filter(id => id !== seat.id))
      setSections(prev => prev.map(sec => ({
        ...sec,
        seats: (sec.seats || []).map(s =>
          s.id === seat.id ? { ...s, state: 'available' } : s
        ),
      })))
      // Fire release in background — don't await
      seatsApi.release(eventId, [seat.id]).catch(() => {})
      return
    }

    if (selectedIds.length >= 6) {
      toast.error('Maximum 6 seats per booking')
      return
    }

    // ✅ SELECT IMMEDIATELY — no waiting for API
    setSelectedIds(prev => [...prev, seat.id])
    setSections(prev => prev.map(sec => ({
      ...sec,
      seats: (sec.seats || []).map(s =>
        s.id === seat.id ? { ...s, state: 'held_by_me' } : s
      ),
    })))

    // Hold in background — revert if it fails
    seatsApi.hold(eventId, [seat.id]).catch(err => {
      // Revert the optimistic selection
      setSelectedIds(prev => prev.filter(id => id !== seat.id))
      setSections(prev => prev.map(sec => ({
        ...sec,
        seats: (sec.seats || []).map(s =>
          s.id === seat.id ? { ...s, state: 'available' } : s
        ),
      })))
      const msg = err.response?.data?.error || 'Seat no longer available'
      toast.error(msg)
    })
  }

  // ── Order totals ───────────────────────────────────────────────
  const allSeats = sections.flatMap(s => s.seats || [])
  const selectedSeats = allSeats.filter(s => selectedIds.includes(s.id))

  const getPrice = (seatId) => {
    const sec = sections.find(s => (s.seats || []).some(st => st.id === seatId))
    return Number(sec?.price || 0)
  }

  const total = selectedIds.reduce((acc, id) => acc + getPrice(id), 0)

  // ── Pay ────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!selectedIds.length) { toast.error('Select at least one seat'); return }
    setPaying(true)
    try {
      const { data } = await paymentsApi.initialize({ event_id: eventId, seat_ids: selectedIds })
      window.location.href = data.authorization_url
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed to start')
      setPaying(false)
    }
  }

  // ── Render states ──────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-volt-400 border-t-transparent rounded-full animate-spin" />
      <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">Loading seat map...</p>
    </div>
  )

  if (loadError) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
      <p className="font-mono text-red-400 text-sm text-center">{loadError}</p>
      <Link to={`/events/${eventId}`} className="btn-outline text-xs">← Back to Event</Link>
    </div>
  )

  if (sections.length === 0) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
      <p className="font-mono text-slate-500 text-sm text-center">No seating sections are configured for this event yet.</p>
      <Link to={`/events/${eventId}`} className="btn-outline text-xs">← Back to Event</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-pitch-950 pt-16 pb-32 xl:pb-10">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="bg-pitch-900 border-b border-white/5 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/events/${eventId}`} className="text-slate-500 hover:text-white transition-colors shrink-0">
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-white text-lg uppercase tracking-wide truncate">
                {event?.match_teams || event?.title}
              </h1>
              <p className="font-mono text-slate-500 text-[10px]">
                {event && format(new Date(event.starts_at), 'EEE dd MMM yyyy · HH:mm')}
              </p>
            </div>
          </div>
          {holdExpiry && selectedIds.length > 0 && (
            <div className="text-right shrink-0">
              <p className="font-mono text-amber-400 text-[10px] uppercase tracking-widest flex items-center gap-1 justify-end mb-1">
                <Zap size={9} /> Hold expires
              </p>
              <CountdownTimer targetDate={holdExpiry} />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

          {/* ── Seat map ────────────────────────────────────── */}
          <div className="xl:col-span-3">
            <div className="bg-pitch-900 border border-white/5 rounded-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-volt-400 rounded-full" />
                  <h2 className="font-display font-bold text-white text-sm uppercase tracking-widest">
                    Select Your Seats
                  </h2>
                </div>
                {selectedIds.length > 0 && (
                  <span className="font-mono text-volt-400 text-xs bg-volt-400/10 border border-volt-400/20 px-2 py-1 rounded-sm">
                    {selectedIds.length} seat{selectedIds.length > 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <SeatMap
                sections={sections}
                selectedIds={selectedIds}
                onToggle={toggleSeat}
              />
            </div>
          </div>

          {/* ── Desktop order summary ────────────────────────── */}
          <div className="hidden xl:block xl:col-span-1">
            <OrderSummary
              selectedSeats={selectedSeats}
              sections={sections}
              total={total}
              paying={paying}
              onPay={handlePay}
              onRemove={(seat) => toggleSeat(seat)}
              getPrice={getPrice}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ────────────────────────── */}
      <div className="xl:hidden fixed bottom-0 inset-x-0 z-40 bg-pitch-900/95 backdrop-blur border-t border-white/10 px-4 py-3">
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-slate-400 text-[10px] uppercase tracking-widest">
                {selectedIds.length} seat{selectedIds.length > 1 ? 's' : ''} selected
              </p>
              <p className="font-display font-extrabold text-volt-400 text-2xl leading-none">
                ₦{total.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-volt shrink-0 px-6"
            >
              <Ticket size={14} />
              {paying ? 'Please wait...' : 'Pay Now'}
            </button>
          </div>
        ) : (
          <p className="text-center font-mono text-slate-600 text-xs uppercase tracking-widest py-1">
            Tap any seat above to select it
          </p>
        )}
      </div>
    </div>
  )
}

// ── Order Summary Sidebar ──────────────────────────────────────────
function OrderSummary({ selectedSeats, sections, total, paying, onPay, onRemove, getPrice }) {
  return (
    <div className="sticky top-36 bg-pitch-800 border border-white/10 rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <ShoppingCart size={13} className="text-volt-400" />
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">Order Summary</h3>
      </div>

      <div className="p-4 space-y-2 min-h-[100px]">
        {selectedSeats.length === 0 ? (
          <div className="text-center py-6">
            <p className="font-mono text-slate-600 text-xs uppercase tracking-widest">No seats selected</p>
            <p className="font-mono text-slate-700 text-[10px] mt-1">Click seats on the map</p>
          </div>
        ) : selectedSeats.map(seat => {
          const section = sections.find(s => (s.seats || []).some(st => st.id === seat.id))
          const price = getPrice(seat.id)
          return (
            <div key={seat.id} className="flex items-center justify-between gap-2 py-1">
              <div className="min-w-0">
                <p className="font-mono text-white text-sm">{seat.label || `${seat.row_label}${seat.seat_number}`}</p>
                <p className="font-mono text-slate-500 text-[10px] uppercase truncate">{section?.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-volt-400 text-sm">₦{price.toLocaleString()}</span>
                <button
                  onClick={() => onRemove(seat)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedSeats.length > 0 && (
        <div className="border-t border-white/5">
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="font-mono text-slate-400 text-xs uppercase tracking-widest">Total</span>
            <span className="font-display font-extrabold text-volt-400 text-2xl">
              ₦{total.toLocaleString()}
            </span>
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={onPay}
              disabled={paying}
              className="btn-volt w-full justify-center py-3"
            >
              <Ticket size={14} />
              {paying ? 'Redirecting...' : 'Pay with Paystack'}
            </button>
            <p className="font-mono text-slate-600 text-[10px] text-center mt-2">
              🔒 Seats held 10 min while you pay
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
