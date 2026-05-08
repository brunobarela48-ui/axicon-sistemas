import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

function toRow(e) {
  return {
    id:            typeof e.id === 'number' && Number.isInteger(e.id) ? e.id : Math.floor(e.id) || Date.now(),
    empresa_id:    'axicon',
    data:          e.data       || null,
    descricao:     e.descricao  || null,
    valor:         e.valor      || 0,
    tipo:          e.tipo       || null,
    conciliado:    e.conciliado ?? false,
    conta_id:      e.contaId    || null,
    atualizado_em: new Date().toISOString(),
  }
}

function fromRow(r) {
  return {
    id:        r.id,
    data:      r.data,
    descricao: r.descricao,
    valor:     r.valor,
    tipo:      r.tipo,
    conciliado:r.conciliado,
    contaId:   r.conta_id,
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('fin_extratos')
      .select('*')
      .eq('empresa_id', 'axicon')
      .order('data', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    if (data.length === 0) {
      const { data: old } = await supabase.from('crm_data').select('dados').eq('empresa_id', 'axicon').single()
      const legacy = old?.dados?.extratos
      if (Array.isArray(legacy) && legacy.length > 0) {
        const rows = legacy.map((e, i) => toRow({ ...e, id: typeof e.id === 'number' && Number.isInteger(e.id) ? e.id : i + 1 }))
        await supabase.from('fin_extratos').insert(rows)
        return res.status(200).json({ extratos: legacy })
      }
    }
    return res.status(200).json({ extratos: data.map(fromRow) })
  }

  if (req.method === 'PUT') {
    const { extratos } = req.body
    if (!Array.isArray(extratos)) return res.status(400).json({ error: 'extratos deve ser array' })
    // Normaliza IDs para inteiros
    const normalized = extratos.map((e, i) => ({ ...e, id: typeof e.id === 'number' && Number.isInteger(e.id) ? e.id : i + 1 }))
    const rows = normalized.map(toRow)
    const ids  = normalized.map(e => e.id)
    if (rows.length > 0) {
      const { error } = await supabase.from('fin_extratos').upsert(rows, { onConflict: 'id' })
      if (error) return res.status(500).json({ error: error.message })
    }
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('fin_extratos').delete().eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      if (delErr) return res.status(500).json({ error: delErr.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
