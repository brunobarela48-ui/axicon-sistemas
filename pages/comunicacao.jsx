import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LOGO_FULL = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png'

// ── DADOS ─────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o assistente de comunicação comercial da Áxicon, uma consultoria de estratégia financeira premium.

TOM DE VOZ: "Sofisticação Acessível e Autoridade Técnica"
- Autoridade sem arrogância: fale com propriedade sobre dinheiro, investimentos e alavancagem
- Sofisticação acessível: premium mas não elitista
- Foco em solução, nunca em produto
- Firmeza e segurança: transmita estabilidade e previsibilidade

VOCABULÁRIO PROIBIDO: "barato","precinho","sorteio","tentar a sorte","vendedor","comprar","pegar","consórcio" (para descrever o serviço),"esquema"
VOCABULÁRIO CORRETO: "custo de capital eficiente","estratégia de contemplação","consultor de estratégia","adquirir","alavancar","solução de crédito","ferramenta de alavancagem","engenharia financeira","otimizar fluxo de caixa","eficiência fiscal"

REGRA CRÍTICA: NUNCA use travessão (— ou -). Tom humanizado, natural.

PÚBLICOS:
1. VAREJO: pessoa física/pequeno empreendedor. Produto: solução de crédito sem juros compostos. Tom acolhedor, educativo.
2. ATACADO: empresa/empresário. Produto: alavancagem patrimonial, crédito de fundos internacionais, eficiência fiscal. Tom consultivo, estratégico.

METODOLOGIA: Quem pergunta, domina. Quem assume, perde. Qualifique antes de apresentar solução. Crie rapport antes de posicionar estratégia.

QUALIFICAÇÃO BANT: Necessidade, Prazo, Orçamento, Autoridade.

TEMPERATURAS:
FRIO: Gerar curiosidade. Não explicar produto. Menos de 3 linhas.
MORNO: Reduzir resistência. Mostrar que é só uma conversa. Passar segurança.
QUENTE: Abordagem direta e consultiva. Tom de par a par.

