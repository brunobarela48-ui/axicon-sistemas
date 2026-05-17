import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'

// POST /api/newsletter/assinantes-import
// Body: { csv: "email[,nome]\n..." }   OU   { emails: [{email, nome}] }
//
// Faz dedup por email (case-insensitive) e upsert. Inativos viram ativos
// novamente quando reapareceram na importação.

function isEmail(s) { return typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) }

function parseCSV(text) {
  const rows = []
  for (const lineRaw of text.split(/\r?\n/)) {
    const line = lineRaw.trim()
    if (!line) continue
    // Aceita "email", "email,nome", ou "nome,email" — detecta qual coluna tem o @
    const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length === 0) continue
    const emailIdx = cols.findIndex(c => isEmail(c))
    if (emailIdx === -1) continue
    const email = cols[emailIdx].toLowerCase()
    const nome = cols.filter((_, i) => i !== emailIdx).join(' ').trim() || null
    rows.push({ email, nome })
  }
  return rows
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  const { csv, emails: emailsRaw, fonte } = req.body || {}
  let rows = []
  if (typeof csv === 'string' && csv.trim()) {
    rows = parseCSV(csv)
  } else if (Array.isArray(emailsRaw)) {
    rows = emailsRaw.map(r => ({ email: String(r.email || '').trim().toLowerCase(), nome: r.nome || null })).filter(r => isEmail(r.email))
  } else {
    return res.status(400).json({ error: 'Envie csv (string) ou emails (array)' })
  }

  if (!rows.length) return res.status(400).json({ error: 'Nenhum email válido encontrado na importação' })

  // Dedup interno
  const byEmail = new Map()
  for (const r of rows) byEmail.set(r.email, r)
  const unique = Array.from(byEmail.values())

  // Busca emails que já existem para distinguir inserções de reativações
  const { data: existing } = await supabaseAdmin
    .from('newsletter_assinantes')
    .select('id, email, ativo')
    .in('email', unique.map(r => r.email))
  const existingMap = new Map((existing || []).map(e => [e.email, e]))

  const toInsert = []
  const toReactivate = []
  let reativados = 0
  let inseridos = 0

  for (const r of unique) {
    const e = existingMap.get(r.email)
    if (e) {
      if (!e.ativo) { toReactivate.push(e.id); reativados++ }
    } else {
      toInsert.push({
        email: r.email,
        nome: r.nome,
        fonte: fonte || 'csv',
        criado_por: user.id,
      })
      inseridos++
    }
  }

  if (toInsert.length) {
    const { error } = await supabaseAdmin.from('newsletter_assinantes').insert(toInsert)
    if (error) return res.status(500).json({ error: error.message })
  }
  if (toReactivate.length) {
    const { error } = await supabaseAdmin
      .from('newsletter_assinantes')
      .update({ ativo: true, descadastro_em: null, descadastro_motivo: null })
      .in('id', toReactivate)
    if (error) return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({
    ok: true,
    recebidos: rows.length,
    unicos: unique.length,
    inseridos,
    reativados,
    jaAtivos: unique.length - inseridos - reativados,
  })
}
