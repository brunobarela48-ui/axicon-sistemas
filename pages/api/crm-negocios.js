import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

const TABELA_VAREJO  = 'crm_negocios_varejo'
const TABELA_ATACADO = 'crm_negocios_atacado'
const TABELA_LEGADA  = 'crm_negocios'

// Converte negócio do estado JS para linha do banco.
// Usa apenas colunas do schema base (separate-negocios-tables.sql).
// Campos personalizados vão em campos_extras como JSON — sem depender de RPCs ou ALTER TABLE.
function toRow(n) {
  const extras = typeof n.campos_extras === 'object' && n.campos_extras !== null
    ? n.campos_extras : {}
  const { area: _area, ...camposPersonalizados } = extras

  return {
    id:            n.id,
    empresa_id:    'axicon',
    titulo:        n.titulo        || null,
    valor:         n.valor         || 0,
    etapa:         n.etapa         || null,
    produto:       n.produto       || null,
    probabilidade: n.probabilidade || 20,
    descricao:     n.descricao     || null,
    contato_id:    n.contatoId     || null,
    consultor_id:  n.consultorId   || null,
    data_criacao:  n.dataCriacao   || null,
    campos_extras: JSON.stringify({ area: n.area || null, ...camposPersonalizados }),
    bitrix_id:     n.bitrixId      || null,
    importado_de:  n.importadoDe   || null,
    atualizado_em: new Date().toISOString(),
  }
}

function fromRow(r, defaultArea = 'varejo') {
  let extras = {}
  if (typeof r.campos_extras === 'object' && r.campos_extras !== null) {
    extras = r.campos_extras
  } else {
    try { extras = JSON.parse(r.campos_extras || '{}') } catch { extras = {} }
  }
  const { area, ...camposPersonalizados } = extras

  return {
    id:            r.id,
    titulo:        r.titulo,
    valor:         r.valor,
    etapa:         r.etapa,
    produto:       r.produto,
    probabilidade: r.probabilidade,
    descricao:     r.descricao,
    contatoId:     r.contato_id,
    consultorId:   r.consultor_id,
    dataCriacao:   r.data_criacao,
    campos_extras: camposPersonalizados,
    area:          area || defaultArea,
    bitrixId:      r.bitrix_id,
    importadoDe:   r.importado_de,
  }
}

export default async function handler(req, res) {
  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const [resV, resA] = await Promise.all([
      supabase.from(TABELA_VAREJO).select('*').eq('empresa_id', 'axicon').order('id'),
      supabase.from(TABELA_ATACADO).select('*').eq('empresa_id', 'axicon').order('id'),
    ])

    if (!resV.error && !resA.error) {
      const varejo  = (resV.data || []).map(r => fromRow(r, 'varejo'))
      const atacado = (resA.data || []).map(r => fromRow(r, 'atacado'))
      const negocios = [...varejo, ...atacado]

      // Migração automática única: se tabelas separadas estão vazias mas legada tem dados
      if (negocios.length === 0) {
        const { data: leg } = await supabase
          .from(TABELA_LEGADA).select('*').eq('empresa_id', 'axicon').order('id')
        if (Array.isArray(leg) && leg.length > 0) {
          const legRows  = leg.map(r => fromRow(r, r.area || 'varejo'))
          const legVar   = legRows.filter(n => n.area !== 'atacado').map(toRow)
          const legAtac  = legRows.filter(n => n.area === 'atacado').map(toRow)
          if (legVar.length  > 0) await supabase.from(TABELA_VAREJO).upsert(legVar,  { onConflict: 'id' })
          if (legAtac.length > 0) await supabase.from(TABELA_ATACADO).upsert(legAtac, { onConflict: 'id' })
          return res.status(200).json({ negocios: legRows })
        }
      }

      return res.status(200).json({ negocios })
    }

    // Fallback: tabelas separadas não existem, usa legada
    const { data, error } = await supabase
      .from(TABELA_LEGADA).select('*').eq('empresa_id', 'axicon').order('id')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ negocios: (data || []).map(r => fromRow(r, 'varejo')) })
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { negocios } = req.body
    if (!Array.isArray(negocios)) return res.status(400).json({ error: 'negocios deve ser array' })

    const varejo  = negocios.filter(n => (n.area || 'varejo') !== 'atacado')
    const atacado = negocios.filter(n => n.area === 'atacado')

    // Verifica se tabelas separadas existem
    const { error: probeErr } = await supabase.from(TABELA_VAREJO).select('id').limit(0)
    const usarSeparadas = !probeErr

    if (usarSeparadas) {
      if (varejo.length > 0) {
        const { error } = await supabase
          .from(TABELA_VAREJO).upsert(varejo.map(toRow), { onConflict: 'id' })
        if (error) return res.status(500).json({ error: `varejo: ${error.message}` })
      }
      if (atacado.length > 0) {
        const { error } = await supabase
          .from(TABELA_ATACADO).upsert(atacado.map(toRow), { onConflict: 'id' })
        if (error) return res.status(500).json({ error: `atacado: ${error.message}` })
      }

      // Remove negócios deletados
      const varejoIds  = varejo.map(n => n.id)
      const atacadoIds = atacado.map(n => n.id)
      if (varejoIds.length > 0) {
        await supabase.from(TABELA_VAREJO).delete()
          .eq('empresa_id', 'axicon').not('id', 'in', `(${varejoIds.join(',')})`)
      } else {
        await supabase.from(TABELA_VAREJO).delete().eq('empresa_id', 'axicon')
      }
      if (atacadoIds.length > 0) {
        await supabase.from(TABELA_ATACADO).delete()
          .eq('empresa_id', 'axicon').not('id', 'in', `(${atacadoIds.join(',')})`)
      } else {
        await supabase.from(TABELA_ATACADO).delete().eq('empresa_id', 'axicon')
      }
    } else {
      // Fallback legado
      const rows = negocios.map(toRow)
      const ids  = negocios.map(n => n.id)
      if (rows.length > 0) {
        const { error } = await supabase.from(TABELA_LEGADA).upsert(rows, { onConflict: 'id' })
        if (error) return res.status(500).json({ error: error.message })
      }
      if (ids.length > 0) {
        await supabase.from(TABELA_LEGADA).delete()
          .eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      }
    }

    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
