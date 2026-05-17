import { NextResponse } from 'next/server'

const BASE_URL = 'https://shareyourparty.de'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smylady-backend.onrender.com'

const staticPages = [
  { url: '/explore',      priority: '1.0', changefreq: 'daily'   },
  { url: '/events/wien',  priority: '0.8', changefreq: 'daily'   },
  { url: '/grounding',    priority: '0.6', changefreq: 'monthly' },
  { url: '/pricing',      priority: '0.5', changefreq: 'monthly' },
  { url: '/contact',      priority: '0.4', changefreq: 'yearly'  },
  { url: '/privacy',      priority: '0.3', changefreq: 'yearly'  },
  { url: '/terms',        priority: '0.3', changefreq: 'yearly'  },
  { url: '/imprint',      priority: '0.3', changefreq: 'yearly'  },
]

function generateSlug(name: string, id: string): string {
  const umlautMap: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, c => umlautMap[c] || c)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    + '-' + id.slice(-8)
}

async function getPublicEvents() {
  try {
    const res = await fetch(
      `${API_URL}/events/public?limit=500&upcoming=false`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return json.data || json.events || []
  } catch {
    return []
  }
}

export async function GET() {
  const events = await getPublicEvents()

  const staticUrls = staticPages.map(p => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const eventUrls = events.map((event: any) => {
    const slug = generateSlug(event.name, event._id)
    const lastmod = new Date(event.updatedAt || event.createdAt)
      .toISOString().split('T')[0]
    return `
  <url>
    <loc>${BASE_URL}/event/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${eventUrls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
