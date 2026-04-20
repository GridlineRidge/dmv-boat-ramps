import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env vars from .env.local
const envPath = join(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const value = trimmed.slice(eqIdx + 1).trim()
  env[key] = value
}

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Fetching ramps from Supabase...')

// Paginate to get all ramps
let allRamps = []
let from = 0
const pageSize = 1000

while (true) {
  const { data, error } = await supabase
    .from('ramps')
    .select('id, name')
    .range(from, from + pageSize - 1)

  if (error) {
    console.error('Supabase error:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) break
  allRamps = allRamps.concat(data)
  if (data.length < pageSize) break
  from += pageSize
}

console.log(`Got ${allRamps.length} ramps. Generating sitemap...`)

const today = new Date().toISOString().split('T')[0]

const urls = [
  // Homepage
  `  <url>
    <loc>https://dmvboatramps.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
  // Ramp pages
  ...allRamps.map(r => `  <url>
    <loc>https://dmvboatramps.com/ramp/${encodeURIComponent(r.id)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

const outPath = join(__dirname, '..', 'public', 'sitemap.xml')
writeFileSync(outPath, xml, 'utf-8')
console.log(`Sitemap written to ${outPath} (${allRamps.length + 1} URLs)`)
