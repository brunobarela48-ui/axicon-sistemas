import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'
import { renderNewsletter, dayLabelPtBR } from '../../../lib/newsletter-template'

// POST /api/newsletter/preview
// Recebe seleção de notícias publicadas + textos editoriais e devolve
// { html, text } prontos para preview, cópia ou envio via Brevo.
//
// Body esperado:
// {
//   assunto: "bom dia. — edição #847",
//   headline: "o crédito está mudando de <em>endereço</em>.",
//   intro: ["bom dia. ...", "boa leitura. ☕"],
//   moodLine: "fora do eixo",
//   edicaoNumber: 847,
//   dayLabel: "Sábado, 16 de maio de 2026",  (opcional, default hoje)
//   stories:   ["uuid-1", "uuid-2"],   // viram pautas longas (com análise no body)
//   manchetes: ["uuid-3", "uuid-4"]    // viram mini-notas (só título + resumo)
// }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  const body = req.body || {}
  const {
    assunto = 'Áxicon Daily News',
    headline = '',
    intro = [],
    moodLine = 'fora do eixo',
    edicaoNumber = 1,
    dayLabel,
    stories: storyIds = [],
    manchetes: mancheteIds = [],
  } = body

  if (!headline) return res.status(400).json({ error: 'headline obrigatório' })
  const allIds = [...storyIds, ...mancheteIds]
  if (allIds.length === 0) {
    return res.status(400).json({ error: 'selecione ao menos uma notícia (story ou manchete)' })
  }

  // Busca todas as notícias selecionadas
  const { data: items, error } = await supabaseAdmin
    .from('noticias_publicadas')
    .select('*')
    .in('id', allIds)
  if (error) return res.status(500).json({ error: error.message })

  const byId = new Map(items.map(i => [i.id, i]))

  // Monta stories (pautas longas)
  const stories = storyIds.map(id => byId.get(id)).filter(Boolean).map(n => ({
    eyebrow: n.tag ? `${n.tag.toUpperCase()} · ${n.fonte || ''}`.trim().replace(/·\s*$/, '') : (n.fonte || ''),
    title: n.titulo,
    image: n.imagem || null,
    imageCredit: n.fonte,
    lead: n.resumo || '',
    body: (n.analise || n.resumo || '').split(/\n+/).filter(Boolean),
    link: n.link,
  }))

  // Monta manchetes (mini-notas)
  const manchetes = mancheteIds.length ? {
    kicker: 'Em pauta',
    title: 'As principais notícias da edição',
    notes: mancheteIds.map(id => byId.get(id)).filter(Boolean).map(n => ({
      title: n.titulo,
      body: n.resumo || '',
      link: n.link,
    })),
  } : null

  // Cover image: imagem da primeira story (se existir)
  const coverImage = stories.find(s => s.image)?.image || null
  const coverCredit = stories.find(s => s.image)?.imageCredit || null

  const { html, text } = renderNewsletter({
    assunto,
    headline,
    intro: Array.isArray(intro) ? intro : String(intro).split(/\n\n+/),
    moodLine,
    edicaoNumber,
    dayLabel: dayLabel || dayLabelPtBR(),
    coverImage,
    coverCredit,
    manchetes,
    stories,
  })

  return res.status(200).json({ html, text, subject: assunto })
}
