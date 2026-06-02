import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Zap, Trophy, Gamepad2, Users,
  Clock, MapPin, Calendar, Star, Wifi, Coffee,
  Volume2, Tv, ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { eventsApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import EventCard from '../../components/ui/EventCard'
import CountdownTimer from '../../components/ui/CountdownTimer'

const heroImages = [
  'https://images.unsplash.com/photo-1547347298-4074fc3086f0?q=80&w=2070&auto=format',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070&auto=format',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=2070&auto=format',
]

const footballHighlights = [
  {
    image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=1200&auto=format',
    title: 'Champions League Final',
    match: 'RMA 2 — 0 DOR',
    league: 'UEFA Champions League',
    time: '23:45',
  },
  {
    image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=2070&auto=format',
    title: 'Premier League Clash',
    match: 'ARS 3 — 1 LIV',
    league: 'English Premier League',
    time: '20:00',
  },
  {
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070&auto=format',
    title: 'El Clásico',
    match: 'BAR 2 — 2 RMA',
    league: 'La Liga',
    time: '22:00',
  },
]

const features = [
  { icon: Tv,      title: '4K Giant Screens',   desc: 'Crystal clear viewing experience' },
  { icon: Volume2, title: 'Surround Sound',      desc: 'Feel every cheer and chant'       },
  { icon: Wifi,    title: 'Free High-Speed WiFi',desc: 'Stay connected throughout'        },
  { icon: Coffee,  title: 'Premium Bar',         desc: 'Cold drinks & hot snacks'         },
]

const testimonials = [
  { name: 'Emeka O.',    text: 'Best viewing centre in Lagos! The atmosphere is electric.', rating: 5, match: 'UCL Final'      },
  { name: 'Tunde A.',    text: 'PS5 tournaments are lit. Great crowd, amazing setup.',      rating: 5, match: 'Gaming Night'   },
  { name: 'Chidinma K.', text: 'Finally a place to watch matches with real fans.',          rating: 5, match: 'Premier League' },
]

export default function HomePage() {
  const { user, isEventOwner, isPlatformAdmin } = useAuth()
  const [featured,         setFeatured]         = useState([])
  const [upcoming,         setUpcoming]         = useState([])
  const [loading,          setLoading]          = useState(true)
  const [activeImage,      setActiveImage]      = useState(0)
  const [currentHighlight, setCurrentHighlight] = useState(0)

  useEffect(() => {
    Promise.all([
      eventsApi.list({ featured: true, per_page: 3 }),
      eventsApi.list({ per_page: 6 }),
    ])
      .then(([f, u]) => {
        setFeatured(f.data.events)
        setUpcoming(u.data.events)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveImage(p => (p + 1) % heroImages.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setCurrentHighlight(p => (p + 1) % footballHighlights.length), 4000)
    return () => clearInterval(t)
  }, [])

  const heroEvent = featured[0]

  // Role-aware CTA helpers
  const primaryCTA = isEventOwner
    ? { to: '/owner',    label: 'Owner Dashboard' }
    : isPlatformAdmin
      ? { to: '/platform', label: 'Admin Dashboard' }
      : { to: '/events',   label: 'Book Now' }

  const secondaryCTA = isEventOwner || isPlatformAdmin
    ? null
    : user
      ? { to: '/my-tickets', label: 'My Tickets' }
      : { to: '/register',   label: 'Join Free'   }

  const bottomCTA = user
    ? { to: '/events',   label: 'Browse Events'      }
    : { to: '/register', label: 'Get Your Ticket Now' }

  return (
    <div className="overflow-hidden bg-pitch-950">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">

        {/* Carousel background */}
        <div className="absolute inset-0">
          {heroImages.map((img, idx) => (
            <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeImage ? 'opacity-100' : 'opacity-0'}`}>
              <img src={img} alt="" className="w-full h-full object-cover scale-105" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-pitch-950 via-pitch-950/85 to-pitch-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-pitch-950 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,241,53,0.12),transparent_60%)]" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-volt-400/30 rounded-full animate-float"
              style={{ left: `${(i * 17 + 5) % 100}%`, top: `${(i * 13 + 10) % 100}%`,
                animationDelay: `${(i * 0.4) % 5}s`, animationDuration: `${3 + (i % 4)}s` }} />
          ))}
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.08) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start lg:items-center">

            {/* Left content */}
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-volt-400/10 border border-volt-400/20 rounded-sm backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-volt-400 animate-pulse" />
                  <span className="font-mono text-volt-400 text-[10px] sm:text-xs uppercase tracking-widest font-semibold">
                    #1 Lagos Viewing Arena
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="font-display uppercase text-white leading-[0.85] mb-6"
                style={{ fontSize: 'clamp(2.5rem,8vw,6.5rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>
                THE ULTIMATE<br />
                <span className="bg-gradient-to-r from-volt-400 via-volt-300 to-volt-400 bg-clip-text text-transparent">
                  MATCHDAY
                </span><br />
                EXPERIENCE
              </h1>

              <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-xl mb-8">
                Watch live football on 4K giant screens with surround sound.
                Premier League, UCL, La Liga — plus gaming tournaments &amp; live events.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-12">
                <Link to={primaryCTA.to}
                  className="btn-volt text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-1">
                    {primaryCTA.label}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>

                {secondaryCTA && (
                  <Link to={secondaryCTA.to}
                    className="btn-outline text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 group">
                    {secondaryCTA.label}
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[
                  { icon: Users,  value: '2,500+', label: 'Active Fans'   },
                  { icon: Trophy, value: '180+',   label: 'Matches Live'  },
                  { icon: Star,   value: '4.9',    label: 'Fan Rating'    },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="group bg-white/[0.03] border border-white/5 rounded-sm p-2 sm:p-4 hover:border-volt-400/30 hover:bg-volt-400/5 transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={12} className="text-volt-400" />
                      </div>
                      <div className="font-display text-white text-lg sm:text-2xl font-black">{value}</div>
                    </div>
                    <div className="font-mono text-slate-500 text-[8px] sm:text-xs uppercase tracking-widest">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: highlights gallery */}
            <div className="flex justify-center lg:justify-end w-full mt-8 lg:mt-0">
              <div className="relative w-full max-w-sm md:max-w-md">
                <div className="absolute -inset-1 bg-gradient-to-r from-volt-400/30 via-volt-400/10 to-volt-400/20 rounded-sm blur-xl animate-pulse" />

                <div className="relative rounded-sm border border-white/10 shadow-2xl overflow-hidden bg-gradient-to-br from-pitch-800 to-pitch-900">
                  <div className="relative h-[320px] sm:h-[380px] md:h-[450px] overflow-hidden">
                    {footballHighlights.map((h, idx) => (
                      <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentHighlight ? 'opacity-100' : 'opacity-0'}`}>
                        <img src={h.image} alt={h.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-pitch-950 via-pitch-950/60 to-transparent" />

                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur px-2 py-1 sm:px-3 sm:py-1.5 rounded-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-mono text-white text-[8px] sm:text-[10px] uppercase tracking-widest font-bold">HIGHLIGHTS</span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                          <div className="bg-pitch-950/85 backdrop-blur-md rounded-sm p-3 sm:p-4 border border-volt-400/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-volt-400 text-[8px] sm:text-[10px] uppercase tracking-widest">{h.league}</span>
                              <div className="flex items-center gap-1">
                                <Clock size={8} className="text-volt-400" />
                                <span className="font-mono text-volt-400 text-[8px] sm:text-[10px]">{h.time}</span>
                              </div>
                            </div>
                            <p className="font-display font-black text-white text-sm sm:text-xl mb-1">{h.match}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Star size={8} className="fill-volt-400 text-volt-400" />
                                <span className="text-slate-300 text-[10px] sm:text-xs">4.8k watching</span>
                              </div>
                              <div className="w-px h-2 sm:h-3 bg-white/20" />
                              <span className="font-mono text-slate-400 text-[8px] sm:text-[10px]">Live Replay</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Dots */}
                    <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 flex justify-center gap-1.5 sm:gap-2 z-20">
                      {footballHighlights.map((_, idx) => (
                        <button key={idx} onClick={() => setCurrentHighlight(idx)}
                          className={`transition-all duration-300 rounded-full ${
                            idx === currentHighlight ? 'w-4 sm:w-6 h-1 sm:h-1.5 bg-volt-400' : 'w-2 sm:w-3 h-1 sm:h-1.5 bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next event card */}
                {heroEvent && (
                  <div className="absolute -bottom-6 left-3 right-3 sm:left-5 sm:right-5 bg-pitch-900/95 backdrop-blur-xl border border-volt-400/20 rounded-sm p-3 sm:p-5 shadow-2xl z-30">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <Clock size={10} className="text-volt-400" />
                      <span className="font-mono text-volt-400 text-[10px] sm:text-xs uppercase tracking-widest font-semibold">
                        Next Screening
                      </span>
                      {heroEvent.sport_icon && (
                        <span className="ml-auto text-base">{heroEvent.sport_icon}</span>
                      )}
                    </div>

                    <p className="font-display font-black text-white text-sm sm:text-lg mb-1">
                      {heroEvent.display_title || heroEvent.title}
                    </p>

                    {heroEvent.sport_meta?.competition && (
                      <p className="font-mono text-volt-400 text-[9px] uppercase tracking-widest mb-1">
                        {heroEvent.sport_meta.competition}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-400 text-[10px] sm:text-xs mb-2 sm:mb-3">
                      {heroEvent.venue_name && (
                        <div className="flex items-center gap-1">
                          <MapPin size={8} />
                          <span>{heroEvent.venue_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={8} />
                        <span>{format(new Date(heroEvent.starts_at), 'EEE, MMM dd')}</span>
                      </div>
                    </div>

                    <CountdownTimer targetDate={heroEvent.starts_at} />

                    <Link to={`/events/${heroEvent.id}`}
                      className="btn-volt w-full justify-center mt-3 sm:mt-4 text-[10px] sm:text-xs group">
                      Reserve Your Seat
                      <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block z-20">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-volt-400 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <span className="font-mono text-volt-400 text-[10px] sm:text-xs uppercase tracking-widest">Premium Experience</span>
            <h2 className="font-display font-extrabold text-white uppercase tracking-wider text-2xl sm:text-3xl mt-2">
              Why Fans Choose Us
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center group">
                <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:bg-volt-400/20">
                  <Icon size={18} className="text-volt-400" />
                </div>
                <h3 className="font-display font-bold text-white text-xs sm:text-sm uppercase tracking-wide mb-1">{title}</h3>
                <p className="text-slate-500 text-[10px] sm:text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ───────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} className="text-volt-400" />
                <span className="font-mono text-volt-400 text-[10px] sm:text-xs uppercase tracking-widest font-semibold">
                  Don't Miss Out
                </span>
              </div>
              <h2 className="font-display font-extrabold text-white uppercase tracking-wider text-2xl sm:text-4xl">
                This Week's Lineup
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Book your spot before tickets run out</p>
            </div>
            <Link to="/events"
              className="inline-flex items-center gap-2 text-volt-400 text-xs sm:text-sm font-mono uppercase tracking-widest hover:gap-3 transition-all">
              View All Events <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-pitch-800 rounded-sm h-64 sm:h-80 animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-20 bg-pitch-800/50 border border-white/5 rounded-sm">
              <span className="text-5xl mb-4 block opacity-20">📅</span>
              <p className="font-display font-bold text-slate-500 uppercase tracking-wide mb-2">No events yet</p>
              {(isEventOwner || isPlatformAdmin) && (
                <Link to="/owner/events/new" className="btn-volt text-xs mt-4 inline-flex">
                  Create First Event
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upcoming.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-pitch-950 to-pitch-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <span className="font-mono text-volt-400 text-[10px] sm:text-xs uppercase tracking-widest">Fan Love</span>
            <h2 className="font-display font-extrabold text-white uppercase tracking-wider text-2xl sm:text-3xl mt-2">
              What Our Fans Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-sm p-4 sm:p-6 hover:border-volt-400/20 transition-all duration-300">
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className="fill-volt-400 text-volt-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-white text-xs sm:text-sm">{t.name}</p>
                    <p className="font-mono text-slate-500 text-[8px] sm:text-[10px] uppercase tracking-widest">{t.match}</p>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-volt-400/10 border border-volt-400/20 flex items-center justify-center">
                    <span className="text-volt-400 text-[10px] sm:text-xs font-bold">★</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-sm bg-gradient-to-r from-volt-400/20 via-volt-400/10 to-transparent border border-volt-400/20 p-6 sm:p-8 md:p-12">
            <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-volt-400/5 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="text-center md:text-left">
                <h3 className="font-display font-black text-white text-xl sm:text-2xl md:text-3xl uppercase mb-2">
                  {user ? 'Ready for Matchday?' : 'Join the Movement'}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm">
                  {user
                    ? 'Find your next event and book your seat today.'
                    : 'Join thousands of fans experiencing sports like never before.'}
                </p>
              </div>
              <Link to={bottomCTA.to}
                className="btn-volt text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-4 whitespace-nowrap group">
                {bottomCTA.label}
                <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Venue owner CTA ───────────────────────────────────────── */}
      {!user && (
        <section className="pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center border-t border-white/5 pt-10">
              <p className="font-mono text-slate-500 text-xs uppercase tracking-widest mb-3">
                Do you own a viewing centre?
              </p>
              <Link to="/become-owner"
                className="inline-flex items-center gap-2 font-mono text-ice-400 text-xs uppercase tracking-widest hover:text-white transition-colors">
                List your venue on SportZone <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          50%       { transform: translateY(-20px) translateX(10px); opacity: 0.5; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}