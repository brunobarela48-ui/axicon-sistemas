import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

function toRow(a) {
  return {
    id:           a.id,
    empresa_id:   'axicon',
    negocio_id:   a.negocioId   || null,
    tipo:         a.tipo        || null,
    titulo:       a.titulo      || null,
    data:         a.data        || null,
    concluida:    a.concluida   ?? false,
    atualizado_em:new Date().toISOString(),
  }
}

function fromRow(r) {
  return {
    id:        r.id,
    negocioId: r.negocio_id,
    tipo:      r.tipo,
    titulo:    r.titulo,
    data:      r.data,
    concluida: r.concluida,
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('crm_atividades')
      .select('*')
      .eq('empresa_id', 'axicon')
      .order('id')
    if (error) return res.status(500).json({ error: error.message })

    if (data.length === 0) {
      const { data: old } = await supabase.from('crm_data').select('dados').eq('empresa_id', 'axicon').single()
      const legacy = old?.dados?.atividades
      if (Array.isArray(legacy) && legacy.length > 0) {
        await supabase.from('crm_atividades').insert(legacy.map(toRow))
        return res.status(200).json({ atividades: legacy })
      }
    }
    return res.status(200).json({ atividades: data.map(fromRow) })
  }

  if (req.method === 'PUT') {
    const { atividades } = req.body
    if (!Array.isArray(atividades)) return res.status(400).json({ error: 'atividades deve ser array' })
    const rows = atividades.map(toRow)
    const ids  = atividades.map(a => a.id)
    if (rows.length > 0) {
      const { error } = await supabase.from('crm_atividades').upsert(rows, { onConflict: 'id' })
      if (error) return res.status(500).json({ error: error.message })
    }
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('crm_atividades').delete().eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      if (delErr) return res.status(500).json({ error: delErr.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
