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

  // www.axiconsolucoes.com and axiconsolucoes.com → institutional homepage (index.html)
  if (
    hostname === 'www.axiconsolucoes.com' ||
    hostname === 'axiconsolucoes.com'
  ) {
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/index.html'
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
