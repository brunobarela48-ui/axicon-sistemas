import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'
import { sendEmail, sendBulk, senderFrom } from '../../../lib/brevo'

// POST /api/newsletter/custom
// Dispara um HTML "avulso" (não-newsletter) via Brevo.
//
// Modos (campo "modo"):
//   "teste"      → envia para 1 destinatário (campo destinatarios[0])
//   "assinantes" → envia para todos newsletter_assinantes.ativo = true
//                  Faz replace de %unsubscribe% pelo link único de cada um.
//   "lista"      → envia para a lista crua passada em destinatarios[]
//                  Sem unsubscribe individual; só List-Unsubscribe genérico.
//
// Body:
//   {
//     modo: 'teste' | 'assinantes' | 'lista',
//     assunto: string,
//     html: string,                    // HTML completo do email
//     rotulo?: string,                 // título amigável p/ histórico
//     destinatarios?: string[],        // obrigatório para 'teste' e 'lista'
//   }
//
// Segurança:
//   - Admin only
//   - HARD_CAP de 100 destinatários por execução (timeout serverless + plano Brevo)
//   - Modos 'assinantes' e 'lista' arquivam o envio em newsletter_envios
//     com tipo = 'custom', preservando snapshot do HTML.

export const config = { maxDuration: 60 }

const SITE_BASE = 'https://www.axiconsolucoes.com'
const HARD_CAP = 100

const isEmail = (s) => typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim())

function htmlToText(html) {
  if (!html) return ''
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  if (!process.env.BREVO_API_KEY) return res.status(500).json({ error: 'BREVO_API_KEY não configurada' })

  const body = req.body || {}
  const {
    modo,
    assunto,
    html,
    rotulo,
    destinatarios = [],
  } = body

  if (!['teste', 'assinantes', 'lista'].includes(modo)) {
    return res.status(400).json({ error: 'modo inválido (use teste, assinantes ou lista)' })
  }
  if (!assunto || typeof assunto !== 'string') return res.status(400).json({ error: 'assunto obrigatório' })
  if (!html || typeof html !== 'string' || html.length < 20) return res.status(400).json({ error: 'html obrigatório' })

  const from = senderFrom('Áxicon')
  const text = htmlToText(html)

  // ── MODO TESTE ────────────────────────────────────────────────────────
  if (modo === 'teste') {
    const dest = destinatarios[0]
    if (!isEmail(dest)) return res.status(400).json({ error: 'destinatário de teste inválido' })
    try {
      const out = await sendEmail({
        sender: from, to: dest, subject: assunto, html, text,
        headers: { 'X-Entity-Ref-ID': `axicon-custom-test-${Date.now()}` },
      })
      return res.status(200).json({ ok: true, modo: 'teste', destinatario: dest, id: out.messageId || null })
    } catch (e) {
      return res.status(500).json({ error: 'Falha (Brevo): ' + e.message })
    }
  }

  // ── MODOS EM LOTE: monta lista de destinatários ──────────────────────
  let recipientes = [] // { email, unsubUrl? }
  if (modo === 'assinantes') {
    const { data: assinantes, error: errSubs } = await supabaseAdmin
      .from('newsletter_assinantes')
      .select('id, email, nome, unsubscribe_token')
      .eq('ativo', true)
      .order('criado_em', { ascending: true })
      .limit(HARD_CAP + 1)
    if (errSubs) return res.status(500).json({ error: errSubs.message })
    if (!assinantes?.length) return res.status(400).json({ error: 'Nenhum assinante ativo cadastrado.' })
    if (assinantes.length > HARD_CAP) {
      return res.status(400).json({ error: `Lista de assinantes tem mais de ${HARD_CAP} ativos. Refatorar para fila.` })
    }
    recipientes = assinantes.map(a => ({
      id: a.id,
      email: a.email,
      unsubUrl: `${SITE_BASE}/api/newsletter/descadastrar?token=${a.unsubscribe_token}`,
    }))
  } else {
    // modo === 'lista'
    const emails = Array.isArray(destinatarios) ? destinatarios : []
    const limpos = Array.from(new Set(
      emails.map(s => String(s).trim().toLowerCase()).filter(isEmail)
    ))
    if (!limpos.length) return res.status(400).json({ error: 'Nenhum e-mail válido na lista.' })
    if (limpos.length > HARD_CAP) {
      return res.status(400).json({ error: `Lista colada tem ${limpos.length} e-mails. Máximo por envio: ${HARD_CAP}.` })
    }
    recipientes = limpos.map(email => ({ email }))
  }

  // ── Arquiva o início do envio ─────────────────────────────────────────
  const { data: envio, error: errEnvio } = await supabaseAdmin
    .from('newsletter_envios')
    .insert({
      tipo: 'custom',
      edicao_numero: null,
      assunto,
      iniciado_por: user.id,
      payload_json: {
        modo,
        rotulo: rotulo || null,
        total_destinatarios: recipientes.length,
      },
      html_snapshot: html,
      text_snapshot: text,
    })
    .select('id')
    .single()
  if (errEnvio) return res.status(500).json({ error: 'Falha registrando envio: ' + errEnvio.message })

  // ── Envia individualmente via Brevo ──────────────────────────────────
  let enviados = 0, falhas = 0
  let sendError = null
  try {
    const out = await sendBulk(recipientes, {
      sender: from,
      subject: assunto,
      html: (r) => (r.unsubUrl ? html.replace(/%unsubscribe%/g, r.unsubUrl) : html),
      text: (r) => (r.unsubUrl ? text.replace(/%unsubscribe%/g, r.unsubUrl) : text),
      headers: (r) => (r.unsubUrl ? {
        'List-Unsubscribe': `<${r.unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      } : undefined),
    })
    enviados = out.enviados
    falhas = out.falhas

    // Se for assinantes, atualiza ultimo_envio_em só dos que enviaram
    if (modo === 'assinantes') {
      const okEmails = new Set(out.resultados.filter(x => x.ok).map(x => x.email))
      const okIds = recipientes.filter(r => okEmails.has(r.email)).map(r => r.id).filter(Boolean)
      if (okIds.length) {
        await supabaseAdmin
          .from('newsletter_assinantes')
          .update({ ultimo_envio_em: new Date().toISOString() })
          .in('id', okIds)
      }
    }
  } catch (e) {
    falhas = recipientes.length
    sendError = e.message
  }

  await supabaseAdmin.from('newsletter_envios').update({
    finalizado_em: new Date().toISOString(),
    total_enviados: enviados,
    total_falhas: falhas,
  }).eq('id', envio.id)

  return res.status(200).json({
    ok: true,
    envio_id: envio.id,
    modo,
    total: recipientes.length,
    enviados,
    falhas,
    erro: sendError,
  })
}
