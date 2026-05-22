// Cliente de e-mail transacional via Brevo (API REST v3).
// Server-only: usa a BREVO_API_KEY — nunca importe isto no client.

const BREVO_API = 'https://api.brevo.com/v3'

function apiKey() {
  const k = process.env.BREVO_API_KEY
  if (!k) throw new Error('BREVO_API_KEY não configurada no servidor')
  return k
}

// Remetente: nome opcional, e-mail sempre do domínio autenticado (env).
// O domínio precisa estar autenticado no Brevo — no caso, axiconsolucoes.com.
export function senderFrom(name) {
  return {
    name:  name || process.env.BREVO_SENDER_NAME || 'Áxicon Soluções Financeiras',
    email: process.env.BREVO_SENDER_EMAIL || 'contato@axiconsolucoes.com',
  }
}
function defaultSender() { return senderFrom() }

// Aceita 'a@b.com' | {email,name,...} | array. Mantém campos extras
// (ex.: unsubUrl) para o sendBulk personalizar por destinatário.
function coerce(to) {
  const arr = Array.isArray(to) ? to : [to]
  return arr.map(r => (typeof r === 'string' ? { email: r } : r)).filter(r => r && r.email)
}
// Sanitiza para o formato que a API do Brevo aceita em to/cc/bcc.
function apiRecipients(to) {
  return coerce(to).map(r => (r.name ? { email: r.email, name: r.name } : { email: r.email }))
}

/**
 * Envia um e-mail transacional.
 * @param {object} o
 * @param {string|object|array} o.to       destinatário(s)
 * @param {string} o.subject               assunto
 * @param {string} [o.html]                corpo HTML (htmlContent)
 * @param {string} [o.text]                corpo texto puro (fallback)
 * @param {string|object} [o.replyTo]      responder-para
 * @param {object} [o.sender]              {name,email} — default = remetente do domínio
 * @param {object} [o.params]              variáveis de template ({{ params.nome }})
 * @param {string[]} [o.tags]              tags p/ filtrar estatísticas no Brevo
 * @param {array} [o.cc] @param {array} [o.bcc]
 * @returns {Promise<{messageId:string}>}
 */
export async function sendEmail({ to, subject, html, text, replyTo, sender, params, tags, cc, bcc, headers }) {
  const recipients = apiRecipients(to)
  if (!recipients.length) throw new Error('Nenhum destinatário válido')
  if (!subject)           throw new Error('Assunto obrigatório')
  if (!html && !text)     throw new Error('Informe html ou text')

  const body = {
    sender: sender || defaultSender(),
    to: recipients,
    subject,
    ...(html ? { htmlContent: html } : {}),
    ...(text ? { textContent: text } : {}),
    ...(replyTo ? { replyTo: typeof replyTo === 'string' ? { email: replyTo } : replyTo } : {}),
    ...(params ? { params } : {}),
    ...(tags ? { tags } : {}),
    ...(headers ? { headers } : {}),
    ...(cc ? { cc: apiRecipients(cc) } : {}),
    ...(bcc ? { bcc: apiRecipients(bcc) } : {}),
  }

  const r = await fetch(`${BREVO_API}/smtp/email`, {
    method: 'POST',
    headers: { 'api-key': apiKey(), 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.message || `Brevo respondeu ${r.status}`)
  return { messageId: data.messageId }
}

/**
 * Envia o mesmo conteúdo para vários destinatários, cada um no seu próprio
 * e-mail (sem expor a lista). Base para campanhas: aceita html como string ou
 * como função (recipient) => string para personalizar por destinatário.
 * Faz envios em paralelo limitado e devolve um resumo.
 * @returns {Promise<{enviados:number, falhas:number, resultados:Array}>}
 */
export async function sendBulk(recipients, { subject, html, text, replyTo, sender, tags, headers, concurrency = 5 } = {}) {
  const list = coerce(recipients)
  if (!list.length) throw new Error('Lista de destinatários vazia')

  const resultados = []
  for (let i = 0; i < list.length; i += concurrency) {
    const lote = list.slice(i, i + concurrency)
    const saidas = await Promise.allSettled(lote.map(rec =>
      sendEmail({
        to: rec,
        subject,
        html: typeof html === 'function' ? html(rec) : html,
        text: typeof text === 'function' ? text(rec) : text,
        headers: typeof headers === 'function' ? headers(rec) : headers,
        replyTo, sender, tags,
      })
    ))
    saidas.forEach((s, j) => resultados.push(
      s.status === 'fulfilled'
        ? { email: lote[j].email, ok: true,  messageId: s.value.messageId }
        : { email: lote[j].email, ok: false, erro: s.reason?.message || 'falhou' }
    ))
  }
  const enviados = resultados.filter(r => r.ok).length
  return { enviados, falhas: resultados.length - enviados, resultados }
}

/** Health-check: confirma que a API key é válida e o domínio está ativo. */
export async function brevoAccount() {
  const r = await fetch(`${BREVO_API}/account`, {
    headers: { 'api-key': apiKey(), accept: 'application/json' },
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.message || `Brevo respondeu ${r.status}`)
  return data
}
