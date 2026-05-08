import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

function toRow(f) {
  return {
    id:            f.id,
    empresa_id:    'axicon',
    nome:          f.nome        || null,
    cnpj:          f.cnpj        || null,
    categoria:     f.categoria   || null,
    email:         f.email       || null,
    telefone:      f.telefone    || null,
    contato:       f.contato     || null,
    endereco:      f.endereco    || null,
    observacoes:   f.observacoes || null,
    atualizado_em: new Date().toISOString(),
  }
}

function fromRow(r) {
  return {
    id:          r.id,
    nome:        r.nome,
    cnpj:        r.cnpj,
    categoria:   r.categoria,
    email:       r.email,
    telefone:    r.telefone,
    contato:     r.contato,
    endereco:    r.endereco,
    observacoes: r.observacoes,
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('fin_fornecedores')
      .select('*')
      .eq('empresa_id', 'axicon')
      .order('id')
    if (error) return res.status(500).json({ error: error.message })

    if (data.length === 0) {
      const { data: old } = await supabase.from('crm_data').select('dados').eq('empresa_id', 'axicon').single()
      const legacy = old?.dados?.fornecedores
      if (Array.isArray(legacy) && legacy.length > 0) {
        await supabase.from('fin_fornecedores').insert(legacy.map(toRow))
        return res.status(200).json({ fornecedores: legacy })
      }
    }
    return res.status(200).json({ fornecedores: data.map(fromRow) })
  }

  if (req.method === 'PUT') {
    const { fornecedores } = req.body
    if (!Array.isArray(fornecedores)) return res.status(400).json({ error: 'fornecedores deve ser array' })
    const rows = fornecedores.map(toRow)
    const ids  = fornecedores.map(f => f.id)
    if (rows.length > 0) {
      const { error } = await supabase.from('fin_fornecedores').upsert(rows, { onConflict: 'id' })
      if (error) return res.status(500).json({ error: error.message })
    }
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('fin_fornecedores').delete().eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      if (delErr) return res.status(500).json({ error: delErr.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
