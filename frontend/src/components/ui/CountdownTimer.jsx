import { useState, useEffect } from 'react'

function pad(n) { return String(n).padStart(2, '0') }

export default function CountdownTimer({ targetDate }) {
  const [time, setTime] = useState(() => getRemaining(targetDate))

  function getRemaining(target) {
    const diff = new Date(target) - Date.now()
    if (diff <= 0) return null
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return { d, h, m, s }
  }

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!time) return (
    <div className="flex items-center justify-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      <span className="font-mono text-red-400 text-xs uppercase tracking-widest">Live Now</span>
    </div>
  )

  const units = time.d > 0
    ? [{ v: time.d, l: 'D' }, { v: time.h, l: 'H' }, { v: time.m, l: 'M' }]
    : [{ v: time.h, l: 'H' }, { v: time.m, l: 'M' }, { v: time.s, l: 'S' }]

  return (
    <div className="flex items-center justify-center gap-2">
      {units.map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="bg-pitch-700 border border-white/10 rounded-sm px-2.5 py-1.5 min-w-[40px] text-center">
              <span className="font-mono font-500 text-white text-sm">{pad(v)}</span>
            </div>
            <span className="font-mono text-slate-600 text-[9px] uppercase tracking-widest mt-1">{l}</span>
          </div>
          {i < units.length - 1 && <span className="font-mono text-slate-600 text-sm pb-3">:</span>}
        </div>
      ))}
    </div>
  )
}
