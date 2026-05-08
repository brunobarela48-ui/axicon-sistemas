import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

const TABELA_VAREJO  = 'crm_negocios_varejo'
const TABELA_ATACADO = 'crm_negocios_atacado'
const TABELA_LEGADA  = 'crm_negocios'

// Cache por instância serverless para evitar ALTER TABLE repetido
const colunasGarantidas = new Set()
let esquemaBaseGarantido = false

async function garantirColuna(campoId) {
  if (colunasGarantidas.has(campoId)) return
  const { error } = await supabase.rpc('crm_add_campo_column', { p_campo_id: campoId })
  if (error) console.error('[crm-negocios] garantirColuna falhou:', campoId, error.message)
  colunasGarantidas.add(campoId)
}

// Garante que campos_personalizados existe em ambas as tabelas (precisa da função crm_ensure_base_columns no DB)
async function garantirEsquemaBase() {
  if (esquemaBaseGarantido) return
  const { error } = await supabase.rpc('crm_ensure_base_columns').catch(e => ({ error: e }))
  if (error) console.error('[crm-negocios] garantirEsquemaBase falhou (rode sql/ensure-base-columns.sql no Supabase):', error.message || error)
  esquemaBaseGarantido = true
}

function toRow(n) {
  const extras = typeof n.campos_extras === 'object' && n.campos_extras !== null
    ? n.campos_extras : {};

  const { area: _area, ...camposPersonalizados } = extras;

  // Cada campo personalizado vira uma coluna individual (campo_XXXXX: valor)
  const colunasIndividuais = {};
  for (const [key, val] of Object.entries(camposPersonalizados)) {
    colunasIndividuais[key] = val !== null && val !== undefined ? String(val) : null;
  }

  return {
    id:                    n.id,
    empresa_id:            'axicon',
    titulo:                n.titulo        || null,
    valor:                 n.valor         || 0,
    etapa:                 n.etapa         || null,
    produto:               n.produto       || null,
    probabilidade:         n.probabilidade || 20,
    descricao:             n.descricao     || null,
    contato_id:            n.contatoId     || null,
    consultor_id:          n.consultorId   || null,
    data_criacao:          n.dataCriacao   || null,
    campos_extras:         { area: n.area || null },
    campos_personalizados: camposPersonalizados,
    ...colunasIndividuais,
    bitrix_id:             n.bitrixId      || null,
    importado_de:          n.importadoDe   || null,
    atualizado_em:         new Date().toISOString(),
  }
}

