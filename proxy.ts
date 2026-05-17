import { NextRequest, NextResponse } from 'next/server'

/**
 * MAPA DE DOMÍNIOS — Áxicon Soluções Financeiras
 *
 * www.axiconsolucoes.com              → site público completo (public/index.html)
 * axiconsolucoes.com                  → redireciona 301 para www
 * institucional.axiconsolucoes.com    → LP business plan (public/institucional.html)
 * intranet.axiconsolucoes.com         → sistema CRM interno (Next.js app)
 * www.intranet.axiconsolucoes.com     → sistema CRM interno
 *
 * REGRA DE SEGURANÇA: domínios públicos (www, institucional) SÓ servem
 * arquivos estáticos do public/. Qualquer rota Next.js dinâmica (/curadoria,
 * /crm, /comunicacao etc.) chamada em domínio público é redirecionada para
 * intranet.axiconsolucoes.com. Isso evita o vazamento de páginas internas
 * que aconteceu antes ("um domínio virou outro").
 */

const PUBLIC_HOSTS = new Set([
  'www.axiconsolucoes.com',
  'institucional.axiconsolucoes.com',
])

const INTRANET_HOSTS = new Set([
  'intranet.axiconsolucoes.com',
  'www.intranet.axiconsolucoes.com',
])

const INTRANET_URL = 'https://intranet.axiconsolucoes.com'

// APIs públicas — autorizadas a serem servidas a partir de www.*.
// Tudo que não está aqui é considerado API interna e fica restrito à intranet.
const PUBLIC_API_PATHS = new Set([
  '/api/noticias',
])

// Whitelist de paths que domínios públicos podem servir.
// Tudo que não bate aqui é tratado como tentativa de acessar rota interna.
function isStaticPublicPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true
  // APIs públicas explicitamente liberadas
  if (PUBLIC_API_PATHS.has(pathname)) return true
  // arquivos estáticos por extensão (cobre HTML, CSS, JS, fontes, imagens, etc.)
  if (/\.(html|css|js|json|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf|eot|map|xml|txt|mp4|webm|pdf)$/i.test(pathname)) return true
  return false
}

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get('host') || '').toLowerCase()
  const pathname = request.nextUrl.pathname

  // ───────────────────────────────────────────────────────────────────
  // DOMÍNIOS PÚBLICOS — só servem o site estático em public/
  // ───────────────────────────────────────────────────────────────────
  if (hostname === 'institucional.axiconsolucoes.com') {
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/institucional.html'
      return NextResponse.rewrite(url)
    }
    if (isStaticPublicPath(pathname)) return NextResponse.next()
    // Tentativa de acessar rota dinâmica em domínio público → manda pra intranet
    return NextResponse.redirect(INTRANET_URL + pathname, 302)
  }

  if (hostname === 'www.axiconsolucoes.com') {
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/index.html'
      return NextResponse.rewrite(url)
    }
    if (isStaticPublicPath(pathname)) return NextResponse.next()
    return NextResponse.redirect(INTRANET_URL + pathname, 302)
  }

  // axiconsolucoes.com apex → www
  if (hostname === 'axiconsolucoes.com') {
    const url = request.nextUrl.clone()
    url.host = 'www.axiconsolucoes.com'
    return NextResponse.redirect(url, 301)
  }

  // ───────────────────────────────────────────────────────────────────
  // INTRANET — passa direto para o Next.js (todas as rotas dinâmicas)
  // ───────────────────────────────────────────────────────────────────
  if (INTRANET_HOSTS.has(hostname)) {
    return NextResponse.next()
  }

  // Hostname não mapeado (preview Vercel *.vercel.app, localhost, etc.) —
  // passa direto para o Next.js. Em desenvolvimento isso é o esperado.
  return NextResponse.next()
}

export const config = {
  // Inclui /api/ no matcher para podermos bloquear API admin em domínios
  // públicos. Excluímos só os internos do Next.js e o favicon.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
