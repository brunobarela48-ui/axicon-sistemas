import crypto from 'node:crypto'

// Fontes RSS. Cada feed pode opcionalmente carregar uma tag default.
// Se algum URL der 404/timeout, o item é só logado e o resto continua.
export const FEEDS = [
  // Brasileiros (finanças/negócios)
  { source: 'InfoMoney',     url: 'https://www.infomoney.com.br/feed/' },
  { source: 'Money Times',   url: 'https://www.moneytimes.com.br/feed/' },
  { source: 'Brazil Journal',url: 'https://braziljournal.com/feed/' },
  { source: 'Suno Notícias', url: 'https://www.suno.com.br/noticias/feed/' },
  // Regulatório
  { source: 'BCB',           url: 'https://www.bcb.gov.br/api/feed/sitebcb/notas', defaultTag: 'Regulatório' },
  { source: 'CVM',           url: 'https://conteudo.cvm.gov.br/noticias.rss', defaultTag: 'Regulatório' },
]

const TAGS_VALIDAS = ['Macro','Câmbio','Crédito','Mercado de Capitais','Agro','Cross-Border','Regulatório']

export function hashLink(url) {
  return crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex').slice(0, 32)
}

export function stripHtml(s) {
  return (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// Parser regex minimalista para RSS 2.0 (e Atom rudimentar).
// Não cobre feeds exóticos — se algum falhar, removemos da lista.
export function parseRSS(xml, source) {
  const items = []
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || []
  for (const block of itemBlocks) {
    const titulo = pickTag(block, 'title')
    let link = pickTag(block, 'link')
    if (!link) {
      // Atom: <link href="..." />
      const m = block.match(/<link[^>]*href=["']([^"']+)["']/i)
      if (m) link = m[1]
    }
    const resumoRaw = pickTag(block, 'description') || pickTag(block, 'summary') || pickTag(block, 'content:encoded') || ''
    const data = pickTag(block, 'pubDate') || pickTag(block, 'published') || pickTag(block, 'updated') || ''
    const imagem = extractImage(block, resumoRaw)
    if (!titulo || !link) continue
    items.push({
      titulo: stripHtml(titulo),
      resumo: stripHtml(resumoRaw).slice(0, 320),
      link: link.trim(),
      data: data ? safeIsoDate(data) : null,
      fonte: source,
      imagem,
    })
  }
  return items
}

function pickTag(xml, tag) {
  // Aceita <tag>x</tag>, <tag><![CDATA[x]]></tag>, ou <ns:tag>...</ns:tag>
  const escaped = tag.replace(/:/g, '\\:')
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i')
  const m = xml.match(re)
  if (!m) return ''
  let val = m[1]
  const cdata = val.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  if (cdata) val = cdata[1]
  return val.trim()
}

function extractImage(block, resumoHtml) {
  // 1. enclosure
  let m = block.match(/<enclosure[^>]*url=["']([^"']+\.(?:jpg|jpeg|png|webp))[^"']*["']/i)
  if (m) return m[1]
  // 2. media:content
  m = block.match(/<media:content[^>]*url=["']([^"']+)["']/i)
  if (m) return m[1]
  // 3. media:thumbnail
  m = block.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i)
  if (m) return m[1]
  // 4. primeira <img> no description
  if (resumoHtml) {
    const im = resumoHtml.match(/<img[^>]*src=["']([^"']+)["']/i)
    if (im) return im[1]
  }
  return null
}

function safeIsoDate(s) {
  const d = new Date(s)
  if (isNaN(d)) return null
  return d.toISOString()
}

export async function fetchFeed(feed, { timeoutMs = 10000 } = {}) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AxiconNewsBot/1.0)' },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = parseRSS(xml, feed.source)
    if (feed.defaultTag) {
      for (const it of items) { if (!it.tag) it.tag = feed.defaultTag }
    }
    return { ok: true, source: feed.source, items, count: items.length }
  } catch (e) {
    return { ok: false, source: feed.source, error: e.message, items: [] }
  } finally {
    clearTimeout(t)
  }
}

// Enriquece um item com Claude: resumo de 1-2 frases + tag.
// Falhas não derrubam o pipeline — preserva o resumo bruto do feed.
export async function enrichWithClaude(item, apiKey) {
  if (!apiKey) return item
  const prompt = `Você é editor de uma boutique de crédito estruturado.
Dada esta notícia, faça duas coisas:
1) RESUMO: 1-2 frases curtas (máx 280 caracteres) sobre o que importa para um cliente institucional (crédito estruturado, câmbio, mercado de capitais, regulatório, agro).
2) TAG: classifique em UMA categoria entre: ${TAGS_VALIDAS.join(', ')}.

Devolva APENAS JSON válido no formato: {"resumo":"...","tag":"..."}

Notícia:
Título: ${item.titulo}
Fonte: ${item.fonte}
Resumo bruto: ${item.resumo || '(sem resumo)'}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error('claude HTTP ' + res.status)
    const data = await res.json()
    const text = (data.content || []).map(b => b.text || '').join('').trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return item
    const out = JSON.parse(jsonMatch[0])
    return {
      ...item,
      resumo: typeof out.resumo === 'string' && out.resumo.length > 10 ? out.resumo : item.resumo,
      tag: TAGS_VALIDAS.includes(out.tag) ? out.tag : (item.tag || null),
    }
  } catch {
    return item
  }
}
