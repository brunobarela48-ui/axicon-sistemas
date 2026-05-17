import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'

// POST /api/newsletter/custom
// Dispara um HTML "avulso" (não-newsletter) via Resend.
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
//   - HARD_CAP de 100 destinatários por execução (limite do batch Resend)
//   - Modos 'assinantes' e 'lista' arquivam o envio em newsletter_envios
//     com tipo = 'custom', preservando snapshot do HTML.

export const config = { maxDuration: 60 }

const RESEND_API_URL = 'https://api.resend.com/emails'
const RESEND_BATCH_URL = 'https://api.resend.com/emails/batch'
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

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY não configurada' })

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

  const from = process.env.RESEND_SENDER || 'Áxicon <onboarding@resend.dev>'
  const text = htmlToText(html)

  // ── MODO TESTE ────────────────────────────────────────────────────────
  if (modo === 'teste') {
    const dest = destinatarios[0]
    if (!isEmail(dest)) return res.status(400).json({ error: 'destinatário de teste inválido' })
    try {
      const r = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          from, to: [dest], subject: assunto, html, text,
          headers: { 'X-Entity-Ref-ID': `axicon-custom-test-${Date.now()}` },
        }),
      })
      const out = await r.json().catch(() => ({}))
      if (!r.ok) return res.status(r.status).json({ error: out?.message || 'Erro Resend HTTP ' + r.status, details: out })
      return res.status(200).json({ ok: true, modo: 'teste', destinatario: dest, id: out.id || null })
    } catch (e) {
      return res.status(500).json({ error: 'Falha Resend: ' + e.message })
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

  // ── Monta batch Resend ────────────────────────────────────────────────
  const emails = recipientes.map(r => {
    const finalHtml = r.unsubUrl ? html.replace(/%unsubscribe%/g, r.unsubUrl) : html
    const finalText = r.unsubUrl ? text.replace(/%unsubscribe%/g, r.unsubUrl) : text
    const headers = {}
    if (r.unsubUrl) {
      headers['List-Unsubscribe'] = `<${r.unsubUrl}>`
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    }
    return {
      from,
      to: [r.email],
      subject: assunto,
      html: finalHtml,
      text: finalText,
      headers,
    }
  })

  let enviados = 0, falhas = 0
  let resendError = null
  try {
    const r = await fetch(RESEND_BATCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(emails),
    })
    const out = await r.json().catch(() => ({}))
    if (!r.ok) {
      await supabaseAdmin.from('newsletter_envios').update({
        finalizado_em: new Date().toISOString(),
        total_enviados: 0,
        total_falhas: recipientes.length,
      }).eq('id', envio.id)
      return res.status(r.status).json({ error: out?.message || 'Erro Resend HTTP ' + r.status, details: out })
    }
    const successItems = Array.isArray(out?.data) ? out.data : []
    enviados = successItems.length || recipientes.length

    // Se for assinantes, atualiza ultimo_envio_em
    if (modo === 'assinantes') {
      const ids = recipientes.map(r => r.id).filter(Boolean)
      if (ids.length) {
        await supabaseAdmin
          .from('newsletter_assinantes')
          .update({ ultimo_envio_em: new Date().toISOString() })
          .in('id', ids)
      }
    }
  } catch (e) {
    falhas = recipientes.length
    resendError = e.message
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
    erro: resendError,
  })
}
