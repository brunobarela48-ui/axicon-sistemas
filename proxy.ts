import { NextRequest, NextResponse } from 'next/server'

/**
 * MAPA DE DOMÍNIOS — Áxicon Soluções Financeiras
 *
 * www.axiconsolucoes.com              → site público completo (index.html)
 * axiconsolucoes.com                  → redireciona para www.axiconsolucoes.com
 * institucional.axiconsolucoes.com    → LP business plan (institucional.html)
 * intranet.axiconsolucoes.com         → sistema CRM interno
 * www.intranet.axiconsolucoes.com     → sistema CRM interno
 */
export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // institucional.axiconsolucoes.com → LP / business plan
  if (hostname === 'institucional.axiconsolucoes.com') {
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/institucional.html'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // www.axiconsolucoes.com → site público completo
  if (hostname === 'www.axiconsolucoes.com') {
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/index.html'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // axiconsolucoes.com (apex) → redireciona para www
  if (hostname === 'axiconsolucoes.com') {
    const url = request.nextUrl.clone()
    url.host = 'www.axiconsolucoes.com'
    return NextResponse.redirect(url, 301)
  }

  // intranet e www.intranet → CRM (passa direto para o Next.js app)
  if (
    hostname === 'intranet.axiconsolucoes.com' ||
    hostname === 'www.intranet.axiconsolucoes.com'
  ) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
