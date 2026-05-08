import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

function toRow(c) {
  return {
    id:            c.id,
    empresa_id:    'axicon',
    tipo:          c.tipo          || null,
    descricao:     c.descricao     || null,
    valor:         c.valor         || 0,
    vencimento:    c.vencimento    || null,
    categoria:     c.categoria     || null,
    recorrente:    c.recorrente    ?? false,
    numero_nf:     c.numeroNF      || null,
    status:        c.status        || 'pendente',
    fornecedor:    c.fornecedor    || null,
    cliente:       c.cliente       || null,
    fornecedor_id: c.fornecedorId  || null,
    empresa_rel:   c.empresaId     || null,
    data_pagamento:c.dataPagamento || null,
    atualizado_em: new Date().toISOString(),
  }
}

function fromRow(r) {
  return {
    id:            r.id,
    tipo:          r.tipo,
    descricao:     r.descricao,
    valor:         r.valor,
    vencimento:    r.vencimento,
    categoria:     r.categoria,
    recorrente:    r.recorrente,
    numeroNF:      r.numero_nf,
    status:        r.status,
    fornecedor:    r.fornecedor,
    cliente:       r.cliente,
    fornecedorId:  r.fornecedor_id,
    empresaId:     r.empresa_rel,
    dataPagamento: r.data_pagamento,
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('fin_contas')
      .select('*')
      .eq('empresa_id', 'axicon')
      .order('id')
    if (error) return res.status(500).json({ error: error.message })

    if (data.length === 0) {
      const { data: old } = await supabase.from('crm_data').select('dados').eq('empresa_id', 'axicon').single()
      const legacy = old?.dados?.contas
      if (Array.isArray(legacy) && legacy.length > 0) {
        await supabase.from('fin_contas').insert(legacy.map(toRow))
        return res.status(200).json({ contas: legacy })
      }
    }
    return res.status(200).json({ contas: data.map(fromRow) })
  }

  if (req.method === 'PUT') {
    const { contas } = req.body
    if (!Array.isArray(contas)) return res.status(400).json({ error: 'contas deve ser array' })
    const rows = contas.map(toRow)
    const ids  = contas.map(c => c.id)
    if (rows.length > 0) {
      const { error } = await supabase.from('fin_contas').upsert(rows, { onConflict: 'id' })
      if (error) return res.status(500).json({ error: error.message })
    }
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('fin_contas').delete().eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      if (delErr) return res.status(500).json({ error: delErr.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
