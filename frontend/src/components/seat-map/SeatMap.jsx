import { useMemo } from 'react'

const SEAT_SIZE = 30
const SEAT_GAP  = 8
const SEAT_STEP = SEAT_SIZE + SEAT_GAP

// Color per state
const COLORS = {
  available:  { fill: '#1c2e42', stroke: '#3b5068' },
  held:       { fill: '#78350f', stroke: '#d97706' },
  held_by_me: { fill: '#14532d', stroke: '#22c55e' },
  booked:     { fill: '#0a0f14', stroke: '#1e293b', opacity: 0.4 },
  selected:   { fill: '#c8f135', stroke: '#b5e020' },
  vip_available: { fill: '#2d1a00', stroke: '#92400e' },
  vip_selected:  { fill: '#f59e0b', stroke: '#fbbf24' },
}

function getColors(state, isSelected, isVip) {
  if (isSelected) return isVip ? COLORS.vip_selected : COLORS.selected
  if (isVip && (state === 'available' || !state)) return COLORS.vip_available
  return COLORS[state] || COLORS.available
}

function isClickable(state, isSelected) {
  if (isSelected) return true
  return state === 'available' || state === 'held_by_me' || !state
}

export default function SeatMap({ sections, selectedIds, onToggle }) {
  const layout = useMemo(() => {
    let offsetY = 0
    return sections.map(section => {
      const seats = section.seats || []
      const rows  = [...new Set(seats.map(s => s.row_label))].sort()
      const cols  = seats.length ? Math.max(...seats.map(s => s.seat_number)) : 0
      const w = cols * SEAT_STEP + 40          // 40 = row-label space
      const h = rows.length * SEAT_STEP + 10
      const result = { ...section, offsetY, rows, cols, w, h }
      offsetY += h + 56   // 56 = gap + section label space
      return result
    })
  }, [sections])

  const totalH = layout.reduce((a, s) => a + s.h + 56, 40)
  const totalW = Math.max(...layout.map(s => s.w), 300) + 60

  return (
    <div className="w-full overflow-x-auto">

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
        {[
          { label: 'Available',     ...COLORS.available     },
          { label: 'VIP',           ...COLORS.vip_available },
          { label: 'Your Pick ✓',   ...COLORS.selected      },
          { label: 'Held by Other', ...COLORS.held          },
          { label: 'Booked',        ...COLORS.booked        },
        ].map(({ label, fill, stroke }) => (
          <div key={label} className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <rect x="1" y="1" width="12" height="12" rx="2"
                fill={fill} stroke={stroke} strokeWidth="1.5" />
            </svg>
            <span className="font-mono text-slate-500 text-[10px] uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {/* Screen bar */}
      <div className="flex justify-center mb-8">
        <div className="text-center">
          <div className="w-56 h-1.5 mx-auto bg-gradient-to-r from-transparent via-volt-400/70 to-transparent rounded-full" />
          <p className="font-mono text-volt-400/40 text-[9px] uppercase tracking-[0.3em] mt-1.5">SCREEN / PITCH VIEW</p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ minWidth: Math.min(totalW, 340), maxWidth: '100%' }}
      >
        {layout.map(section => {
          const isVip = section.category === 'VIP'
          const ox = 30  // left offset for row labels

          return (
            <g key={section.id} transform={`translate(0, ${section.offsetY + 30})`}>

              {/* Section header */}
              <rect x="0" y="-26" width={section.w + ox + 20} height="22" rx="3"
                fill={section.color_hex ? section.color_hex + '18' : '#1c2e4218'}
                stroke={section.color_hex || '#3B82F6'} strokeWidth="0.5" strokeOpacity="0.4"
              />
              <text x={(section.w + ox + 20) / 2} y="-10"
                textAnchor="middle" fill={section.color_hex || '#3B82F6'}
                fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="1.5"
              >
                {section.name?.toUpperCase()}  ·  ₦{Number(section.price || 0).toLocaleString()} / SEAT
              </text>

              {/* Row labels + seats */}
              {section.rows.map((row, ri) => {
                const rowSeats = (section.seats || [])
                  .filter(s => s.row_label === row)
                  .sort((a, b) => a.seat_number - b.seat_number)

                return (
                  <g key={row} transform={`translate(0, ${ri * SEAT_STEP})`}>
                    {/* Row letter */}
                    <text x={ox - 6} y={SEAT_SIZE / 2 + 1}
                      textAnchor="end" dominantBaseline="middle"
                      fill="#475569" fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {row}
                    </text>

                    {rowSeats.map(seat => {
                      const isSelected = selectedIds.includes(seat.id)
                      const clickable  = isClickable(seat.state, isSelected)
                      const colors     = getColors(seat.state, isSelected, isVip)
                      const x = ox + (seat.seat_number - 1) * SEAT_STEP

                      return (
                        <g
                          key={seat.id}
                          transform={`translate(${x}, 0)`}
                          onClick={() => clickable && onToggle(seat)}
                          style={{ cursor: clickable ? 'pointer' : 'not-allowed' }}
                        >
                          {/* Hover glow for clickable seats */}
                          {clickable && (
                            <rect
                              width={SEAT_SIZE + 4} height={SEAT_SIZE + 4}
                              x="-2" y="-2" rx="6"
                              fill={isVip ? '#f59e0b' : '#c8f135'}
                              opacity="0"
                              className="transition-opacity duration-100 hover:opacity-10"
                            />
                          )}
                          <rect
                            width={SEAT_SIZE} height={SEAT_SIZE}
                            rx="4"
                            fill={colors.fill}
                            stroke={colors.stroke}
                            strokeWidth={isSelected ? 2 : 1.5}
                            opacity={colors.opacity || 1}
                          />
                          {/* Seat number */}
                          <text
                            x={SEAT_SIZE / 2} y={SEAT_SIZE / 2}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize="7"
                            fontFamily="JetBrains Mono, monospace"
                            fill={isSelected ? '#020408' : '#475569'}
                          >
                            {seat.seat_number}
                          </text>
                          {/* Checkmark when selected */}
                          {isSelected && (
                            <path
                              d={`M${SEAT_SIZE*0.25} ${SEAT_SIZE*0.5} L${SEAT_SIZE*0.45} ${SEAT_SIZE*0.7} L${SEAT_SIZE*0.75} ${SEAT_SIZE*0.3}`}
                              stroke={isVip ? '#78350f' : '#020408'}
                              strokeWidth="2.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <title>{`${row}${seat.seat_number} · ${seat.state || 'available'}`}</title>
                        </g>
                      )
                    })}
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
