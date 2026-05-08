import { supabaseAdmin } from '../../lib/supabase-admin'

const TABELAS = [
  'crm_data',
  'crm_contatos',
  'crm_negocios',
  'crm_negocios_varejo',
  'crm_negocios_atacado',
  'crm_atividades',
  'crm_funcionarios',
  'crm_tarefas',
  'fin_contas',
  'fin_extratos',
  'fin_fornecedores',
]

// Verifica quais colunas existem numa tabela tentando SELECT específico
async function checarColunas(tabela, colunas) {
  const resultado = {}
  for (const col of colunas) {
    const { error } = await supabaseAdmin.from(tabela).select(col).limit(0)
    resultado[col] = !error
  }
  return resultado
}

export default async function handler(req, res) {
  const resultado = {
    timestamp: new Date().toISOString(),
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NÃO CONFIGURADA',
    supabase_key_presente: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder'),
    service_key_presente: !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder'),
    tabelas: {},
    blob_crm_data: null,
    teste_escrita: null,
    teste_negocios_varejo: null,
    teste_negocios_atacado: null,
    schema_negocios: null,
    funcoes_rpc: null,
  }

  // 1. Verifica cada tabela com contagem exata de linhas
  for (const tabela of TABELAS) {
    try {
      const { count, error } = await supabaseAdmin
        .from(tabela)
        .select('*', { count: 'exact', head: true })

      if (error) {
        resultado.tabelas[tabela] = { existe: false, erro: error.message, code: error.code }
      } else {
        resultado.tabelas[tabela] = { existe: true, total_linhas: count ?? 0 }
      }
    } catch (e) {
      resultado.tabelas[tabela] = { existe: false, erro: e.message }
    }
  }

  // 2. Verifica o blob crm_data e conta entidades dentro dele
  try {
    const { data, error } = await supabaseAdmin
      .from('crm_data')
      .select('dados, atualizado_em')
      .eq('empresa_id', 'axicon')
      .single()

    if (error) {
      resultado.blob_crm_data = { erro: error.message }
    } else {
      const d = data?.dados || {}
      const blob_str = JSON.stringify(d)
      resultado.blob_crm_data = {
        atualizado_em: data?.atualizado_em,
        tamanho_kb: Math.round(blob_str.length / 1024),
        contatos:            Array.isArray(d.contatos)            ? d.contatos.length            : '❌ ausente',
        negocios:            Array.isArray(d.negocios)            ? d.negocios.length            : '❌ ausente',
        negocios_atacado:    Array.isArray(d.negocios)            ? d.negocios.filter(n => n.area === 'atacado').length : '—',
        negocios_varejo:     Array.isArray(d.negocios)            ? d.negocios.filter(n => (n.area || 'varejo') !== 'atacado').length : '—',
        funcionarios:        Array.isArray(d.funcionarios)        ? d.funcionarios.length        : '❌ ausente',
        atividades:          Array.isArray(d.atividades)          ? d.atividades.length          : '❌ ausente',
        tarefas:             Array.isArray(d.tarefas)             ? d.tarefas.length             : '❌ ausente',
        contas:              Array.isArray(d.contas)              ? d.contas.length              : '❌ ausente',
        extratos:            Array.isArray(d.extratos)            ? d.extratos.length            : '❌ ausente',
        fornecedores:        Array.isArray(d.fornecedores)        ? d.fornecedores.length        : '❌ ausente',
        campos_customizados: Array.isArray(d.campos_customizados) ? d.campos_customizados.map(c => ({ id: c.id, label: c.label })) : '❌ ausente',
        tem_config_visual: !!d.config_visual,
      }
    }
  } catch (e) {
    resultado.blob_crm_data = { erro: e.message }
  }

  // 3. Verifica schema das tabelas de negócios (colunas críticas)
  const tabelasNegociosExistem =
    resultado.tabelas['crm_negocios_varejo']?.existe &&
    resultado.tabelas['crm_negocios_atacado']?.existe

  if (tabelasNegociosExistem) {
    const colunasParaVerificar = ['id', 'empresa_id', 'campos_extras', 'campos_personalizados']
    const [colsVarejo, colsAtacado] = await Promise.all([
      checarColunas('crm_negocios_varejo',  colunasParaVerificar),
      checarColunas('crm_negocios_atacado', colunasParaVerificar),
    ])
    resultado.schema_negocios = {
      crm_negocios_varejo:  colsVarejo,
      crm_negocios_atacado: colsAtacado,
      aviso: (!colsVarejo.campos_personalizados || !colsAtacado.campos_personalizados)
        ? '⚠️ Coluna campos_personalizados ausente — execute sql/add-campos-personalizados.sql no Supabase'
        : null,
    }
  }

  // 4. Testa se a função crm_add_campo_column existe (com argumento inofensivo)
  {
    const { error } = await supabaseAdmin.rpc('crm_add_campo_column', { p_campo_id: 'campo_diagnostico_test' })
    resultado.funcoes_rpc = {
      crm_add_campo_column: error
        ? `❌ ${error.message}`
        : '✅ existe',
    }
  }

  // 5. Teste de escrita no crm_data (blob)
  try {
    const { error: writeErr } = await supabaseAdmin
      .from('crm_data')
      .upsert(
        { empresa_id: '__diagnostico_test__', dados: { ok: true, ts: Date.now() }, atualizado_em: new Date().toISOString() },
        { onConflict: 'empresa_id' }
      )

    if (writeErr) {
      resultado.teste_escrita = { sucesso: false, erro: writeErr.message }
    } else {
      await supabaseAdmin.from('crm_data').delete().eq('empresa_id', '__diagnostico_test__')
      resultado.teste_escrita = { sucesso: true }
    }
  } catch (e) {
    resultado.teste_escrita = { sucesso: false, erro: e.message }
  }

  // 6. Testa escrita em crm_negocios_varejo com campos_personalizados
  if (resultado.tabelas['crm_negocios_varejo']?.existe) {
    try {
      const row = {
        id: -999997,
        empresa_id: '__test__',
        titulo: 'TESTE_DIAGNOSTICO',
        valor: 0,
        etapa: 'lead_captado',
        probabilidade: 20,
        campos_extras: { area: 'varejo' },
        campos_personalizados: {},
        atualizado_em: new Date().toISOString(),
      }
      const { error: writeErr } = await supabaseAdmin
        .from('crm_negocios_varejo')
        .upsert(row, { onConflict: 'id' })
      if (writeErr) {
        resultado.teste_negocios_varejo = { sucesso: false, erro: writeErr.message }
      } else {
        await supabaseAdmin.from('crm_negocios_varejo').delete().eq('id', -999997)
        resultado.teste_negocios_varejo = { sucesso: true }
      }
    } catch (e) {
      resultado.teste_negocios_varejo = { sucesso: false, erro: e.message }
    }
  }

  // 7. Testa escrita em crm_negocios_atacado com campos_personalizados
  if (resultado.tabelas['crm_negocios_atacado']?.existe) {
    try {
      const row = {
        id: -999996,
        empresa_id: '__test__',
        titulo: 'TESTE_DIAGNOSTICO',
        valor: 0,
        etapa: 'lead_capitado',
        probabilidade: 20,
        campos_extras: { area: 'atacado' },
        campos_personalizados: {},
        atualizado_em: new Date().toISOString(),
      }
      const { error: writeErr } = await supabaseAdmin
        .from('crm_negocios_atacado')
        .upsert(row, { onConflict: 'id' })
      if (writeErr) {
        resultado.teste_negocios_atacado = { sucesso: false, erro: writeErr.message }
      } else {
        await supabaseAdmin.from('crm_negocios_atacado').delete().eq('id', -999996)
        resultado.teste_negocios_atacado = { sucesso: true }
      }
    } catch (e) {
      resultado.teste_negocios_atacado = { sucesso: false, erro: e.message }
    }
  }

  // 8. Testa escrita em crm_contatos
  if (resultado.tabelas['crm_contatos']?.existe) {
    try {
      const { error: writeErr } = await supabaseAdmin
        .from('crm_contatos')
        .upsert(
          { id: -999999, empresa_id: '__test__', nome: 'TESTE_DIAGNOSTICO', atualizado_em: new Date().toISOString() },
          { onConflict: 'id' }
        )
      if (writeErr) {
        resultado.tabelas['crm_contatos'].teste_escrita = { sucesso: false, erro: writeErr.message }
      } else {
        await supabaseAdmin.from('crm_contatos').delete().eq('id', -999999)
        resultado.tabelas['crm_contatos'].teste_escrita = { sucesso: true }
      }
    } catch (e) {
      resultado.tabelas['crm_contatos'].teste_escrita = { sucesso: false, erro: e.message }
    }
  }

  return res.status(200).json(resultado)
}
