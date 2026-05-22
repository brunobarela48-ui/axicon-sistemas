import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'
import { renderNewsletter, dayLabelPtBR } from '../../../lib/newsletter-template'
import { sendBulk, senderFrom } from '../../../lib/brevo'

// POST /api/newsletter/enviar
// Envia a newsletter para TODOS os assinantes ativos.
//
// Body: mesmo payload de /preview (assunto, headline, intro, edicaoNumber,
// stories[], manchetes[]).
//
// Segurança:
// - Admin only
// - Bloqueia se outro envio da MESMA edicao_numero rodou nos últimos 30 min
//   (evita envio duplicado por clique acidental)
// - Hard cap de 100 destinatários por execução (timeout serverless + plano
//   Brevo). Quando passar disso, refatoramos para job em background ou
//   múltiplas chamadas (ou messageVersions do Brevo num único POST)
//
// Registra a operação na tabela newsletter_envios.

export const config = { maxDuration: 60 }

const SITE_BASE = 'https://www.axiconsolucoes.com'
const HARD_CAP = 100

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  if (!process.env.BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY não configurada' })

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
  if (!allIds.length) return res.status(400).json({ error: 'selecione ao menos 1 notícia' })

  // 1) Anti-duplo-envio: bloqueia se já rodou para a mesma edição nos últimos 30 min
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: recentes } = await supabaseAdmin
    .from('newsletter_envios')
    .select('id, iniciado_em')
    .eq('edicao_numero', edicaoNumber)
    .gte('iniciado_em', cutoff)
    .limit(1)
  if (recentes?.length) {
    return res.status(409).json({
      error: `Edição #${edicaoNumber} já foi enviada nos últimos 30 min. Aguarde ou mude o número da edição.`,
    })
  }

  // 2) Busca assinantes ativos
  const { data: assinantes, error: errSubs } = await supabaseAdmin
    .from('newsletter_assinantes')
    .select('id, email, nome, unsubscribe_token')
    .eq('ativo', true)
    .order('criado_em', { ascending: true })
    .limit(HARD_CAP + 1)

  if (errSubs) return res.status(500).json({ error: errSubs.message })
  if (!assinantes?.length) return res.status(400).json({ error: 'Nenhum assinante ativo. Cadastre destinatários primeiro.' })
  if (assinantes.length > HARD_CAP) {
    return res.status(400).json({ error: `Lista tem mais de ${HARD_CAP} ativos. Por enquanto o envio é cappeado para evitar timeout. Me avise para refatorar com fila.` })
  }

  // 3) Busca as notícias
  const { data: items, error: errNews } = await supabaseAdmin
    .from('noticias_publicadas')
    .select('*')
    .in('id', allIds)
  if (errNews) return res.status(500).json({ error: errNews.message })
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
      title: n.titulo, body: n.resumo || '', link: n.link,
    })),
  } : null
  const coverImage = stories.find(s => s.image)?.image || null
  const coverCredit = stories.find(s => s.image)?.imageCredit || null

  const { html: htmlTemplate, text: textTemplate } = renderNewsletter({
    assunto, headline,
    intro: Array.isArray(intro) ? intro : String(intro).split(/\n\n+/),
    moodLine, edicaoNumber,
    dayLabel: dayLabel || dayLabelPtBR(),
    coverImage, coverCredit, manchetes, stories,
  })

  // 4) Registra início do envio. Salvamos o HTML e texto renderizados em
  //    snapshot para o histórico — assim a edição arquivada não muda mesmo
  //    se as notícias-fonte forem editadas ou removidas depois.
  const { data: envio, error: errEnvio } = await supabaseAdmin
    .from('newsletter_envios')
    .insert({
      edicao_numero: edicaoNumber,
      assunto,
      iniciado_por: user.id,
      payload_json: { stories: storyIds, manchetes: mancheteIds, headline, intro, moodLine },
      html_snapshot: htmlTemplate,
      text_snapshot: textTemplate,
    })
    .select('id')
    .single()
  if (errEnvio) return res.status(500).json({ error: 'Falha registrando envio: ' + errEnvio.message })

  // 5+6) Envia individualmente via Brevo — cada e-mail com unsubscribe único
  let enviados = 0, falhas = 0, falhasDetalhes = []
  try {
    const recipientes = assinantes.map(a => ({
      id: a.id,
      email: a.email,
      name: a.nome || undefined,
      unsubUrl: `${SITE_BASE}/api/newsletter/descadastrar?token=${a.unsubscribe_token}`,
    }))
    const out = await sendBulk(recipientes, {
      sender: senderFrom('Áxicon Daily News'),
      subject: assunto,
      html: (r) => htmlTemplate.replace(/%unsubscribe%/g, r.unsubUrl),
      text: (r) => textTemplate.replace(/%unsubscribe%/g, r.unsubUrl),
      headers: (r) => ({
        'List-Unsubscribe': `<${r.unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }),
    })
    enviados = out.enviados
    falhas = out.falhas
    falhasDetalhes = out.resultados.filter(x => !x.ok).map(x => `${x.email}: ${x.erro}`)

    // Atualiza ultimo_envio_em apenas dos que realmente enviaram
    const okEmails = new Set(out.resultados.filter(x => x.ok).map(x => x.email))
    const okIds = assinantes.filter(a => okEmails.has(a.email)).map(a => a.id)
    if (okIds.length) {
      await supabaseAdmin
        .from('newsletter_assinantes')
        .update({ ultimo_envio_em: new Date().toISOString() })
        .in('id', okIds)
    }
  } catch (e) {
    falhas = assinantes.length
    falhasDetalhes.push(e.message)
  }

  // 7) Finaliza o registro
  await supabaseAdmin.from('newsletter_envios').update({
    finalizado_em: new Date().toISOString(),
    total_enviados: enviados,
    total_falhas: falhas,
  }).eq('id', envio.id)

  return res.status(200).json({
    ok: true,
    envio_id: envio.id,
    total: assinantes.length,
    enviados,
    falhas,
    detalhes: falhasDetalhes,
  })
}
