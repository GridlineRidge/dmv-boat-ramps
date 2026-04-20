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
  selectedRamp: Ramp | null
  onSelect: (ramp: Ramp) => void
  onClearSelection: () => void
  totalCount: number
  isMobile: boolean
  isOpen: boolean
}

export default function Sidebar({
  ramps,
  selectedId,
  selectedRamp,
  onSelect,
  onClearSelection,
  totalCount,
  isMobile,
  isOpen,
}: SidebarProps) {
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

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: isOpen ? '50vh' : 0,
        overflow: 'hidden',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        background: '#f8f9fa',
        borderTop: '2px solid #e5e7eb',
        fontFamily: 'system-ui, sans-serif',
        transition: 'height 0.3s ease',
      }
    : {
        width: '35%',
        minWidth: 280,
        maxWidth: 420,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8f9fa',
        borderLeft: '1px solid #e5e7eb',
        fontFamily: 'system-ui, sans-serif',
      }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', background: '#fff', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
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
            boxSizing: 'border-box',
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

      {/* Detail panel */}
      {selectedRamp && (
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
          overflowY: 'auto',
          maxHeight: isMobile ? '60%' : '45%',
        }}>
          <button
            onClick={onClearSelection}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              margin: '10px 16px 6px',
              padding: '5px 10px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 12,
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            ← Back to list
          </button>

          {selectedRamp.street_view && (
            <img
              src={selectedRamp.street_view}
              alt={selectedRamp.name}
              style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover' }}
            />
          )}

          <div style={{ padding: '10px 16px 14px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
              {selectedRamp.name}
            </div>

            {selectedRamp.full_address && (
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                {selectedRamp.full_address}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              {selectedRamp.state && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#e0e7ff',
                  color: '#3730a3',
                  letterSpacing: '0.05em',
                }}>
                  {selectedRamp.state}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedRamp.reviews > 0 && selectedRamp.location_link && (
                <a
                  href={selectedRamp.location_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  ⭐ {Number(selectedRamp.reviews).toLocaleString()} Google reviews
                </a>
              )}
              {selectedRamp.location_link && (
                <a
                  href={selectedRamp.location_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  📍 View on Google Maps
                </a>
              )}
              {selectedRamp.site && (
                <a
                  href={selectedRamp.site}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  🔗 Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List */}
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
                    ⭐ {Number(ramp.reviews).toLocaleString()} reviews
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* Advertisement slot — replace with AdSense unit */}
      <div
        data-ad-slot="sidebar-bottom"
        style={{
          height: 90,
          background: '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 12,
          flexShrink: 0,
          letterSpacing: '0.05em',
        }}
      >
        {/* Replace with AdSense unit */}
        Advertisement
      </div>
    </div>
  )
}
