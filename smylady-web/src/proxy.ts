import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SKIP_PREFIXES = [
  '/_next',
  '/api',
  '/favicon',
  '/logo',
  '/robots',
  '/sitemap',
  '/blog',
  // Sentry-Tunnel (next.config.ts: tunnelRoute) — der Matcher unten trifft sonst
  // auch diesen Pfad und würde ihn für EN-Nutzer (i18nextLng-Cookie) auf
  // /en/monitoring umleiten. next.config.ts kennt aber nur "/monitoring" als
  // Tunnel-Ziel, ein umgeleiteter Request landet dort nicht mehr — Sentry
  // meldet dann clientseitige Fehler nicht mehr (siehe Kommentar in next.config.ts).
  '/monitoring',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (SKIP_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const hasEnPrefix = pathname.startsWith('/en')
  const cookieLang = request.cookies.get('i18nextLng')?.value

  if (!cookieLang) return NextResponse.next()

  const isEnglish = cookieLang === 'en'

  if (isEnglish && !hasEnPrefix) {
    const url = request.nextUrl.clone()
    url.pathname = `/en${pathname}`
    return NextResponse.redirect(url)
  }

  if (!isEnglish && hasEnPrefix) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/^\/en/, '') || '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
