import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

// Converte objeto JS (camelCase) → linha da tabela (snake_case)
function toRow(c) {
  return {
    id:           c.id,
    empresa_id:   'axicon',
    nome:         c.nome         || null,
    email:        c.email        || null,
    telefone:     c.telefone     || null,
    empresa:      c.empresa      || null,
    cargo:        c.cargo        || null,
    tipo:         c.tipo         || 'PF',
    area:         c.area         || 'varejo',
    origem:       c.origem       || null,
    cidade:       c.cidade       || null,
    endereco:     c.endereco     || null,
    documento:    c.documento    || null,
    responsavel:  c.responsavel  || null,
    faturamento:  c.faturamento  || 0,
    tempo_empresa:c.tempoEmpresa || 0,
    consultor_id: c.consultorId  || null,
    criado:       c.criado       || null,
    observacoes:  c.observacoes  || null,
    campos_extras:c.campos_extras || {},
    bitrix_id:    c.bitrixId     || null,
    importado_de: c.importadoDe  || null,
    atualizado_em:new Date().toISOString(),
  }
}

// Converte linha da tabela (snake_case) → objeto JS (camelCase)
function fromRow(r) {
  return {
    id:           r.id,
    nome:         r.nome,
    email:        r.email,
    telefone:     r.telefone,
    empresa:      r.empresa,
    cargo:        r.cargo,
    tipo:         r.tipo,
    area:         r.area,
    origem:       r.origem,
    cidade:       r.cidade,
    endereco:     r.endereco,
    documento:    r.documento,
    responsavel:  r.responsavel,
    faturamento:  r.faturamento,
    tempoEmpresa: r.tempo_empresa,
    consultorId:  r.consultor_id,
    criado:       r.criado,
    observacoes:  r.observacoes,
    campos_extras:r.campos_extras || {},
    bitrixId:     r.bitrix_id,
    importadoDe:  r.importado_de,
  }
}

export default async function handler(req, res) {
  // GET — lista todos os contatos
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('crm_contatos')
      .select('*')
      .eq('empresa_id', 'axicon')
      .order('id')

    if (error) return res.status(500).json({ error: error.message })

    // Migração automática: se a tabela está vazia, puxa do blob antigo
    if (data.length === 0) {
      const { data: old } = await supabase
        .from('crm_data')
        .select('dados')
        .eq('empresa_id', 'axicon')
        .single()

      const legacy = old?.dados?.contatos
      if (Array.isArray(legacy) && legacy.length > 0) {
        await supabase.from('crm_contatos').insert(legacy.map(toRow))
        return res.status(200).json({ contatos: legacy })
      }
    }

    return res.status(200).json({ contatos: data.map(fromRow) })
  }

  // PUT — sincronização completa: upsert todos + remove excluídos
  if (req.method === 'PUT') {
    const { contatos } = req.body
    if (!Array.isArray(contatos)) return res.status(400).json({ error: 'contatos deve ser array' })

    const rows = contatos.map(toRow)
    const ids  = contatos.map(c => c.id)

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('crm_contatos')
        .upsert(rows, { onConflict: 'id' })
      if (upsertErr) return res.status(500).json({ error: upsertErr.message })
    }

    // Remove linhas que não existem mais no estado (guarda: não deleta tudo se ids estiver vazio)
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('crm_contatos').delete().eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      if (delErr) return res.status(500).json({ error: delErr.message })
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
