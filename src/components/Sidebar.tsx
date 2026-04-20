import { useEffect, useRef, useState, useMemo } from 'react'

export interface Ramp {
  id: string
  name: string
  full_address: string
  latitude: number
  longitude: number
  state: string
  reviews: number
  site: string
  street_view: string
  location_link: string
}

interface SidebarProps {
  ramps: Ramp[]
  selectedId: string | null
  onSelect: (ramp: Ramp) => void
  totalCount: number
}

export default function Sidebar({ ramps, selectedId, onSelect, totalCount }: SidebarProps) {
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('ALL')
  const selectedRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const states = useMemo(() => {
    const s = Array.from(new Set(ramps.map(r => r.state).filter(Boolean))).sort()
    return ['ALL', ...s]
  }, [ramps])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ramps.filter(r => {
      const matchesState = stateFilter === 'ALL' || r.state === stateFilter
      const matchesSearch = !q || r.name?.toLowerCase().includes(q) || r.full_address?.toLowerCase().includes(q)
      return matchesState && matchesSearch
    })
  }, [ramps, search, stateFilter])

  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedId])

  return (
    <div style={{
      width: '35%',
      minWidth: 280,
      maxWidth: 420,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8f9fa',
      borderLeft: '1px solid #e5e7eb',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ padding: '14px 16px 10px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
          🚤 DMV Boat Ramps
        </div>
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
            marginBottom: 8,
            background: '#f9fafb',
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {states.map(s => (
            <button
              key={s}
              onClick={() => setStateFilter(s)}
              style={{
                padding: '3px 10px',
                borderRadius: 99,
                border: '1px solid',
                borderColor: stateFilter === s ? '#2563eb' : '#d1d5db',
                background: stateFilter === s ? '#2563eb' : '#fff',
                color: stateFilter === s ? '#fff' : '#374151',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: stateFilter === s ? 600 : 400,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>
          {filtered.length.toLocaleString()} of {totalCount.toLocaleString()} ramps
        </div>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            No ramps match your search.
          </div>
        )}
        {filtered.map(ramp => {
          const isSelected = ramp.id === selectedId
          return (
            <div
              key={ramp.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => onSelect(ramp)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                background: isSelected ? '#eff6ff' : 'transparent',
                borderBottom: '1px solid #f1f5f9',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 2 }}>
                {ramp.name}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                {ramp.full_address}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {ramp.state && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: '#e0e7ff',
                    color: '#3730a3',
                    letterSpacing: '0.05em',
                  }}>
                    {ramp.state}
                  </span>
                )}
                {ramp.reviews > 0 && (
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    ⭐ {ramp.reviews.toLocaleString()} reviews
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
