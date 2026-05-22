import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'
import { renderNewsletter, dayLabelPtBR } from '../../../lib/newsletter-template'
import { sendEmail, senderFrom } from '../../../lib/brevo'

// POST /api/newsletter/teste
// Envia a newsletter para UM destinatário via Brevo (envio de teste).
// Reusa a lógica de preview.js para montar o HTML.
//
// Body: o mesmo payload de /preview + { destinatario: "email@dominio.com" }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ error: 'BREVO_API_KEY não configurada no servidor' })
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

  try {
    const out = await sendEmail({
      sender: senderFrom('Áxicon Daily News'),
      to: destinatario,
      subject: assunto,
      html, text,
      headers: { 'X-Entity-Ref-ID': `axicon-daily-${edicaoNumber}-${Date.now()}` },
    })
    return res.status(200).json({ ok: true, id: out.messageId || null, destinatario })
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao enviar (Brevo): ' + e.message })
  }
}
