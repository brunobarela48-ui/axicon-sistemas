import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // institucional.axiconsolucoes.com → institucional.html
  if (hostname.startsWith('institucional.')) {
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/institucional.html'
      return NextResponse.rewrite(url)
    }
  }

  // www.axiconsolucoes.com e axiconsolucoes.com → site institucional
  const isPublic =
    hostname === 'www.axiconsolucoes.com' ||
    hostname === 'axiconsolucoes.com'
  if (isPublic && (pathname === '/' || pathname === '')) {
    const url = request.nextUrl.clone()
    url.pathname = '/index.html'
    return NextResponse.rewrite(url)
  }

  // intranet.axiconsolucoes.com e www.intranet.axiconsolucoes.com → CRM (passa direto)
  const isIntranet =
    hostname === 'intranet.axiconsolucoes.com' ||
    hostname === 'www.intranet.axiconsolucoes.com'
  if (isIntranet) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