Gere APENAS a mensagem solicitada, sem explicações, sem introdução, sem aspas. Pareça escrita por um consultor humano sofisticado.`

const REGUAS = {
  varejo: [
    { dia:1,  canal:'WhatsApp',        titulo:'Primeiro Contato',              descricao:'Apresentação inicial leve. O objetivo é gerar curiosidade, não explicar o produto.', dica:'Menos de 3 linhas. Não explique nada ainda. Gere curiosidade. Use o nome do lead.', followup:'Trate como uma conversa, não como venda. O objetivo é abrir espaço para o lead falar.' },
    { dia:2,  canal:'Ligação',          titulo:'Qualificação',                  descricao:'Entender o momento de vida do lead: sonho, projeto, prazo. Escuta ativa.', dica:'Perguntas abertas: qual finalidade? Quando? Quanto consegue comprometer por mês? Decisão é sua ou envolve alguém?', followup:'Quem pergunta, domina. Quem assume, perde.' },
    { dia:4,  canal:'E-mail',           titulo:'Conteúdo de Valor',             descricao:'Enviar material educativo sobre formação de patrimônio sem juros compostos.', dica:'Não tente vender aqui. Eduque. Compare custo de capital no consórcio vs. juros compostos do financiamento.', followup:null },
    { dia:7,  canal:'WhatsApp',        titulo:'Follow-up',                     descricao:'Retomar o contato de forma leve. Relembrar a conversa anterior sem pressão.', dica:'Curto e direto. Referência ao que foi conversado. Mostre disponibilidade para enviar simulação sem compromisso.', followup:'80% das vendas acontecem no follow-up. Raramente o lead decide na 1ª abordagem.' },
    { dia:10, canal:'Ligação',          titulo:'Apresentação da Estratégia',    descricao:'Apresentar a solução de crédito como estratégia personalizada para o projeto do cliente.', dica:'Use o objetivo específico do lead. Mostre a simulação completa. Nunca deixe sem próximo passo.', followup:null },
    { dia:14, canal:'E-mail',           titulo:'Reengajamento',                 descricao:'Para quem não respondeu. Tom de parceria, não de cobrança.', dica:'Urgência sutil: condições do grupo podem mudar. Nunca soe desesperado. Reforce o valor, não o produto.', followup:'Se ainda fizer sentido para você, é só me dar um retorno que preparamos a simulação juntos.' },
    { dia:21, canal:'WhatsApp',        titulo:'Último Contato',                descricao:'Breakup message. Deixar a porta aberta com elegância.', dica:'Encerre com classe. Brevidade é sofisticação. O lead deve sentir que perdeu uma oportunidade.', followup:null },
  ],
  atacado: [
    { dia:1,  canal:'LinkedIn / E-mail', titulo:'Primeiro Contato',              descricao:'Abordagem direta e estratégica. Referência ao segmento ou empresa do prospect.', dica:'Demonstre que fez o dever de casa. Cite algo específico do negócio ou setor. Tom de par a par.', followup:null },
    { dia:2,  canal:'Ligação',           titulo:'Qualificação Estratégica',      descricao:'Entender o ciclo de caixa, projetos de expansão e estrutura atual de crédito.', dica:'Como estão estruturando capital para o próximo ciclo? Qual o custo de capital atual? Há projetos travados por liquidez?', followup:'Quem pergunta, domina.' },
    { dia:4,  canal:'E-mail',            titulo:'Estudo de Caso / Proposta Conceitual', descricao:'Case de alavancagem patrimonial com dados reais ou simulados. Eficiência fiscal e ROI.', dica:'Números e percentuais. Empresários Middle/Corporate pensam em ROI, custo de capital e eficiência fiscal.', followup:null },
    { dia:7,  canal:'WhatsApp',         titulo:'Follow-up Executivo',           descricao:'Mensagem curta e de alto nível. Checar se houve tempo para analisar o material.', dica:'Tom de par a par. Não é um consultor cobrando, é um estrategista verificando. Brevidade e objetividade.', followup:null },
    { dia:10, canal:'Ligação',           titulo:'Reunião de Estruturação',       descricao:'Propor reunião para apresentar a estrutura personalizada de alavancagem.', dica:'Propor datas específicas. Apresentar: crédito de fundos internacionais, eficiência fiscal, preservação de caixa.', followup:null },
    { dia:14, canal:'E-mail',            titulo:'Proposta Formal',               descricao:'Proposta estruturada com metodologia, benefícios fiscais e projeções.', dica:'Documento impecável. Mostre: custo de capital, impacto no fluxo de caixa, comparativo com crédito bancário.', followup:null },
    { dia:21, canal:'LinkedIn',          titulo:'Último Contato',                descricao:'Breakup executivo. Deixar espaço para retomada futura.', dica:'Brevidade é sofisticação. Três linhas no máximo. Uma janela estratégica se fechando, não cobrança.', followup:null },
  ],
}

const OBJECOES = [
  { obj:'Tá caro',                         resp:'Redirecionar para custo de oportunidade. Qual o preço que está pagando hoje por não ter iniciado?' },
  { obj:'Não tenho dinheiro',              resp:'Identificar: é o valor da parcela ou a condição de pagamento? Qualificar o real impedimento.' },
  { obj:'Vou pensar',                      resp:'Descobrir o que está impedindo a decisão agora. Dúvida sobre benefícios ou sobre o investimento?' },
  { obj:'Consórcio demora',                resp:'Educar sobre estratégia de contemplação vs. esperar sorteio. Com planejamento, o prazo é controlável.' },
  { obj:'Prefiro financiamento',           resp:'Comparar custo total. Quanto vale pagar a mais só para ter o bem alguns meses antes?' },
  { obj:'Não tenho lance',                 resp:'Mostrar alternativas: FGTS, 13º, venda de bem. Ou participar do sorteio mensal sem lance.' },
  { obj:'Não é o momento',                 resp:'Quanto antes começa, mais rápido contempla. Não começar hoje é adiar o resultado por exatamente esse tempo.' },
  { obj:'Quero tirar logo',                resp:'Com planejamento de lance, o prazo é encurtável. Sem planejamento, qualquer caminho demora.' },
  { obj:'Vou pesquisar em outros',         resp:'Oferecer simulação como base de comparação. Posicionar diferenciais: suporte, metodologia, solidez.' },
  { obj:'Preciso falar com cônjuge/sócio', resp:'Incluir o decisor. Oferecer call conjunta para apresentar a estratégia a todos os envolvidos.' },
]

const CANAL_EMOJI = { 'WhatsApp':'💬', 'Ligação':'📞', 'E-mail':'📧', 'LinkedIn / E-mail':'💼', 'LinkedIn':'💼' }
const TOM_PRESETS = [
  { val:'',                                                          label:'Padrão Áxicon' },
  { val:'jovem e descontraído, linguagem mais leve e próxima',       label:'🧢 Jovem' },
  { val:'sério e objetivo, sem rodeios',                             label:'🎯 Direto' },
  { val:'executivo formal, vocabulário corporativo elevado',         label:'🤝 Executivo' },
  { val:'técnico, aprecia dados e argumentos racionais',             label:'📊 Analítico' },
]

// ── PALETA (mesma do site) ────────────────────────────────────────────────────
const NAVY  = '#001489'
const NAVY2 = '#2B367B'
const GOLD  = '#CCA67F'
const BG    = '#EEF0F8'
const FT    = "'The Seasons','Georgia',serif"
const SN    = "'Montserrat','Helvetica Neue',sans-serif"

export default function Comunicacao() {
  const [session,    setSession]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('regua')
  const [pub,        setPub]        = useState('varejo')
  const [openStep,   setOpenStep]   = useState(null)
  const [openObj,    setOpenObj]    = useState(null)
  const [gPub,       setGPub]       = useState('varejo')
  const [gTemp,      setGTemp]      = useState('frio')
  const [gCanal,     setGCanal]     = useState('whatsapp')
  const [gTom,       setGTom]       = useState('')
  const [gContexto,  setGContexto]  = useState('')
  const [gEtapa,     setGEtapa]     = useState('')
  const [generating, setGenerating] = useState(false)
  const [result,     setResult]     = useState(null)
  const [copied,     setCopied]     = useState(false)
  const [erro,       setErro]       = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const goToGerador = (canal, etapa) => {
    const map = { 'WhatsApp':'whatsapp','E-mail':'email','Ligação':'ligacao','LinkedIn / E-mail':'linkedin','LinkedIn':'linkedin' }
    setGCanal(map[canal] || 'whatsapp')
    setGEtapa(etapa)
    setTab('gerador')
  }

  const gerarMensagem = async () => {
    setGenerating(true); setErro(''); setResult(null)
    const pubDesc = gPub === 'varejo'
      ? 'VAREJO: pessoa física ou pequeno empreendedor interessado em solução de crédito como ferramenta de formação de patrimônio sem juros compostos'
      : 'ATACADO (Middle/Corporate): empresário ou empresa interessada em alavancagem patrimonial com crédito de fundos internacionais, eficiência fiscal e gestão de caixa'
    const tempDesc = { frio:'FRIO: lead de tráfego pago. Gerar curiosidade. Não explicar produto. Menos de 3 linhas.', morno:'MORNO: lead inbound ou que esfriou. Reduzir resistência. Mostrar que é só uma conversa.', quente:'QUENTE: indicação ou interesse claro. Abordagem direta e consultiva. Tom de par a par.' }[gTemp]
    const canalDesc = { whatsapp:'WhatsApp (informal mas sofisticado, curto e direto)', email:'E-mail (elaborado, estruturado, com próximo passo claro)', ligacao:'Ligação telefônica (script com perguntas de qualificação BANT)', linkedin:'LinkedIn ou SMS (profissional e conciso)' }[gCanal]
    const prompt = `Gere uma mensagem comercial para a Áxicon:\nPÚBLICO: ${pubDesc}\nTEMPERATURA: ${tempDesc}\nCANAL: ${canalDesc}\n${gEtapa ? 'ETAPA: ' + gEtapa : ''}\nCONTEXTO: ${gContexto || 'Nenhum contexto adicional'}\n${gTom ? 'TOM PESSOAL: ' + gTom + '. Adapte sem abrir mão dos pilares Áxicon.' : ''}\nGere apenas a mensagem, pronta para uso.`
    try {
      const res = await fetch('/api/claude', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ system:SYSTEM_PROMPT, messages:[{role:'user',content:prompt}] }) })
      const data = await res.json()
      if (data.error) { setErro(data.error); setGenerating(false); return }
      setResult(data.text)
    } catch { setErro('Erro de conexão. Tente novamente.') }
    setGenerating(false)
  }

  const copiar = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:BG }}><div style={{ color:NAVY, fontSize:14, fontFamily:SN }}>Verificando acesso...</div></div>
  if (!session) { if (typeof window !== 'undefined') window.location.href = '/'; return null }

  // ── style helpers ──
  const chip = (active, color=NAVY) => ({
    padding:'7px 14px', borderRadius:8, cursor:'pointer', fontFamily:SN, fontSize:13, fontWeight:active?700:400, transition:'all .2s',
    border:`1.5px solid ${active?color:'#ddd'}`,
    background: active?color+'14':'white',
    color: active?color:'#888',
  })
  const chipSm = (active, color=NAVY) => ({ ...chip(active,color), padding:'6px 12px', fontSize:12 })
  const inp = { padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, outline:'none', fontFamily:SN, background:'#fafaf8', width:'100%', boxSizing:'border-box' }
  const card = (active) => ({ background:'white', borderRadius:14, marginBottom:10, boxShadow:'0 2px 12px rgba(0,0,0,.05)', overflow:'hidden', border:`1px solid ${active?NAVY+'50':'transparent'}`, transition:'border .2s' })
  const lbl = { fontSize:10, color:NAVY, letterSpacing:2, fontWeight:700, display:'block', marginBottom:6, fontFamily:SN }

  const TABS = [['regua','Régua de Comunicação'],['gerador','Gerador de Mensagens'],['objecoes','Objeções']]

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:SN }}>

      {/* HEADER */}
      <header style={{ background:NAVY, borderBottom:'1px solid rgba(255,255,255,0.1)', padding:'0 32px', height:72, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:18 }}>
          <img src={LOGO_FULL} alt="Áxicon" style={{ height:44, objectFit:'contain', filter:'brightness(0) saturate(100%) invert(1)' }}/>
          <div style={{ width:1, height:32, background:'rgba(255,255,255,0.2)' }}/>
          <div style={{ fontSize:11, color:GOLD, letterSpacing:3, textTransform:'uppercase', fontFamily:SN }}>Comunicação</div>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {TABS.map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background: tab===id ? 'rgba(255,255,255,0.15)' : 'transparent', border:`1px solid ${tab===id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`, borderRadius:20, padding:'7px 16px', color:'#fff', fontSize:12, letterSpacing:1, cursor:'pointer', fontFamily:SN, opacity: tab===id?1:0.6, transition:'all .2s' }}>
              {label}
            </button>
          ))}
        </div>
        <a href="/" style={{ fontSize:12, color:GOLD, textDecoration:'none', fontFamily:SN, border:'1px solid rgba(255,255,255,0.25)', padding:'6px 14px', borderRadius:20 }}>← Simulador</a>
      </header>

      {/* CONTENT */}
      <main style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px 60px' }}>

        {/* ─── RÉGUA ─────────────────────────────────────────── */}
        {tab === 'regua' && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:NAVY, letterSpacing:2, fontWeight:700, marginBottom:4 }}>SEQUÊNCIA DE CONTATO</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#1a1a1a', fontFamily:FT }}>Régua de Comunicação</div>
            </div>
            <div style={{ display:'flex', gap:10, marginBottom:24 }}>
              {[['varejo','🏠 Varejo','Solução de Crédito'],['atacado','🏢 Atacado','Alavancagem Patrimonial']].map(([id,title,sub]) => (
                <button key={id} onClick={() => { setPub(id); setOpenStep(null) }} style={{ flex:1, textAlign:'left', padding:'14px 18px', borderRadius:12, border:`1.5px solid ${pub===id?NAVY:'#ddd'}`, background: pub===id?NAVY+'0d':'white', cursor:'pointer', transition:'all .2s' }}>
                  <div style={{ fontSize:14, fontWeight:700, color: pub===id?NAVY:'#888', fontFamily:FT }}>{title}</div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:3 }}>{sub}</div>
                </button>
              ))}
            </div>
            {REGUAS[pub].map((s, i) => (
              <div key={i} style={card(openStep===i)} onClick={() => setOpenStep(openStep===i ? null : i)}>
                <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, background: openStep===i ? NAVY : NAVY+'14', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color: openStep===i?'white':NAVY, fontFamily:SN, transition:'all .2s' }}>
                    D{s.dia}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:'#1a1a1a', fontFamily:FT }}>{s.titulo}</span>
                      <span style={{ fontSize:11, background:NAVY+'0d', color:NAVY, padding:'2px 10px', borderRadius:10, fontFamily:SN, fontWeight:600 }}>
                        {CANAL_EMOJI[s.canal]||'📡'} {s.canal}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:'#888', marginTop:4 }}>{s.descricao}</div>
                  </div>
                  <div style={{ color:'#ccc', fontSize:12, flexShrink:0, transition:'transform .2s', transform: openStep===i?'rotate(180deg)':'none' }}>▼</div>
                </div>
                {openStep === i && (
                  <div style={{ padding:'0 18px 18px', borderTop:'1px solid #f0f0f0' }} onClick={e => e.stopPropagation()}>
                    <div style={{ background:NAVY+'08', borderRadius:10, padding:'14px 16px', border:`1px solid ${NAVY}20`, marginBottom:10, marginTop:14 }}>
                      <span style={lbl}>DICA DO CONSULTOR</span>
                      <p style={{ fontSize:13, color:'#444', lineHeight:1.7, fontFamily:SN, margin:0 }}>{s.dica}</p>
                    </div>
                    {s.followup && (
                      <div style={{ background:'rgba(100,130,200,0.06)', borderRadius:10, padding:'12px 16px', border:'1px solid rgba(100,130,200,0.2)', marginBottom:12 }}>
                        <span style={{ ...lbl, color:'#5070b0' }}>LEMBRE-SE</span>
                        <p style={{ fontSize:12, color:'#5070b0', fontStyle:'italic', fontFamily:SN, margin:0 }}>{s.followup}</p>
                      </div>
                    )}
                    <button onClick={() => goToGerador(s.canal, `Dia ${s.dia} — ${s.titulo}`)} style={{ padding:'9px 18px', borderRadius:9, border:`1.5px solid ${NAVY}40`, background:NAVY+'0d', color:NAVY, cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:SN }}>
                      ✨ Gerar mensagem para esta etapa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── GERADOR IA ────────────────────────────────────── */}
        {tab === 'gerador' && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:NAVY, letterSpacing:2, fontWeight:700, marginBottom:4 }}>INTELIGÊNCIA ARTIFICIAL</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#1a1a1a', fontFamily:FT }}>Gerador de Mensagens</div>
            </div>
            <div style={{ background:'white', borderRadius:16, padding:28, boxShadow:'0 2px 16px rgba(0,0,0,.06)' }}>
              {gEtapa && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, padding:'10px 16px', borderRadius:9, background:NAVY+'0d', border:`1px solid ${NAVY}25`, fontSize:13, color:NAVY, fontFamily:SN, fontWeight:600 }}>
                  <span>📌 {gEtapa}</span>
                  <button onClick={() => setGEtapa('')} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:16, lineHeight:1 }}>✕</button>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                <div>
                  <span style={lbl}>PÚBLICO</span>
                  <div style={{ display:'flex', gap:8 }}>
                    {[['varejo','🏠 Varejo'],['atacado','🏢 Atacado']].map(([v,l]) => (
                      <button key={v} onClick={() => setGPub(v)} style={chip(gPub===v)}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <span style={lbl}>TEMPERATURA</span>
                  <div style={{ display:'flex', gap:8 }}>
                    {[['frio','🧊 Frio'],['morno','🌡 Morno'],['quente','🔥 Quente']].map(([v,l]) => (
                      <button key={v} onClick={() => setGTemp(v)} style={chip(gTemp===v)}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <span style={lbl}>CANAL</span>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {[['whatsapp','💬 WhatsApp'],['email','📧 E-mail'],['ligacao','📞 Ligação'],['linkedin','💼 LinkedIn']].map(([v,l]) => (
                    <button key={v} onClick={() => setGCanal(v)} style={chip(gCanal===v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <span style={lbl}>TOM DO LEAD (opcional)</span>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                  {TOM_PRESETS.map(({ val, label }) => (
                    <button key={label} onClick={() => setGTom(val)} style={chipSm(gTom===val)}>{label}</button>
                  ))}
                </div>
                <input type="text" placeholder="Ou descreva livremente o perfil do lead..." value={gTom} onChange={e => setGTom(e.target.value)} style={inp}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <span style={lbl}>CONTEXTO DO LEAD (opcional)</span>
                <textarea placeholder="Ex: Lead veio por anúncio no Instagram, perguntou sobre imóvel de R$ 400 mil, tem FGTS disponível..." value={gContexto} onChange={e => setGContexto(e.target.value)} rows={4} style={{ ...inp, resize:'vertical', lineHeight:1.6 }}/>
              </div>
              {erro && <div style={{ padding:'10px 16px', borderRadius:9, background:'#fde8e8', border:'1px solid #f4433640', color:'#c62828', fontSize:13, marginBottom:16 }}>{erro}</div>}
              <button onClick={gerarMensagem} disabled={generating} style={{ width:'100%', padding:'13px 0', borderRadius:10, border:'none', background: generating ? '#ddd' : `linear-gradient(135deg,${NAVY},${NAVY2})`, color:'white', fontWeight:700, fontSize:15, cursor: generating?'not-allowed':'pointer', fontFamily:FT, letterSpacing:1, transition:'all .3s' }}>
                {generating ? 'Gerando mensagem...' : '✨ Gerar Mensagem'}
              </button>
              {result && (
                <div style={{ marginTop:20, background:BG, borderRadius:12, padding:'20px 22px', border:`1px solid ${NAVY}20` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <span style={lbl}>MENSAGEM GERADA</span>
                    <button onClick={copiar} style={{ padding:'6px 16px', borderRadius:8, border:`1.5px solid ${copied?NAVY:'#ddd'}`, background: copied?NAVY+'14':'white', color: copied?NAVY:'#888', cursor:'pointer', fontSize:12, fontFamily:SN, fontWeight:600 }}>
                      {copied ? '✓ Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <div style={{ fontSize:14, color:'#333', lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:SN }}>{result}</div>
                  <button onClick={gerarMensagem} disabled={generating} style={{ marginTop:14, padding:'8px 16px', borderRadius:8, border:'1.5px solid #ddd', background:'white', color:'#888', cursor:'pointer', fontSize:12, fontFamily:SN }}>
                    🔄 Gerar outra versão
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── OBJEÇÕES ──────────────────────────────────────── */}
        {tab === 'objecoes' && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:NAVY, letterSpacing:2, fontWeight:700, marginBottom:4 }}>ARSENAL COMERCIAL</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#1a1a1a', fontFamily:FT }}>Objeções & Respostas</div>
            </div>
            {OBJECOES.map((o, i) => (
              <div key={i} style={card(openObj===i)} onClick={() => setOpenObj(openObj===i ? null : i)}>
                <div style={{ padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:14, fontWeight:700, color: openObj===i?NAVY:'#1a1a1a', fontFamily:FT, transition:'color .2s' }}>"{o.obj}"</div>
                  <div style={{ color:'#ccc', fontSize:12, transition:'transform .2s', transform: openObj===i?'rotate(180deg)':'none' }}>▼</div>
                </div>
                {openObj === i && (
                  <div style={{ padding:'0 18px 18px', borderTop:'1px solid #f0f0f0' }} onClick={e => e.stopPropagation()}>
                    <div style={{ background:NAVY+'08', borderRadius:10, padding:'14px 16px', border:`1px solid ${NAVY}20`, marginBottom:12, marginTop:14 }}>
                      <span style={lbl}>ABORDAGEM RECOMENDADA</span>
                      <p style={{ fontSize:13, color:'#444', lineHeight:1.7, fontFamily:SN, margin:0 }}>{o.resp}</p>
                    </div>
                    <button onClick={() => { setGContexto(`O lead disse: "${o.obj}". Gere uma resposta que trate essa objeção dentro do contexto da Áxicon.`); setTab('gerador') }} style={{ padding:'9px 18px', borderRadius:9, border:`1.5px solid ${NAVY}40`, background:NAVY+'0d', color:NAVY, cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:SN }}>
                      ✨ Gerar resposta para esta objeção
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div style={{ marginTop:20, background:'white', borderRadius:14, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,.05)', borderLeft:`4px solid ${NAVY2}` }}>
              <div style={{ fontSize:10, color:NAVY2, letterSpacing:2, fontWeight:700, marginBottom:10, fontFamily:SN }}>REGRA DE OURO</div>
              <p style={{ fontSize:13, color:'#555', lineHeight:1.8, fontFamily:SN, margin:0 }}>
                Quem pergunta, domina. Quem assume, perde. Toda objeção é uma dúvida disfarçada ou um sinal de que o valor ainda não ficou claro. Antes de responder, identifique o que está por trás com uma pergunta.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop:'1px solid rgba(0,20,137,0.1)', padding:'16px 24px', textAlign:'center' }}>
        <span style={{ fontSize:11, color:'#bbb', fontFamily:SN, letterSpacing:1 }}>ÁXICON SOLUÇÕES FINANCEIRAS · USO INTERNO</span>
      </footer>
    </div>
  )
}
