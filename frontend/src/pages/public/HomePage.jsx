import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Zap,
  Trophy,
  Gamepad2,
  Users,
  Clock,
  MapPin,
  Calendar,
  Star,
  Wifi,
  Coffee,
  Shield,
  Volume2,
  Tv,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { eventsApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import EventCard from '../../components/ui/EventCard'
import CountdownTimer from '../../components/ui/CountdownTimer'

export default function HomePage() {
  const { user } = useAuth()
  const [featured, setFeatured] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
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

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-rotate highlights
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHighlight((prev) => (prev + 1) % footballHighlights.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const heroEvent = featured[0]

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
      match: 'RMA 2 - 0 DOR',
      league: 'UEFA Champions League',
      time: '23:45'
    },
    {
      image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=2070&auto=format',
      title: 'Premier League Clash',
      match: 'ARS 3 - 1 LIV',
      league: 'English Premier League',
      time: '20:00'
    },
    {
      image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2070&auto=format',
      title: 'El Classico',
      match: 'BAR 2 - 2 RMA',
      league: 'La Liga',
      time: '22:00'
    }
  ]

  const features = [
    { icon: Tv, title: '4K Giant Screens', desc: 'Crystal clear viewing experience' },
    { icon: Volume2, title: 'Surround Sound', desc: 'Feel every cheer and chant' },
    { icon: Wifi, title: 'Free High-Speed WiFi', desc: 'Stay connected throughout' },
    { icon: Coffee, title: 'Premium Bar', desc: 'Cold drinks & hot snacks' },
  ]

  const testimonials = [
    { name: 'Emeka O.', text: 'Best viewing centre in Lagos! The atmosphere is electric.', rating: 5, match: 'UCL Final' },
    { name: 'Tunde A.', text: 'PS5 tournaments are lit. Great crowd, amazing setup.', rating: 5, match: 'Gaming Night' },
    { name: 'Chidinma K.', text: 'Finally a place to watch matches with real fans.', rating: 5, match: 'Premier League' },
  ]

  return (
    <div className="overflow-hidden bg-pitch-950">
      {/* HERO SECTION - Enhanced */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Dynamic Background Carousel */}
        <div className="absolute inset-0">
          {heroImages.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === activeImage ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={img}
                alt={`Football atmosphere ${idx + 1}`}
                className="w-full h-full object-cover scale-105"
              />
            </div>
          ))}
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-pitch-950 via-pitch-950/85 to-pitch-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-pitch-950 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,241,53,0.12),transparent_60%)]" />
        </div>

        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-volt-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* LEFT CONTENT */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-volt-400/10 border border-volt-400/20 rounded-sm backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-volt-400 animate-pulse" />
                  <span className="font-mono text-volt-400 text-xs uppercase tracking-widest font-semibold">
                    #1 Lagos Viewing Arena
                  </span>
                </div>
              </div>

              <h1
                className="font-display uppercase text-white leading-[0.85] mb-6"
                style={{
                  fontSize: 'clamp(3rem, 9vw, 6.5rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                THE ULTIMATE
                <br />
                <span className="bg-gradient-to-r from-volt-400 via-volt-300 to-volt-400 bg-clip-text text-transparent">
                  MATCHDAY
                </span>
                <br />
                EXPERIENCE
              </h1>

              <p className="text-slate-300 text-lg leading-relaxed max-w-xl mb-8">
                Watch live football on 4K giant screens with surround sound.
                Premier League, UCL, La Liga — plus gaming tournaments & live events.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Link
                  to="/events"
                  className="btn-volt text-sm px-8 py-4 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    Book Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>

                {!user ? (
                  <Link
                    to="/register"
                    className="btn-outline text-sm px-8 py-4 group"
                  >
                    Join Free
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <Link
                    to="/my-tickets"
                    className="btn-outline text-sm px-8 py-4 group"
                  >
                    My Tickets
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Users, value: '2,500+', label: 'Active Fans' },
                  { icon: Trophy, value: '180+', label: 'Matches Live' },
                  { icon: Star, value: '4.9', label: 'Fan Rating' },
                ].map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="group bg-white/[0.03] border border-white/5 rounded-sm p-4 hover:border-volt-400/30 hover:bg-volt-400/5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={14} className="text-volt-400" />
                      </div>
                      <div className="font-display text-white text-2xl font-black">
                        {value}
                      </div>
                    </div>
                    <div className="font-mono text-slate-500 text-xs uppercase tracking-widest">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE - Football Highlights Gallery */}
            <div className="hidden lg:flex justify-end animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-full max-w-md">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-volt-400/30 via-volt-400/10 to-volt-400/20 rounded-sm blur-xl animate-pulse" />
                
                {/* Main Content Container */}
                <div className="relative rounded-sm border border-white/10 shadow-2xl overflow-hidden bg-gradient-to-br from-pitch-800 to-pitch-900">
                  
                  {/* Rotating Match Highlights */}
                  <div className="relative h-[450px] overflow-hidden">
                    {footballHighlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                          idx === currentHighlight ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <img 
                          src={highlight.image}
                          alt={highlight.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-pitch-950 via-pitch-950/60 to-transparent" />
                        
                        {/* Live Badge */}
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur px-3 py-1.5 rounded-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-mono text-white text-[10px] uppercase tracking-widest font-bold">HIGHLIGHTS</span>
                        </div>
                        
                        {/* Match Info Overlay */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-pitch-950/85 backdrop-blur-md rounded-sm p-4 border border-volt-400/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-volt-400 text-[10px] uppercase tracking-widest">{highlight.league}</span>
                              <div className="flex items-center gap-1">
                                <Clock size={10} className="text-volt-400" />
                                <span className="font-mono text-volt-400 text-[10px]">{highlight.time}</span>
                              </div>
                            </div>
                            
                            <p className="font-display font-black text-white text-xl mb-1">
                              {highlight.match}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Star size={10} className="fill-volt-400 text-volt-400" />
                                <span className="text-slate-300 text-xs">4.8k watching</span>
                              </div>
                              <div className="w-px h-3 bg-white/20" />
                              <span className="font-mono text-slate-400 text-[10px]">Live Replay</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Slide Indicators */}
                    <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 z-20">
                      {footballHighlights.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentHighlight(idx)}
                          className={`transition-all duration-300 ${
                            idx === currentHighlight 
                              ? 'w-6 h-1.5 bg-volt-400' 
                              : 'w-3 h-1.5 bg-white/30 hover:bg-white/50'
                          } rounded-full`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next Event Card */}
                {heroEvent && (
                  <div className="absolute -bottom-6 left-5 right-5 bg-pitch-900/95 backdrop-blur-xl border border-volt-400/20 rounded-sm p-5 shadow-2xl animate-slide-up z-30">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={12} className="text-volt-400" />
                      <span className="font-mono text-volt-400 text-xs uppercase tracking-widest font-semibold">
                        Next Screening
                      </span>
                    </div>

                    <p className="font-display font-black text-white text-lg mb-1">
                      {heroEvent.match_teams || 'EPIC CLASH AWAITS'}
                    </p>

                    <div className="flex items-center gap-3 text-slate-400 text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin size={10} />
                        <span>Lagos Main Arena</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span>{heroEvent.starts_at ? format(new Date(heroEvent.starts_at), 'EEE, MMM dd') : 'Date TBA'}</span>
                      </div>
                    </div>

                    <CountdownTimer targetDate={heroEvent.starts_at} />

                    <Link
                      to={`/events/${heroEvent.id}`}
                      className="btn-volt w-full justify-center mt-4 text-xs group"
                    >
                      Reserve Your Seat
                      <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block z-20">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-volt-400 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 px-4 sm:px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono text-volt-400 text-xs uppercase tracking-widest">Premium Experience</span>
            <h2 className="section-title text-3xl mt-2">Why Fans Choose Us</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                className="text-center group animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-sm bg-volt-400/10 border border-volt-400/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:bg-volt-400/20">
                  <Icon size={24} className="text-volt-400" />
                </div>
                <h3 className="font-display font-700 text-white text-sm uppercase tracking-wide mb-1">
                  {title}
                </h3>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS - Enhanced */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-volt-400" />
                <span className="font-mono text-volt-400 text-xs uppercase tracking-widest font-semibold">
                  Don't Miss Out
                </span>
              </div>
              <h2 className="section-title text-4xl">This Week's Lineup</h2>
              <p className="text-slate-500 text-sm mt-1">Book your spot before tickets run out</p>
            </div>

            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-volt-400 text-sm font-mono uppercase tracking-widest hover:gap-3 transition-all"
            >
              View All Events
              <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-pitch-800 rounded-sm h-80 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event, idx) => (
                <div
                  key={event.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-pitch-950 to-pitch-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono text-volt-400 text-xs uppercase tracking-widest">Fan Love</span>
            <h2 className="section-title text-3xl mt-2">What Our Fans Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white/[0.03] border border-white/5 rounded-sm p-6 hover:border-volt-400/20 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="fill-volt-400 text-volt-400"
                    />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-700 text-white text-sm">
                      {testimonial.name}
                    </p>
                    <p className="font-mono text-slate-500 text-[10px] uppercase tracking-widest">
                      {testimonial.match}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-volt-400/10 border border-volt-400/20 flex items-center justify-center">
                    <span className="text-volt-400 text-xs font-bold">★</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-sm bg-gradient-to-r from-volt-400/20 via-volt-400/10 to-transparent border border-volt-400/20 p-8 md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-volt-400/5 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-display font-900 text-white text-2xl md:text-3xl uppercase mb-2">
                  Ready for Matchday?
                </h3>
                <p className="text-slate-400 text-sm">
                  Join thousands of fans experiencing football like never before.
                </p>
              </div>
              <Link
                to="/register"
                className="btn-volt text-sm px-8 py-4 whitespace-nowrap group"
              >
                Get Your Ticket Now
                <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}