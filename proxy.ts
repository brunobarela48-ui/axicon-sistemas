import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  if (hostname.startsWith('institucional.')) {
    const url = request.nextUrl.clone()
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/institucional.html'
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
