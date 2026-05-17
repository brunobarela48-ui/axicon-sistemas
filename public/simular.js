/*
  Simuladores Áxicon — utilitários compartilhados.

  Cada página de simulador (home-equity, consorcio, diagnostico-pj) chama:
    - funções de cálculo financeiro (PRICE, SAC, taxa)
    - formatadores monetários
    - `submitLead({ tipo, inputs, outputs, lead })` que POSTa para
      /api/leads/simulador, salva no CRM, dispara email pro time e
      retorna { ok, leadId, waUrl } — a página redireciona pra waUrl.
*/
(function (global) {
  // ── formatadores ─────────────────────────────────────────────────────
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const BRLCompact = (v) => {
    if (!Number.isFinite(v)) return '—'
    if (v >= 1_000_000) return 'R$ ' + (v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace('.', ',') + ' mi'
    if (v >= 1_000)     return 'R$ ' + (v / 1_000).toFixed(0) + ' mil'
    return BRL.format(v)
  }
  const num = (s) => {
    if (typeof s === 'number') return s
    const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  // Máscara em tempo real para campos de moeda
  function maskBRL(el) {
    if (!el) return
    el.addEventListener('input', () => {
      let v = el.value.replace(/\D/g, '')
      if (!v) { el.value = ''; return }
      const n = parseInt(v, 10)
      el.value = BRL.format(n)
    })
  }

  // Máscara de telefone BR
  function maskPhone(el) {
    if (!el) return
    el.addEventListener('input', () => {
      let v = el.value.replace(/\D/g, '').slice(0, 11)
      if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
      else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
      el.value = v
    })
  }

  // ── matemática financeira ────────────────────────────────────────────
  // Taxa anual efetiva → mensal
  const taxaMes = (anual) => Math.pow(1 + anual, 1 / 12) - 1

  // Parcela PRICE (parcela constante)
  function parcelaPRICE(pv, taxaM, n) {
    if (taxaM === 0) return pv / n
    return pv * (taxaM * Math.pow(1 + taxaM, n)) / (Math.pow(1 + taxaM, n) - 1)
  }

  // ── HOME EQUITY ──────────────────────────────────────────────────────
  // LTV típico de mercado: 50% (conservador) a 60% (otimista)
  // Taxa de referência: 1.2% am ≈ 15.4% aa
  function calcHomeEquity({ valorImovel, dividas = 0, prazoMeses = 120 }) {
    const ltvBaixo = 0.50, ltvAlto = 0.60
    const liquidoBaixo = Math.max(0, valorImovel * ltvBaixo - dividas)
    const liquidoAlto  = Math.max(0, valorImovel * ltvAlto  - dividas)
    const taxa = taxaMes(0.155)  // ~1.2%am referência mercado
    const parcelaBaixa = parcelaPRICE(liquidoBaixo, taxa, prazoMeses)
    const parcelaAlta  = parcelaPRICE(liquidoAlto,  taxa, prazoMeses)
    return {
      faixaBaixa: liquidoBaixo,
      faixaAlta: liquidoAlto,
      parcelaBaixa,
      parcelaAlta,
      prazoMeses,
      taxaMensalRef: taxa,
    }
  }

  // ── CONSÓRCIO ────────────────────────────────────────────────────────
  // Taxa de administração ~0.18% am (varia 0.15-0.25 entre administradoras)
  // Fundo de reserva ~0.05% am
  // Parcela básica = carta/prazo + carta × (txAdm + fundoReserva)
  function calcConsorcio({ valorCarta, prazoMeses = 120, categoria = 'imovel' }) {
    const txAdm = 0.0018
    const fr = 0.0005
    const parcela = (valorCarta / prazoMeses) + valorCarta * (txAdm + fr)
    // CET aproximado = (txAdm + fr) × 12
    const cetAA = (txAdm + fr) * 12
    return {
      parcela,
      cetAnualRef: cetAA,
      tempoContemplacaoEstim: { min: 30, max: 60 },  // estimativa
      prazoMeses,
      categoria,
    }
  }

  // ── DIAGNÓSTICO PJ ───────────────────────────────────────────────────
  // Quiz lógico que mapeia respostas em recomendação de linha.
  function diagnosticoPJ(respostas) {
    const { faturamento, setor, necessidade, credito_ativo, patrimonio, ticket, prazo } = respostas

    const recs = []
    let principal = null

    // Lógicas simples e priorizadas
    if (necessidade === 'refinanciamento' && patrimonio === 'imovel_grande') {
      principal = { linha: 'Home Equity PJ (ConsorEquity)', motivo: 'Você tem patrimônio imobiliário relevante e quer trocar dívida cara por crédito com lastro real.' }
    } else if (necessidade === 'cross_border' || ticket === '50_plus') {
      principal = { linha: 'Operação Cross-Border', motivo: 'Ticket elevado ou demanda em moeda forte — estruturação internacional via parceiros Áxicon.' }
    } else if (necessidade === 'ma') {
      principal = { linha: 'M&A / Project Finance', motivo: 'Operação patrimonial complexa — mesa especializada com governança pós-deal.' }
    } else if (setor === 'agro' && (necessidade === 'capital_giro' || necessidade === 'investimento')) {
      principal = { linha: 'CRA / Fiagro / CPR-F', motivo: 'Agronegócio com lastro real (safra, recebíveis). Securitização via parceiros Ecoagro, Multiplike.' }
    } else if (necessidade === 'capital_giro' && credito_ativo === 'bancos') {
      principal = { linha: 'FIDC / Antecipação Estruturada', motivo: 'Saída do crédito bancário caro com fundo estruturado lastreado em recebíveis.' }
    } else if (necessidade === 'investimento' && setor === 'construcao') {
      principal = { linha: 'Project Finance / Construção', motivo: 'Construção e incorporação com lastro no empreendimento. Linhas específicas via Hub-C, parceiros.' }
    } else {
      principal = { linha: 'Diagnóstico Estruturado', motivo: 'Combinação que pede análise consultiva. Nosso time desenha a estrutura sob medida.' }
    }

    recs.push(principal)

    // Recomendações secundárias contextuais
    if (necessidade !== 'cross_border' && setor !== 'agro' && patrimonio !== 'nao') {
      recs.push({ linha: 'Consórcio Estratégico PJ', motivo: 'Planejamento patrimonial de longo prazo sem juros, complementa a operação principal.' })
    }
    if (prazo === 'urgente') {
      recs.push({ linha: 'Operação Express (até 30 dias)', motivo: 'Trilha acelerada para urgência — Áxicon estrutura até CRI ou CCB em janela curta.' })
    }

    return { principal, secundarias: recs.slice(1), respostas }
  }

  // ── envio do lead ────────────────────────────────────────────────────
  async function submitLead({ tipo, inputs, outputs, lead }) {
    const payload = { tipo, inputs, outputs, lead }
    const r = await fetch('/api/leads/simulador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j?.error || 'Falha ao enviar')
    return j
  }

  // Gera URL pra wa.me com mensagem pré-preenchida baseada no lead
  function makeWhatsAppUrl({ tipo, nome, inputs, outputs }) {
    const phone = '5544991147236'
    let msg = `Olá! Acabei de fazer uma simulação no site da Áxicon.\n\n`
    msg += `Nome: ${nome}\n`
    if (tipo === 'home-equity') {
      msg += `Tipo: Home Equity\n`
      msg += `Imóvel: ${BRLCompact(inputs.valorImovel)}\n`
      if (inputs.dividas) msg += `Dívidas: ${BRLCompact(inputs.dividas)}\n`
      msg += `Faixa estimada: ${BRLCompact(outputs.faixaBaixa)} – ${BRLCompact(outputs.faixaAlta)}\n`
      msg += `Prazo desejado: ${inputs.prazoMeses} meses\n`
    } else if (tipo === 'consorcio') {
      msg += `Tipo: Consórcio\n`
      msg += `Carta: ${BRLCompact(inputs.valorCarta)} · ${inputs.categoria}\n`
      msg += `Parcela estimada: ${BRLCompact(outputs.parcela)}\n`
      msg += `Prazo: ${inputs.prazoMeses} meses\n`
    } else if (tipo === 'diagnostico-pj') {
      msg += `Tipo: Diagnóstico PJ\n`
      msg += `Linha recomendada: ${outputs.principal.linha}\n`
      msg += `Faturamento: ${inputs.faturamento || '—'} · Setor: ${inputs.setor || '—'}\n`
      msg += `Ticket aproximado: ${inputs.ticket || '—'}\n`
    }
    msg += `\nGostaria de conversar com um consultor.`
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  }

  // ── exporta para escopo global ───────────────────────────────────────
  global.AxiconSim = {
    BRL, BRLCompact, num, maskBRL, maskPhone,
    taxaMes, parcelaPRICE,
    calcHomeEquity, calcConsorcio, diagnosticoPJ,
    submitLead, makeWhatsAppUrl,
  }
})(window);
