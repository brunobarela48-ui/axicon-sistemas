import { supabaseAdmin } from '../../../lib/supabase-admin'

// POST /api/leads/simulador
// Endpoint público (chamado pelos simuladores em /simular/*).
// Cria card no CRM (varejo ou atacado conforme o tipo) + email pro time
// + devolve wa.me URL para o frontend redirecionar.

const RESEND_API_URL = 'https://api.resend.com/emails'
const TEAM_WHATSAPP = '5544991147236'
const TEAM_EMAIL = process.env.LEADS_EMAIL || 'contato@axiconsolucoes.com'
const SITE_BASE = 'https://www.axiconsolucoes.com'
const INTRANET_BASE = 'https://intranet.axiconsolucoes.com'

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

function isEmail(s) { return typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) }
function isPhone(s) { return typeof s === 'string' && s.replace(/\D/g, '').length >= 10 }

function brl(v) {
  if (!Number.isFinite(v)) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const PRODUTO_LABEL = {
  'home-equity':     'Home Equity',
  'consorcio':       'Consórcio Estratégico',
  'diagnostico-pj':  'Diagnóstico PJ',
}

const TIPO_AREA = {
  'home-equity':     'varejo',
  'consorcio':       'varejo',
  'diagnostico-pj':  'atacado',
}

// Calcula um "valor" representativo para o CRM mostrar no card
function valorEstim(tipo, inputs, outputs) {
  if (tipo === 'home-equity')    return Math.round(outputs?.faixaAlta || 0)
  if (tipo === 'consorcio')      return Math.round(inputs?.valorCarta || 0)
  if (tipo === 'diagnostico-pj') {
    const map = { '100mil_1mi': 500_000, '1mi_10mi': 5_000_000, '10mi_50mi': 25_000_000, '50_plus': 75_000_000 }
    return map[inputs?.ticket] || 0
  }
  return 0
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  // Body esperado: { tipo, inputs, outputs, lead: { nome, email, whatsapp, consentimento } }
  const { tipo, inputs, outputs, lead } = req.body || {}
  if (!tipo || !PRODUTO_LABEL[tipo]) return res.status(400).json({ error: 'tipo inválido' })
  if (!lead || !lead.nome || !isEmail(lead.email) || !isPhone(lead.whatsapp)) {
    return res.status(400).json({ error: 'Preencha nome, e-mail e WhatsApp válidos' })
  }
  if (!lead.consentimento) {
    return res.status(400).json({ error: 'É necessário aceitar a Política de Privacidade' })
  }

  const area = TIPO_AREA[tipo]
  const tabela = area === 'varejo' ? 'crm_negocios_varejo' : 'crm_negocios_atacado'
  const etapa = area === 'varejo' ? 'lead_captado' : 'lead_capitado'
  const produtoLabel = PRODUTO_LABEL[tipo]
  const valor = valorEstim(tipo, inputs, outputs)

  // Monta título e descrição legível pro consultor
  const tituloPrefix = area === 'varejo' ? '🔵 Lead simulador' : '🟢 Lead simulador'
  const titulo = `${tituloPrefix}: ${produtoLabel} — ${lead.nome}`
  const descricao = montaDescricao(tipo, inputs, outputs, lead)

  // Insere no CRM
  const camposExtras = {
    area,
    origem: 'simulador-web',
    tipo_simulador: tipo,
    lead_nome: lead.nome,
    lead_email: lead.email,
    lead_whatsapp: lead.whatsapp,
    lead_consentimento_em: new Date().toISOString(),
    simulacao_inputs: inputs,
    simulacao_outputs: outputs,
  }

  const linha = {
    empresa_id: 'axicon',
    titulo,
    valor,
    etapa,
    produto: produtoLabel,
    probabilidade: 20,
    descricao,
    contato_id: null,
    consultor_id: null,
    data_criacao: new Date().toISOString(),
    campos_extras: camposExtras,
    importado_de: 'simulador-web',
    atualizado_em: new Date().toISOString(),
  }

  const { data: insertData, error: errInsert } = await supabaseAdmin
    .from(tabela)
    .insert(linha)
    .select('id')
    .maybeSingle()

  if (errInsert) {
    // Loga mas não bloqueia o lead — ainda manda email e retorna wa.me
    console.error('[simulador] falha ao gravar no CRM', errInsert.message)
  }

  const leadId = insertData?.id || null

  // Envia email pro time via Resend (best-effort)
  await enviarEmailEquipe({ tipo, inputs, outputs, lead, leadId, area, valor })
    .catch(e => console.error('[simulador] falha no email', e.message))

  // Monta wa.me URL com a mensagem
  const waUrl = makeWhatsAppUrl({ tipo, lead, inputs, outputs })

  return res.status(200).json({
    ok: true,
    leadId,
    waUrl,
  })
}

function montaDescricao(tipo, inputs, outputs, lead) {
  const lines = [
    `📌 Contato: ${lead.nome} · ${lead.email} · ${lead.whatsapp}`,
    `🌐 Origem: simulador público em ${SITE_BASE}/simular/${tipo}`,
    '',
  ]
  if (tipo === 'home-equity') {
    lines.push('📊 Simulação Home Equity:')
    lines.push(`  Valor do imóvel: ${brl(inputs.valorImovel)}`)
    if (inputs.dividas) lines.push(`  Dívidas a quitar: ${brl(inputs.dividas)}`)
    lines.push(`  Finalidade: ${inputs.finalidade || '—'}`)
    lines.push(`  Prazo desejado: ${inputs.prazoMeses} meses`)
    lines.push('')
    lines.push(`💰 Estimativa: ${brl(outputs.faixaBaixa)} a ${brl(outputs.faixaAlta)}`)
    lines.push(`💳 Parcela aproximada: ${brl(outputs.parcelaBaixa)} a ${brl(outputs.parcelaAlta)}`)
  } else if (tipo === 'consorcio') {
    lines.push('📊 Simulação Consórcio:')
    lines.push(`  Valor da carta: ${brl(inputs.valorCarta)}`)
    lines.push(`  Categoria: ${inputs.categoria || '—'}`)
    lines.push(`  Prazo: ${inputs.prazoMeses} meses`)
    lines.push('')
    lines.push(`💳 Parcela estimada: ${brl(outputs.parcela)}`)
  } else if (tipo === 'diagnostico-pj') {
    lines.push('📊 Diagnóstico PJ:')
    lines.push(`  Faturamento: ${inputs.faturamento || '—'}`)
    lines.push(`  Setor: ${inputs.setor || '—'}`)
    lines.push(`  Necessidade: ${inputs.necessidade || '—'}`)
    lines.push(`  Ticket: ${inputs.ticket || '—'}`)
    lines.push(`  Prazo: ${inputs.prazo || '—'}`)
    lines.push('')
    lines.push(`✨ Linha recomendada: ${outputs.principal?.linha || '—'}`)
    lines.push(`   Motivo: ${outputs.principal?.motivo || ''}`)
    if (outputs.secundarias?.length) {
      lines.push('   Complementos:')
      outputs.secundarias.forEach(r => lines.push(`     • ${r.linha}`))
    }
  }
  return lines.join('\n')
}

function makeWhatsAppUrl({ tipo, lead, inputs, outputs }) {
  let msg = `Olá! Acabei de fazer uma simulação no site da Áxicon.\n\nNome: ${lead.nome}\n`
  if (tipo === 'home-equity') {
    msg += `Tipo: Home Equity\n`
    msg += `Imóvel: ${brl(inputs.valorImovel)}\n`
    if (inputs.dividas) msg += `Dívidas: ${brl(inputs.dividas)}\n`
    msg += `Faixa estimada: ${brl(outputs.faixaBaixa)} a ${brl(outputs.faixaAlta)}\n`
  } else if (tipo === 'consorcio') {
    msg += `Tipo: Consórcio\n`
    msg += `Carta: ${brl(inputs.valorCarta)} · ${inputs.categoria}\n`
    msg += `Parcela estimada: ${brl(outputs.parcela)}\n`
  } else if (tipo === 'diagnostico-pj') {
    msg += `Tipo: Diagnóstico PJ\n`
    msg += `Linha recomendada: ${outputs.principal?.linha}\n`
    msg += `Faturamento: ${inputs.faturamento || '—'} · Ticket: ${inputs.ticket || '—'}\n`
  }
  msg += `\nGostaria de conversar com um consultor.`
  return `https://wa.me/${TEAM_WHATSAPP}?text=${encodeURIComponent(msg)}`
}

async function enviarEmailEquipe({ tipo, inputs, outputs, lead, leadId, area, valor }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[simulador] RESEND_API_KEY não configurada — email não será enviado')
    return
  }

  const produto = PRODUTO_LABEL[tipo]
  const subject = `Novo lead simulador · ${produto} · ${lead.nome}`
  const html = `<!doctype html><html><body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#713F2A;border-bottom:2px solid #B87333;padding-bottom:8px">
  📩 Novo lead via simulador
</h2>
<p style="font-size:13px;color:#666">Simulador <strong>${esc(produto)}</strong> · ${new Date().toLocaleString('pt-BR')}</p>

<h3>Contato</h3>
<p>
  <strong>${esc(lead.nome)}</strong><br>
  📧 <a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a><br>
  📱 <a href="https://wa.me/${esc(lead.whatsapp).replace(/\D/g,'')}">${esc(lead.whatsapp)}</a>
</p>

<h3>Simulação</h3>
<pre style="background:#FAF6EE;padding:14px;border-radius:6px;font-size:13px;line-height:1.5;white-space:pre-wrap">${esc(montaDescricao(tipo, inputs, outputs, lead))}</pre>

<p style="margin-top:24px">
  ${leadId
    ? `<a href="${INTRANET_BASE}/crm?lead=${leadId}" style="display:inline-block;background:#001489;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Abrir card no CRM →</a>`
    : '<em style="color:#c62828">Atenção: falha ao gravar no CRM. Tratar manualmente.</em>'
  }
</p>

<p style="font-size:11px;color:#888;margin-top:32px">
  Card vai pra <strong>${area === 'varejo' ? 'pipeline_varejo' : 'pipeline_atacado'}</strong>, etapa "Lead Captado".
  Valor estimado registrado: ${brl(valor)}.
</p>
</body></html>`

  const from = process.env.RESEND_SENDER || 'Áxicon Leads <onboarding@resend.dev>'
  const r = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to: [TEAM_EMAIL], subject, html, reply_to: lead.email }),
  })
  if (!r.ok) {
    const errBody = await r.text().catch(() => '')
    throw new Error(`Resend HTTP ${r.status}: ${errBody.slice(0, 200)}`)
  }
}
