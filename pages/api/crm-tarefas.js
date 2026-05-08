import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

function toRow(t) {
  return {
    id:             t.id,
    empresa_id:     'axicon',
    titulo:         t.titulo         || null,
    descricao:      t.descricao      || null,
    descricao_rich: t.descricaoRich  || null,
    lista_id:       t.listaId        || t.lista || null,
    lista:          t.lista          || null,
    prioridade:     t.prioridade     || 'media',
    data_inicio:    t.dataInicio     || null,
    data_limite:    t.dataLimite     || t.dataVencimento || null,
    responsavel_id: t.responsavelId  || null,
    criador_id:     t.criadorId      || null,
    status:         t.status         || 'pendente',
    tags:           Array.isArray(t.tags) ? t.tags.join(', ') : (t.tags || null),
    data_criacao:   t.dataCriacao    || null,
    data_conclusao: t.dataConclusao  || null,
    subtarefas:     t.subtarefas     || [],
    comentarios:    t.comentarios    || [],
    anexos:         t.anexos         || [],
    atualizado_em:  new Date().toISOString(),
  }
}

function fromRow(r) {
  return {
    id:            r.id,
    titulo:        r.titulo,
    descricao:     r.descricao,
    descricaoRich: r.descricao_rich,
    listaId:       r.lista_id,
    lista:         r.lista,
    prioridade:    r.prioridade,
    dataInicio:    r.data_inicio,
    dataLimite:    r.data_limite,
    dataVencimento:r.data_limite,
    responsavelId: r.responsavel_id,
    criadorId:     r.criador_id,
    status:        r.status,
    tags:          r.tags ? r.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    dataCriacao:   r.data_criacao,
    dataConclusao: r.data_conclusao,
    subtarefas:    r.subtarefas || [],
    comentarios:   r.comentarios || [],
    anexos:        r.anexos || [],
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('crm_tarefas')
      .select('*')
      .eq('empresa_id', 'axicon')
      .order('id')
    if (error) return res.status(500).json({ error: error.message })

    if (data.length === 0) {
      const { data: old } = await supabase.from('crm_data').select('dados').eq('empresa_id', 'axicon').single()
      const legacy = old?.dados?.tarefas
      if (Array.isArray(legacy) && legacy.length > 0) {
        await supabase.from('crm_tarefas').insert(legacy.map(toRow))
        return res.status(200).json({ tarefas: legacy })
      }
    }
    return res.status(200).json({ tarefas: data.map(fromRow) })
  }

  if (req.method === 'PUT') {
    const { tarefas } = req.body
    if (!Array.isArray(tarefas)) return res.status(400).json({ error: 'tarefas deve ser array' })
    const rows = tarefas.map(toRow)
    const ids  = tarefas.map(t => t.id)
    if (rows.length > 0) {
      const { error } = await supabase.from('crm_tarefas').upsert(rows, { onConflict: 'id' })
      if (error) return res.status(500).json({ error: error.message })
    }
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('crm_tarefas').delete().eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      if (delErr) return res.status(500).json({ error: delErr.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