function fromRow(r, defaultArea = 'varejo') {
  const extras = typeof r.campos_extras === 'object' && r.campos_extras !== null
    ? r.campos_extras
    : (() => { try { return JSON.parse(r.campos_extras || '{}') } catch { return {} } })();

  // Coleta colunas individuais campo_* diretamente do registro
  const camposDasColunas = {};
  for (const [key, val] of Object.entries(r)) {
    if (key.startsWith('campo_') && val !== null && val !== undefined) {
      camposDasColunas[key] = val;
    }
  }

  // Fallback para campos_personalizados JSONB ou campos_extras antigo
  const camposDoJsonb = (r.campos_personalizados && typeof r.campos_personalizados === 'object')
    ? r.campos_personalizados
    : (() => { const { area: _a, ...rest } = extras; return rest; })();

  // Colunas individuais têm prioridade (escrita mais recente)
  const camposPersonalizados = { ...camposDoJsonb, ...camposDasColunas };

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
    area:          extras.area || defaultArea,
    bitrixId:      r.bitrix_id,
    importadoDe:   r.importado_de,
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const [resV, resA] = await Promise.all([
      supabase.from(TABELA_VAREJO).select('*').eq('empresa_id', 'axicon').order('id'),
      supabase.from(TABELA_ATACADO).select('*').eq('empresa_id', 'axicon').order('id'),
    ])

    const tabelasExistem = !resV.error && !resA.error

    if (tabelasExistem) {
      const varejo  = (resV.data || []).map(r => fromRow(r, 'varejo'))
      const atacado = (resA.data || []).map(r => fromRow(r, 'atacado'))
      const negocios = [...varejo, ...atacado]

      if (negocios.length === 0) {
        const { data: leg } = await supabase
          .from(TABELA_LEGADA).select('*').eq('empresa_id', 'axicon').order('id')

        if (Array.isArray(leg) && leg.length > 0) {
          const legRows = leg.map(r => fromRow(r, r.area || 'varejo'))
          const legVarejo  = legRows.filter(n => n.area !== 'atacado').map(toRow)
          const legAtacado = legRows.filter(n => n.area === 'atacado').map(toRow)
          if (legVarejo.length  > 0) await supabase.from(TABELA_VAREJO).upsert(legVarejo,  { onConflict: 'id' })
          if (legAtacado.length > 0) await supabase.from(TABELA_ATACADO).upsert(legAtacado, { onConflict: 'id' })
          return res.status(200).json({ negocios: legRows })
        }
      }

      return res.status(200).json({ negocios })
    }

    const { data, error } = await supabase
      .from(TABELA_LEGADA).select('*').eq('empresa_id', 'axicon').order('id')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ negocios: (data || []).map(r => fromRow(r, r.area || 'varejo')) })
  }

  if (req.method === 'PUT') {
    const { negocios } = req.body
    if (!Array.isArray(negocios)) return res.status(400).json({ error: 'negocios deve ser array' })

    // Garante que campos_personalizados existe antes de qualquer upsert
    await garantirEsquemaBase()

    // Garante que cada campo personalizado tem uma coluna no banco antes de salvar
    const campoIds = new Set()
    negocios.forEach(n => {
      const extras = typeof n.campos_extras === 'object' && n.campos_extras ? n.campos_extras : {}
      const { area: _a, ...campos } = extras
      Object.keys(campos).forEach(k => campoIds.add(k))
    })
    await Promise.all([...campoIds].map(garantirColuna))

    const varejo  = negocios.filter(n => (n.area || 'varejo') !== 'atacado')
    const atacado = negocios.filter(n => n.area === 'atacado')
    const varejoIds  = varejo.map(n => n.id)
    const atacadoIds = atacado.map(n => n.id)
    const totalIds   = negocios.map(n => n.id)
    const safeToDelete = totalIds.length > 0

    const { error: probeErr } = await supabase.from(TABELA_VAREJO).select('id').limit(0)
    const usarSeparadas = !probeErr

    if (usarSeparadas) {
      if (varejo.length > 0) {
        const { error } = await supabase.from(TABELA_VAREJO).upsert(varejo.map(toRow), { onConflict: 'id' })
        if (error) return res.status(500).json({ error: `varejo upsert: ${error.message}` })
      }
      if (atacado.length > 0) {
        const { error } = await supabase.from(TABELA_ATACADO).upsert(atacado.map(toRow), { onConflict: 'id' })
        if (error) return res.status(500).json({ error: `atacado upsert: ${error.message}` })
      }

      if (safeToDelete) {
        if (varejoIds.length > 0) {
          await supabase.from(TABELA_VAREJO).delete().eq('empresa_id', 'axicon').not('id', 'in', `(${varejoIds.join(',')})`)
        } else {
          await supabase.from(TABELA_VAREJO).delete().eq('empresa_id', 'axicon')
        }
        if (atacadoIds.length > 0) {
          await supabase.from(TABELA_ATACADO).delete().eq('empresa_id', 'axicon').not('id', 'in', `(${atacadoIds.join(',')})`)
        } else {
          await supabase.from(TABELA_ATACADO).delete().eq('empresa_id', 'axicon')
        }
      }
    } else {
      const rows = negocios.map(toRow)
      const ids  = negocios.map(n => n.id)
      if (rows.length > 0) {
        const { error } = await supabase.from(TABELA_LEGADA).upsert(rows, { onConflict: 'id' })
        if (error) return res.status(500).json({ error: error.message })
      }
      if (ids.length > 0) {
        await supabase.from(TABELA_LEGADA).delete().eq('empresa_id', 'axicon').not('id', 'in', `(${ids.join(',')})`)
      }
    }

    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
