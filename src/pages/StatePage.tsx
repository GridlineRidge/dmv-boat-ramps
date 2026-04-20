import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

interface Ramp {
  id: string
  name: string
  full_address: string
  state: string
  reviews: number
  street_view: string
}

const SLUG_TO_ABBR: Record<string, string> = {
  virginia: 'VA',
  maryland: 'MD',
  dc: 'DC',
  delaware: 'DE',
  'west-virginia': 'WV',
  pennsylvania: 'PA',
  'new-jersey': 'NJ',
}

const ABBR_TO_NAME: Record<string, string> = {
  VA: 'Virginia',
  MD: 'Maryland',
  DC: 'Washington DC',
  DE: 'Delaware',
  WV: 'West Virginia',
  PA: 'Pennsylvania',
  NJ: 'New Jersey',
}

export default function StatePage() {
  const { stateName } = useParams<{ stateName: string }>()
  const [ramps, setRamps] = useState<Ramp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const abbr = stateName ? SLUG_TO_ABBR[stateName.toLowerCase()] : undefined
  const fullName = abbr ? (ABBR_TO_NAME[abbr] ?? abbr) : stateName ?? ''

  useEffect(() => {
    if (!abbr) {
      setError(true)
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('ramps')
      .select('id, name, full_address, state, reviews, street_view')
      .eq('state', abbr)
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data) {
          setError(true)
        } else {
          setRamps(data as Ramp[])
        }
        setLoading(false)
      })
  }, [abbr])

  useEffect(() => {
    if (fullName) {
      document.title = 'Boat Ramps in ' + fullName + ' — DMV Boat Ramps'
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = 'Browse ' + (ramps.length > 0 ? ramps.length + ' ' : '') + 'public boat ramps in ' + fullName + '. Find directions, hours, and reviews for every ramp.'
    }
  }, [fullName, ramps.length])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#6b7280' }}>
        Loading ramps…
      </div>
    )
  }

  if (error || !abbr) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚤</div>
        <h1 style={{ margin: 0, color: '#1e293b' }}>State not found</h1>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Back to Map</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          ← Back to Map
        </Link>
        <span style={{ color: '#d1d5db' }}>|</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>🚤 DMV Boat Ramps</span>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 64px' }}>
        <nav style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <span style={{ color: '#374151' }}>{fullName}</span>
        </nav>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 800, color: '#1e293b' }}>
            Boat Ramps in {fullName}
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: '#4b5563' }}>
            {ramps.length.toLocaleString()} public boat {ramps.length === 1 ? 'ramp' : 'ramps'} found in {fullName}
          </p>
        </div>

        {ramps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚤</div>
            <p>No ramps found for this state.</p>
            <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>View all ramps on the map</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {ramps.map(ramp => (
              <Link
                key={ramp.id}
                to={'/ramp/' + ramp.id}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  cursor: 'pointer',
                  height: '100%',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = '0 4px 16px rgba(37,99,235,0.12)'
                    el.style.borderColor = '#93c5fd'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.boxShadow = ''
                    el.style.borderColor = '#e5e7eb'
                  }}
                >
                  {ramp.street_view ? (
                    <img
                      src={ramp.street_view}
                      alt={ramp.name}
                      style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: 100, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                      🚤
                    </div>
                  )}
                  <div style={{ padding: '12px 16px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 4, lineHeight: 1.3 }}>
                      {ramp.name}
                    </div>
                    {ramp.full_address && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                        {ramp.full_address}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {ramp.reviews > 0 ? (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          ⭐ {Number(ramp.reviews).toLocaleString()} reviews
                        </span>
                      ) : (
                        <span />
                      )}
                      <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>View details →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
