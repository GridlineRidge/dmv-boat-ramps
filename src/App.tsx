import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { createClient } from '@supabase/supabase-js'
import 'mapbox-gl/dist/mapbox-gl.css'

import Sidebar, { type Ramp } from './components/Sidebar'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [ramps, setRamps] = useState<Ramp[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedRamp, setSelectedRamp] = useState<Ramp | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Keep a ref so map event handlers (set up once) always read the current value
  const isMobileRef = useRef(isMobile)
  useEffect(() => { isMobileRef.current = isMobile }, [isMobile])

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSelect = useCallback((ramp: Ramp) => {
    setSelectedId(ramp.id)
    setSelectedRamp(ramp)
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [ramp.longitude, ramp.latitude], zoom: 13, duration: 600 })
    }
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedId(null)
    setSelectedRamp(null)
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-77.0, 38.5],
      zoom: 6,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', async () => {
      const { data, error } = await supabase
        .from('ramps')
        .select('id, name, full_address, latitude, longitude, state, reviews, site, street_view, location_link')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (error || !data || data.length === 0) return

      const rampsData = data as Ramp[]
      setRamps(rampsData)

      map.addSource('ramps', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: rampsData.map(r => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [r.longitude, r.latitude] },
            properties: { ...r },
          })),
        },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 40,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'ramps',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#2563eb', 20, '#1d4ed8', 100, '#1e3a8a'],
          'circle-radius': ['step', ['get', 'point_count'], 18, 20, 26, 100, 34],
          'circle-opacity': 0.85,
        },
      })

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'ramps',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 13,
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      })

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'ramps',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#2563eb',
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      // Unclustered point click → show detail panel in sidebar (no popup)
      map.on('click', 'unclustered-point', (e) => {
        if (!e.features?.[0]) return
        const p = e.features[0].properties as Ramp
        setSelectedId(p.id)
        setSelectedRamp(p)
        // On mobile, open the drawer
        if (isMobileRef.current) setSidebarOpen(true)
      })

      // Cluster click → zoom in
      map.on('click', 'clusters', (e) => {
        if (!e.features?.[0]) return
        const clusterId = e.features[0].properties?.cluster_id as number
        const src = map.getSource('ramps') as mapboxgl.GeoJSONSource
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return
          map.easeTo({
            center: (e.features![0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          })
        })
      })

      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })
    })

    return () => map.remove()
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed top header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 30,
        flexShrink: 0,
      }}>
        <a href="/" style={{ textDecoration: 'none', color: '#111827', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>🚤 DMV Boat Ramps</span>
          <span style={{ fontWeight: 400, fontSize: 12, color: '#6b7280', letterSpacing: 0 }}>Boat ramps across the Mid-Atlantic waterways.</span>
        </a>
        <nav style={{ display: 'flex', gap: 8 }} className="state-nav">
          {[
            { label: 'Virginia', href: '/state/virginia' },
            { label: 'Maryland', href: '/state/maryland' },
            { label: 'DC', href: '/state/dc' },
          ].map(({ label, href }) => (
            <a key={href} href={href} style={{
              textDecoration: 'none',
              color: '#374151',
              fontSize: 14,
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: 6,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{label}</a>
          ))}
        </nav>
      </header>

      {/* Row container: map + desktop sidebar side by side */}
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, marginTop: 52, height: 'calc(100vh - 52px)', overflow: 'hidden' }}>
        <div
          ref={mapContainer}
          style={{ flex: 1, height: '100%', minWidth: 0 }}
        />
        {!isMobile && ramps.length > 0 && (
          <Sidebar
            ramps={ramps}
            selectedId={selectedId}
            selectedRamp={selectedRamp}
            onSelect={handleSelect}
            onClearSelection={handleClearSelection}
            totalCount={ramps.length}
            isMobile={false}
            isOpen={true}
          />
        )}
      </div>

      {/* Mobile: bottom drawer sidebar */}
      {isMobile && ramps.length > 0 && (
        <Sidebar
          ramps={ramps}
          selectedId={selectedId}
          selectedRamp={selectedRamp}
          onSelect={handleSelect}
          onClearSelection={handleClearSelection}
          totalCount={ramps.length}
          isMobile={true}
          isOpen={sidebarOpen}
        />
      )}

      {/* Mobile toggle button — floats over map, bottom-center */}
      {isMobile && ramps.length > 0 && (
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            position: 'fixed',
            bottom: sidebarOpen ? 'calc(50vh + 12px)' : 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            padding: '10px 22px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
            transition: 'bottom 0.3s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {sidebarOpen ? '✕ Close' : `🚤 ${ramps.length.toLocaleString()} Ramps`}
        </button>
      )}
    </div>
  )
}
