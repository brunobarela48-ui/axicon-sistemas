import { supabaseAdmin } from '../../../lib/supabase-admin'
import { FEEDS, fetchFeed, enrichWithClaude, hashLink } from '../../../lib/news-fetcher'
import { getAdminUser } from '../../../lib/auth'

// Endpoint chamado pelo GitHub Actions às 06h/12h/15h (Bearer CRON_SECRET)
// ou manualmente pelo botão "Buscar agora" na /curadoria (Bearer sessão admin).

export const config = {
  maxDuration: 60,  // RSS + Claude pode levar até ~30s
}

function hasCronSecret(req) {
  const want = process.env.CRON_SECRET
  if (!want) return false
  const got = req.headers.authorization?.replace('Bearer ', '') || req.query.token
  return got === want
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }
  if (!hasCronSecret(req) && !(await getAdminUser(req))) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const startedAt = Date.now()
  const results = { feeds: [], inseridos: 0, duplicados: 0, falhas: 0 }

  // 1. Fetch paralelo de todos os feeds
  const settled = await Promise.all(FEEDS.map(f => fetchFeed(f)))
  const allItems = []
  for (const r of settled) {
    results.feeds.push({ source: r.source, ok: r.ok, count: r.count || 0, error: r.error || null })
    if (!r.ok) { results.falhas++; continue }
    allItems.push(...r.items)
  }

  // 2. Dedupe interna (mesmo link em múltiplas fontes) — fica a primeira
  const byHash = new Map()
  for (const it of allItems) {
    const h = hashLink(it.link)
    if (!byHash.has(h)) byHash.set(h, { ...it, link_hash: h })
  }

  // 3. Pula itens que já existem na tabela
  const hashes = Array.from(byHash.keys())
  if (hashes.length === 0) {
    return res.status(200).json({ ok: true, took_ms: Date.now() - startedAt, ...results })
  }
  const { data: existing } = await supabaseAdmin
    .from('noticias_pendentes')
    .select('link_hash')
    .in('link_hash', hashes)
  const seen = new Set((existing || []).map(r => r.link_hash))

  const novos = []
  for (const [h, it] of byHash) {
    if (seen.has(h)) { results.duplicados++; continue }
    novos.push(it)
  }

  // 4. Enriquece com Claude (rate de respeito — sequencial leve)
  const apiKey = process.env.ANTHROPIC_API_KEY
  const enriched = []
  for (const it of novos.slice(0, 30)) {  // máx 30 por rodada para controlar custo
    const out = await enrichWithClaude(it, apiKey)
    enriched.push(out)
  }

  // 5. Insere em batch
  if (enriched.length) {
    const rows = enriched.map(it => ({
      titulo: it.titulo.slice(0, 500),
      resumo: it.resumo || null,
      analise: it.analise || null,
      tempo_leitura: it.tempo_leitura || null,
      fonte: it.fonte,
      link: it.link,
      link_hash: it.link_hash,
      data: it.data || new Date().toISOString(),
      tag: it.tag || null,
      imagem: it.imagem || null,
      status: 'pendente',
    }))
    const { error } = await supabaseAdmin.from('noticias_pendentes').insert(rows)
    if (error) {
      return res.status(500).json({ error: error.message, ...results })
    }
    results.inseridos = enriched.length
  }

  return res.status(200).json({ ok: true, took_ms: Date.now() - startedAt, ...results })
}
