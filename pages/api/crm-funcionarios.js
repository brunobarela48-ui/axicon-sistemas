import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

// crm_funcionarios é agora a tabela unificada: RH + controle de login
function toRow(f) {
  return {
    id:            f.id,
    empresa_id:    'axicon',
    nome:          f.nome          || null,
    cargo:         f.cargo         || null,
    email:         f.email         || null,
    telefone:      f.telefone      || null,
    cpf:           f.cpf           || null,
    salario:       f.salario       || 0,
    tipo:          f.tipo          || null,
    data_admissao: f.dataAdmissao  || null,
    status:        f.status        || 'ativo',
    bitrix_id:     f.bitrixId      || null,
    importado_de:  f.importadoDe   || null,
    // Campos de acesso / login
    role:          f.role          || null,
    ativo:         f.ativo         ?? true,
    tem_acesso:    f.temAcesso     ?? false,
    atualizado_em: new Date().toISOString(),
  }
}

function fromRow(r) {
  return {
    id:           r.id,
    nome:         r.nome,
    cargo:        r.cargo,
    email:        r.email,
    telefone:     r.telefone,
    cpf:          r.cpf,
    salario:      r.salario,
    tipo:         r.tipo,
    dataAdmissao: r.data_admissao,
    status:       r.status,
    bitrixId:     r.bitrix_id,
    importadoDe:  r.importado_de,
    // Campos de acesso / login
    role:         r.role,
    ativo:        r.ativo,
    temAcesso:    r.tem_acesso ?? false,
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('crm_funcionarios')
      .select('*')
      .eq('empresa_id', 'axicon')
      .order('id')
    if (error) return res.status(500).json({ error: error.message })

    if (data.length === 0) {
      const { data: old } = await supabase.from('crm_data').select('dados').eq('empresa_id', 'axicon').single()
      const legacy = old?.dados?.funcionarios
      if (Array.isArray(legacy) && legacy.length > 0) {
        await supabase.from('crm_funcionarios').insert(legacy.map(toRow))
        return res.status(200).json({ funcionarios: legacy })
      }
    }
    return res.status(200).json({ funcionarios: data.map(fromRow) })
  }

  if (req.method === 'PUT') {
    const { funcionarios } = req.body
    if (!Array.isArray(funcionarios)) return res.status(400).json({ error: 'funcionarios deve ser array' })
    const rows = funcionarios.map(toRow)
    const ids  = funcionarios.map(f => f.id)
    if (rows.length > 0) {
      const { error } = await supabase.from('crm_funcionarios').upsert(rows, { onConflict: 'id' })
      if (error) return res.status(500).json({ error: error.message })
    }
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('crm_funcionarios').delete().eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      if (delErr) return res.status(500).json({ error: delErr.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
