import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { createClient } from '@supabase/supabase-js'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'
import Sidebar, { type Ramp } from './components/Sidebar'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function openPopup(map: mapboxgl.Map, ramp: Ramp) {
  const streetViewHtml = ramp.street_view
    ? `<img src="${ramp.street_view}" style="width:100%;border-radius:6px;margin-bottom:8px;display:block" />`
    : ''
  const reviewsHtml = ramp.reviews
    ? `<a href="${ramp.location_link}" target="_blank" style="display:block;margin:4px 0;font-size:12px;color:#2563eb;text-decoration:none">⭐ ${ramp.reviews} Google reviews</a>`
    : ''
  const linksHtml = [
    ramp.location_link ? `<a href="${ramp.location_link}" target="_blank" style="font-size:12px;color:#2563eb;margin-right:10px">📍 Google Maps</a>` : '',
    ramp.site ? `<a href="${ramp.site}" target="_blank" style="font-size:12px;color:#2563eb">🔗 Website</a>` : '',
  ].join('')

  new mapboxgl.Popup({ offset: 12, maxWidth: '260px' })
    .setLngLat([ramp.longitude, ramp.latitude])
    .setHTML(
      `<div style="font-family:sans-serif">
        ${streetViewHtml}
        <strong style="font-size:14px">${ramp.name}</strong>
        <p style="margin:4px 0;font-size:12px;color:#555">${ramp.full_address || ''}</p>
        ${reviewsHtml}
        <div style="margin-top:6px">${linksHtml}</div>
      </div>`
    )
    .addTo(map)
}

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [ramps, setRamps] = useState<Ramp[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSidebarSelect = useCallback((ramp: Ramp) => {
    setSelectedId(ramp.id)
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [ramp.longitude, ramp.latitude], zoom: 13, duration: 600 })
      openPopup(mapRef.current, ramp)
    }
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

      map.on('click', 'unclustered-point', (e) => {
        if (!e.features?.[0]) return
        const p = e.features[0].properties as Ramp
        setSelectedId(p.id)
        openPopup(map, p)
      })

      map.on('click', 'clusters', (e) => {
        if (!e.features?.[0]) return
        const clusterId = e.features[0].properties?.cluster_id
        const src = map.getSource('ramps') as mapboxgl.GeoJSONSource
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return
          map.easeTo({ center: (e.features![0].geometry as GeoJSON.Point).coordinates as [number, number], zoom })
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
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mapContainer} style={{ flex: 1, height: '100%' }} />
      {ramps.length > 0 && (
        <Sidebar
          ramps={ramps}
          selectedId={selectedId}
          onSelect={handleSidebarSelect}
          totalCount={ramps.length}
        />
      )}
    </div>
  )
}
