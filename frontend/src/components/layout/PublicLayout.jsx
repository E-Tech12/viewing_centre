import { Outlet, Link } from 'react-router-dom'

import {
  Instagram,
  Twitter,
  Facebook,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'

import Navbar from './Navbar'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-pitch-950 text-white flex flex-col overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Main */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,241,53,0.08),transparent_60%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-volt-400 rounded-sm flex items-center justify-center shadow-lg shadow-volt-400/20">
                  <span className="font-display font-black text-pitch-950 text-sm">
                    SZ
                  </span>
                </div>

                <div>
                  <h2 className="font-display font-black tracking-[0.2em] uppercase text-lg">
                    Sport
                    <span className="text-volt-400">
                      Zone
                    </span>
                  </h2>

                  <p className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
                    Lagos Viewing Arena
                  </p>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Premium football viewing centre in Lagos for
                live matches, Champions League nights,
                gaming tournaments and unforgettable
                sports entertainment experiences.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-display uppercase text-sm tracking-widest text-white mb-5">
                Quick Links
              </h3>

              <div className="space-y-3">
                {[
                  {
                    to: '/',
                    label: 'Home',
                  },
                  {
                    to: '/events',
                    label: 'Events',
                  },
                  {
                    to: '/login',
                    label: 'Sign In',
                  },
                  {
                    to: '/register',
                    label: 'Create Account',
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="block text-slate-500 hover:text-volt-400 transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-display uppercase text-sm tracking-widest text-white mb-5">
                Contact
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin
                    size={16}
                    className="text-volt-400 mt-0.5"
                  />

                  <p className="text-slate-400 text-sm">
                    Lekki Phase 1,
                    <br />
                    Lagos, Nigeria
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Phone
                    size={16}
                    className="text-volt-400"
                  />

                  <p className="text-slate-400 text-sm">
                    +234 800 000 0000
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Mail
                    size={16}
                    className="text-volt-400"
                  />

                  <p className="text-slate-400 text-sm">
                    support@sportzone.com
                  </p>
                </div>
              </div>
            </div>

            {/* Socials */}
            <div>
              <h3 className="font-display uppercase text-sm tracking-widest text-white mb-5">
                Community
              </h3>

              <p className="text-slate-400 text-sm mb-5">
                Follow SportZone for match updates,
                tournament announcements and exclusive
                events.
              </p>

              <div className="flex items-center gap-3">
                {[
                  {
                    icon: Instagram,
                  },
                  {
                    icon: Twitter,
                  },
                  {
                    icon: Facebook,
                  },
                ].map(({ icon: Icon }, i) => (
                  <button
                    key={i}
                    className="w-10 h-10 rounded-sm border border-white/10 bg-white/[0.03] hover:bg-volt-400/10 hover:border-volt-400/20 transition-all flex items-center justify-center"
                  >
                    <Icon
                      size={16}
                      className="text-slate-400 hover:text-volt-400"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/5 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs font-mono uppercase tracking-widest">
              © 2026 SportZone. All Rights Reserved.
            </p>

            <div className="flex items-center gap-6">
              <button className="text-slate-600 hover:text-slate-400 text-xs uppercase tracking-widest transition-colors">
                Privacy
              </button>

              <button className="text-slate-600 hover:text-slate-400 text-xs uppercase tracking-widest transition-colors">
                Terms
              </button>

              <button className="text-slate-600 hover:text-slate-400 text-xs uppercase tracking-widest transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}