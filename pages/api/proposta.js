import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {

  // ── POST — salvar proposta + atualizar CRM ──────────────────────────────
  if (req.method === 'POST') {
    const { codigo, dados, crm } = req.body
    if (!codigo || !dados)
      return res.status(400).json({ error: 'codigo e dados são obrigatórios' })

    const { error: errProp } = await supabase
      .from('propostas')
      .upsert({ codigo, dados, criado_em: new Date().toISOString() })
    if (errProp) return res.status(500).json({ error: errProp.message })

    if (crm) {
      const { data: existingCrm } = await supabase
        .from('crm')
        .select('dados')
        .eq('nome_key', crm.nomeKey)
        .single()

      const existingProps = existingCrm?.dados?.propostas || []
      const newProp = { code: codigo, data: crm.dados.ultimaAtualizacao?.split('T')[0] || new Date().toISOString().split('T')[0], credito: crm.dados.credito || 0 }
      const mergedProps = existingProps.some(p => p.code === codigo)
        ? existingProps
        : [newProp, ...existingProps]

      const { error: errCrm } = await supabase
        .from('crm')
        .upsert(
          { nome_key: crm.nomeKey, nome: crm.nome, dados: { ...crm.dados, propostas: mergedProps }, atualizado_em: new Date().toISOString() },
          { onConflict: 'nome_key' }
        )
      if (errCrm) console.warn('CRM save error:', errCrm.message)
    }

    return res.status(200).json({ ok: true, url: `https://propostas.axiconsolucoes.com/proposta/${codigo}` })
  }

  // ── GET ─────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { codigo, crm, empresa } = req.query

    // Busca proposta por código
    if (codigo) {
      const { data, error } = await supabase
        .from('propostas')
        .select('dados')
        .eq('codigo', codigo)
        .single()
      if (error || !data) return res.status(404).json({ error: 'Proposta não encontrada' })
      return res.status(200).json({ dados: data.dados })
    }

    // Lista todas empresas do CRM
    if (crm === 'all') {
      const { data, error } = await supabase
        .from('crm')
        .select('*')
        .order('atualizado_em', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ empresas: data.map(e => e.dados) })
    }

    // Busca empresa específica com suas propostas
    if (empresa) {
      const { data: crmRow } = await supabase
        .from('crm')
        .select('dados')
        .eq('nome_key', empresa)
        .single()
      if (!crmRow) return res.status(404).json({ error: 'Empresa não encontrada' })

      const codigos = (crmRow.dados.propostas || []).map(p => p.code)
      const { data: props } = await supabase
        .from('propostas')
        .select('codigo, dados, criado_em')
        .in('codigo', codigos)
        .order('criado_em', { ascending: false })

      return res.status(200).json({ empresa: crmRow.dados, propostas: props || [] })
    }

    return res.status(400).json({ error: 'Parâmetro inválido' })
  }

  res.status(405).json({ error: 'Método não permitido' })
}