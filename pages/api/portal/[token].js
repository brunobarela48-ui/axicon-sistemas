import { supabaseAdmin as supabase } from '../../../lib/supabase-admin'

export const config = { api: { bodyParser: false } }

const CHECKLIST_DOCS = [
  { id: 'contrato_social', label: 'Contrato Social' },
  { id: 'cartao_cnpj',     label: 'Cartão CNPJ' },
  { id: 'balanco_p1',      label: 'Balanço Patrimonial (ano -1)' },
  { id: 'balanco_p2',      label: 'Balanço Patrimonial (ano -2)' },
  { id: 'dre_p1',          label: 'DRE (ano -1)' },
  { id: 'dre_p2',          label: 'DRE (ano -2)' },
  { id: 'extrato_ban',     label: 'Extratos Bancários (6 meses)' },
  { id: 'comp_endereco',   label: 'Comprovante de Endereço' },
  { id: 'rg_socios',       label: 'RG/CPF dos Sócios' },
  { id: 'cnd',             label: 'Certidão Negativa de Débitos' },
]

function parseExtras(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return {} }
}

function fromNeg(r, area) {
  const extras = parseExtras(r.campos_extras)
  return {
    id: r.id,
    titulo: r.titulo,
    valor: r.valor,
    etapa: r.etapa,
    produto: r.produto,
    area: extras.area || area,
    checklist: extras.checklist_docs || {},
  }
}

async function findContact(token) {
  const { data, error } = await supabase
    .from('crm_contatos')
    .select('*')
    .eq('empresa_id', 'axicon')
  if (error || !data?.length) return null
  return data.find(c => parseExtras(c.campos_extras).portal_token === token) || null
}

export default async function handler(req, res) {
  const { token } = req.query
  if (!token) return res.status(400).json({ error: 'Token ausente' })

  const c = await findContact(token)
  if (!c) return res.status(404).json({ error: 'Link inválido ou expirado' })

  const contato = { id: c.id, nome: c.nome, empresa: c.empresa, email: c.email, area: c.area }

  // ── GET: retorna dados do portal ──────────────────────────────────────────
  if (req.method === 'GET') {
    const [resV, resA, resComs] = await Promise.all([
      supabase.from('crm_negocios_varejo').select('*').eq('contato_id', c.id).eq('empresa_id', 'axicon'),
      supabase.from('crm_negocios_atacado').select('*').eq('contato_id', c.id).eq('empresa_id', 'axicon'),
      supabase.from('comunicados').select('*').eq('ativo', true).order('ordem').order('criado_em', { ascending: false }),
    ])
    const negocios = [
      ...(resV.data || []).map(r => fromNeg(r, 'varejo')),
      ...(resA.data || []).map(r => fromNeg(r, 'atacado')),
    ]
    return res.status(200).json({ contato, negocios, comunicados: resComs.data || [] })
  }

  // ── POST: upload de documento ─────────────────────────────────────────────
  if (req.method === 'POST') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)

    const contentType = req.headers['content-type'] || ''
    const boundary = contentType.split('boundary=')[1]
    if (!boundary) return res.status(400).json({ error: 'Boundary ausente' })

    const parts = splitMultipart(body, boundary)
    const filePart  = parts.find(p => p.filename)
    const negocioId = Number(parts.find(p => p.name === 'negocio_id')?.data?.toString())
    const itemId    = parts.find(p => p.name === 'item_id')?.data?.toString()

    if (!filePart || !negocioId || !itemId) return res.status(400).json({ error: 'Dados incompletos' })

    const path = `portal/${c.id}/${negocioId}/${Date.now()}_${filePart.filename}`
    const { error: storErr } = await supabase.storage
      .from('anexos')
      .upload(path, filePart.data, { contentType: filePart.contentType || 'application/octet-stream', upsert: false })
    if (storErr) return res.status(500).json({ error: storErr.message })

    const { data: urlData } = supabase.storage.from('anexos').getPublicUrl(path)

    // Atualiza checklist no negócio (tenta varejo, depois atacado)
    for (const tabela of ['crm_negocios_varejo', 'crm_negocios_atacado']) {
      const { data: neg } = await supabase
        .from(tabela).select('campos_extras').eq('id', negocioId).eq('empresa_id', 'axicon').maybeSingle()
      if (!neg) continue
      const extras = parseExtras(neg.campos_extras)
      const cl = extras.checklist_docs || {}
      const updatedCl = {
        ...cl,
        [itemId]: { checked: true, arquivo: { nome: filePart.filename, tipo: filePart.contentType, url: urlData.publicUrl } },
      }
      await supabase.from(tabela)
        .update({ campos_extras: { ...extras, checklist_docs: updatedCl }, atualizado_em: new Date().toISOString() })
        .eq('id', negocioId)
      break
    }

    return res.status(200).json({ ok: true, url: urlData.publicUrl })
  }

  res.status(405).json({ error: 'Método não permitido' })
}

function splitMultipart(buffer, boundary) {
  const sep = Buffer.from('--' + boundary)
  const parts = []
  let start = 0
  while (start < buffer.length) {
    const idx = buffer.indexOf(sep, start)
    if (idx === -1) break
    const next = buffer.indexOf(sep, idx + sep.length)
    const end  = next === -1 ? buffer.length : next
    const part = buffer.slice(idx + sep.length + 2, end - 2)
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) { start = end; continue }
    const headerStr = part.slice(0, headerEnd).toString()
    const data      = part.slice(headerEnd + 4)
    const dispMatch = headerStr.match(/Content-Disposition:[^\r\n]*name="([^"]*)"/)
    const fileMatch = headerStr.match(/filename="([^"]*)"/)
    const ctMatch   = headerStr.match(/Content-Type:\s*([^\r\n]+)/)
    parts.push({ name: dispMatch?.[1], filename: fileMatch?.[1], contentType: ctMatch?.[1]?.trim(), data })
    start = end
  }
  return parts
}
