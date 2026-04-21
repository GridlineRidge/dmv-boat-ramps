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
  latitude: number
  longitude: number
  state: string
  reviews: number
  site: string
  working_hours: string
  description: string
  street_view: string
  location_link: string
}

const STATE_NAMES: Record<string, string> = {
  VA: 'Virginia',
  MD: 'Maryland',
  DC: 'Washington DC',
  DE: 'Delaware',
  WV: 'West Virginia',
  PA: 'Pennsylvania',
  NJ: 'New Jersey',
}

const STATE_SLUGS: Record<string, string> = {
  VA: 'virginia',
  MD: 'maryland',
  DC: 'dc',
  DE: 'delaware',
  WV: 'west-virginia',
  PA: 'pennsylvania',
  NJ: 'new-jersey',
}

export default function RampPage() {
  const { id } = useParams<{ id: string }>()
  const [ramp, setRamp] = useState<Ramp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase
      .from('ramps')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError(true)
        } else {
          setRamp(data as Ramp)
        }
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (ramp) {
      document.title = ramp.name + ' — DMV Boat Ramps'
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = 'Boat ramp at ' + ramp.full_address + '. Find directions, hours, reviews, and more for ' + ramp.name + ' in ' + (STATE_NAMES[ramp.state] ?? ramp.state) + '.'
    }
  }, [ramp])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#6b7280' }}>
        Loading ramp…
      </div>
    )
  }

  if (error || !ramp) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚤</div>
        <h1 style={{ margin: 0, color: '#1e293b' }}>Ramp not found</h1>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Back to Map</Link>
      </div>
    )
  }

  const stateName = STATE_NAMES[ramp.state] ?? ramp.state
  const stateSlug = STATE_SLUGS[ramp.state] ?? ramp.state.toLowerCase()

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          ← Back to Map
        </Link>
        <span style={{ color: '#d1d5db' }}>|</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>🚤 DMV Boat Ramps</span>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 64px' }}>
        <nav style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to={'/state/' + stateSlug} style={{ color: '#2563eb', textDecoration: 'none' }}>{stateName}</Link>
          <span>›</span>
          <span style={{ color: '#374151' }}>{ramp.name}</span>
        </nav>

        {ramp.latitude != null && ramp.longitude != null && (
          <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <img
              src={`https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${ramp.latitude},${ramp.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`}
              alt={'Street view of ' + ramp.name}
              style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
              {ramp.name}
            </h1>
            {ramp.state && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', letterSpacing: '0.05em' }}>
                {ramp.state}
              </span>
            )}
          </div>
          {ramp.full_address && (
            <p style={{ margin: 0, fontSize: 16, color: '#4b5563' }}>{ramp.full_address}</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {ramp.reviews > 0 && (
            <InfoCard icon="⭐" label="Google Reviews" value={Number(ramp.reviews).toLocaleString() + ' reviews'} />
          )}
          {ramp.working_hours && (
            <InfoCard icon="🕐" label="Hours" value={ramp.working_hours} />
          )}
          {ramp.latitude != null && ramp.longitude != null && <InfoCard icon="📍" label="Coordinates" value={ramp.latitude.toFixed(5) + ', ' + ramp.longitude.toFixed(5)} />}
          {ramp.state && (
            <InfoCard icon="🗺️" label="State" value={stateName} />
          )}
        </div>

        {ramp.description && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>About this Ramp</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{ramp.description}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {ramp.location_link && (
            <ActionLink href={ramp.location_link} icon="📍" label="Get Directions (Google Maps)" />
          )}
          {ramp.site && (
            <ActionLink href={ramp.site} icon="🔗" label="Visit Official Website" />
          )}
        </div>


        {/* Sponsored listing CTA */}
        <SponsorForm rampName={ramp.name} />
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>More boat ramps in {stateName}</div>
            <div style={{ fontSize: 13, color: '#4b5563' }}>Browse all ramps in this state</div>
          </div>
          <Link
            to={'/state/' + stateSlug}
            style={{ background: '#2563eb', color: '#fff', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            View {stateName} Ramps →
          </Link>
        </div>
      </main>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{value}</div>
    </div>
  )
}

function ActionLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 18px', textDecoration: 'none', color: '#1e293b', fontSize: 14, fontWeight: 600 }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ color: '#2563eb' }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>↗</span>
    </a>
  )
}

function SponsorForm({ rampName }: { rampName: string }) {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch(`https://formspree.io/f/${import.meta.env.VITE_FORMSPREE_ID ?? 'xpwzgqbd'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, message, ramp: rampName }),
      })
      if (res.ok) setSubmitted(true)
    } finally {
      setSending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db',
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', marginTop: 4,
  }

  return (
    <div style={{ background: '#fefce8', border: '2px dashed #ca8a04', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Sponsored</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Advertise Here</h2>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
        Is your business near this ramp? Reach boaters searching for <strong>{rampName}</strong>. Sponsored listings start at $15/month.
      </p>
      {submitted ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px', color: '#15803d', fontSize: 14, fontWeight: 600 }}>
          ✅ Thanks! We'll be in touch soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Your Name
              <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Jane Smith" />
            </label>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Email Address
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="jane@yourbusiness.com" />
            </label>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Message (optional)
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder={'Tell us about your business near ' + rampName} />
            </label>
          </div>
          <button
            type="submit"
            disabled={sending}
            style={{ alignSelf: 'flex-start', background: '#ca8a04', color: '#fff', padding: '9px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 700, cursor: sending ? 'wait' : 'pointer' }}
          >
            {sending ? 'Sending…' : 'Get Listed'}
          </button>
        </form>
      )}
      <p style={{ margin: '12px 0 0', fontSize: 11, color: '#78716c', lineHeight: 1.5 }}>
        Sponsored listings are paid advertisements and are not affiliated with or endorsed by this site or any government entity.
      </p>
    </div>
  )
}
