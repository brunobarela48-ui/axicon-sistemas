import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'
import { renderNewsletter, dayLabelPtBR } from '../../../lib/newsletter-template'

// POST /api/newsletter/teste
// Envia a newsletter para UM destinatário via Resend (envio de teste).
// Reusa a lógica de preview.js para montar o HTML.
//
// Body: o mesmo payload de /preview + { destinatario: "email@dominio.com" }

const RESEND_API_URL = 'https://api.resend.com/emails'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY não configurada no servidor' })
  }

  const body = req.body || {}
  const {
    destinatario,
    assunto = 'Áxicon Daily News',
    headline = '',
    intro = [],
    moodLine = 'fora do eixo',
    edicaoNumber = 1,
    dayLabel,
    stories: storyIds = [],
    manchetes: mancheteIds = [],
  } = body

  if (!destinatario || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destinatario)) {
    return res.status(400).json({ error: 'destinatario inválido' })
  }
  if (!headline) return res.status(400).json({ error: 'headline obrigatório' })

  const allIds = [...storyIds, ...mancheteIds]
  if (!allIds.length) return res.status(400).json({ error: 'selecione ao menos uma notícia' })

  const { data: items, error } = await supabaseAdmin
    .from('noticias_publicadas')
    .select('*')
    .in('id', allIds)
  if (error) return res.status(500).json({ error: error.message })
  const byId = new Map(items.map(i => [i.id, i]))

  const stories = storyIds.map(id => byId.get(id)).filter(Boolean).map(n => ({
    eyebrow: n.tag ? `${n.tag.toUpperCase()} · ${n.fonte || ''}`.trim().replace(/·\s*$/, '') : (n.fonte || ''),
    title: n.titulo,
    image: n.imagem || null,
    imageCredit: n.fonte,
    lead: n.resumo || '',
    body: (n.analise || n.resumo || '').split(/\n+/).filter(Boolean),
    link: n.link,
  }))

  const manchetes = mancheteIds.length ? {
    kicker: 'Em pauta',
    title: 'As principais notícias da edição',
    notes: mancheteIds.map(id => byId.get(id)).filter(Boolean).map(n => ({
      title: n.titulo,
      body: n.resumo || '',
      link: n.link,
    })),
  } : null

  const coverImage = stories.find(s => s.image)?.image || null
  const coverCredit = stories.find(s => s.image)?.imageCredit || null

  const { html, text } = renderNewsletter({
    assunto, headline,
    intro: Array.isArray(intro) ? intro : String(intro).split(/\n\n+/),
    moodLine, edicaoNumber,
    dayLabel: dayLabel || dayLabelPtBR(),
    coverImage, coverCredit, manchetes, stories,
  })

  // Sender padrão usa o domínio resend.dev até o usuário verificar
  // axiconsolucoes.com no Resend. Quando verificar, basta trocar a env
  // RESEND_SENDER para "Áxicon Daily News <newsletter@axiconsolucoes.com>".
  const from = process.env.RESEND_SENDER || 'Áxicon Daily News <onboarding@resend.dev>'

  try {
    const r = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [destinatario],
        subject: assunto,
        html,
        text,
        headers: {
          'X-Entity-Ref-ID': `axicon-daily-${edicaoNumber}-${Date.now()}`,
        },
      }),
    })
    const out = await r.json().catch(() => ({}))
    if (!r.ok) {
      return res.status(r.status).json({ error: out?.message || out?.error || 'Erro Resend HTTP ' + r.status, details: out })
    }
    return res.status(200).json({ ok: true, id: out.id || null, destinatario })
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao chamar Resend: ' + e.message })
  }
}
