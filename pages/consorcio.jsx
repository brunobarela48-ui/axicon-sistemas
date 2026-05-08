import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ── CORES ──────────────────────────────────────────────────────────────────
const NAVY  = '#001489'
const NAVY2 = '#2B367B'
const GOLD  = '#CCA67F'
const BG    = '#EEF0F8'
const BG2   = '#FFFFFF'
const BG3   = '#F0F2FA'
const BDR   = 'rgba(0,20,137,0.1)'
const BDR2  = 'rgba(0,20,137,0.25)'
const WHITE = '#FFFFFF'
const DARK  = '#1a1a1a'
const GRAY  = '#888888'
const FT    = "'Georgia','Times New Roman',serif"
const SN    = "'Inter','Helvetica Neue',sans-serif"

const LOGO_FULL = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png'
const LOGO_ICON = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/3a4392f661ffa16b27a6daddec24ba38.png'

// ── DADOS ÁXICON ───────────────────────────────────────────────────────────
const AXICON_MISSAO = 'A Áxicon nasceu para redefinir a experiência de alavancagem patrimonial e expansão de negócios. Mais do que especialistas em soluções financeiras, atuamos na engenharia de operações robustas — conectando o seu projeto ao capital inteligente e ao planejamento de alta performance, rompendo as barreiras do eixo financeiro tradicional.'

const AXICON_VALORES = [
  { titulo: 'DNA ESTRATÉGICO',       desc: 'Nascemos da expertise em gestão de capital, aplicando a inteligência de mercado para maximização de eficiência e performance financeira.' },
  { titulo: 'SOLIDEZ E SEGURANÇA',   desc: 'Operamos com total transparência e rigor, garantindo que cada etapa do seu plano seja clara, segura e focada na realização do seu projeto.' },
  { titulo: 'ATENDIMENTO CONSULTIVO',desc: 'Vamos além da oferta de produtos: entregamos inteligência financeira. Estruturamos o crédito ideal para alavancar seu patrimônio com máxima eficiência.' },
  { titulo: 'FOCO EM PATRIMÔNIO',    desc: 'Nossa missão é transformar o crédito em uma ferramenta de alavancagem, ajudando você a construir e proteger seus bens de forma inteligente.' },
]

// ── ADMINISTRADORAS ────────────────────────────────────────────────────────
const ADMINS = {
  brconsorcio: {
    nome: 'BR Consórcios',
    taxaAdm: { imoveis: 0.19, veiculos: 0.18, pesados: 0.18, servicos: 0.22 },
    prazos:  { imoveis: [60,120,180,240], veiculos: [36,48,60,72,84], pesados: [36,48,60,72,84,96], servicos: [24,36,48,60] },
  },
  ademicon: {
    nome: 'Ademicon',
    taxaAdm: { imoveis: 0.18, veiculos: 0.17, pesados: 0.17, servicos: 0.21 },
    prazos:  { imoveis: [60,120,180,200], veiculos: [36,48,60,72], pesados: [36,48,60,72,84], servicos: [24,36,48] },
  },
  triangulo: {
    nome: 'Triângulo',
    taxaAdm: { imoveis: 0.175, veiculos: 0.165, pesados: 0.165, servicos: 0.20 },
    prazos:  { imoveis: [60,100,180,200], veiculos: [36,48,60,72], pesados: [36,48,60,72,84], servicos: [24,36,48] },
  },
}

const TIPOS_CARTA = [
  { id: 'imoveis',  label: 'Imóveis' },
  { id: 'veiculos', label: 'Veículos Leves' },
  { id: 'pesados',  label: 'Pesados / Agro' },
  { id: 'servicos', label: 'Serviços' },
]

// ── HELPERS ────────────────────────────────────────────────────────────────
const fmt  = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const gerarCodigo = () => 'VAR-' + Date.now().toString(36).toUpperCase()

// ── CÁLCULOS ───────────────────────────────────────────────────────────────
function calcConsorcio({ credito, prazo, taxaAdm, tipoLance, percLance, upgrade }) {
  const creditoFinal = Number(credito) + Number(upgrade || 0)
  const totalPagar   = creditoFinal * (1 + taxaAdm)
  const parcela      = totalPagar / prazo
  const lance        = Number(credito) * (percLance / 100)
  return { creditoFinal, totalPagar, parcela, lance }
}

function calcHE({ valor, taxaMensal, prazo }) {
  const tm = taxaMensal / 100
  const priceParcela  = tm === 0 ? valor / prazo : (valor * tm * Math.pow(1+tm, prazo)) / (Math.pow(1+tm, prazo) - 1)
  const priceTotalPago = priceParcela * prazo
  const amort         = valor / prazo
  const sacPrimeira   = amort + valor * tm
  const sacUltima     = amort + amort * tm
  const sacTotalPago  = ((sacPrimeira + sacUltima) / 2) * prazo
  return { priceParcela, priceTotalPago, sacPrimeira, sacUltima, sacTotalPago }
}

// ── COMPONENTES BASE ───────────────────────────────────────────────────────
function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 8, fontFamily: SN }}>{children}</div>
}

function Field({ label, value, onChange, type = 'text', placeholder = '', prefix, suffix, readOnly, rows }) {
  const base = {
    width: '100%', background: readOnly ? 'rgba(0,0,0,0.04)' : BG3,
    border: `1px solid ${BDR2}`, borderRadius: 8, padding: '10px 14px',
    color: DARK, fontSize: 14, fontFamily: SN, outline: 'none', boxSizing: 'border-box',
  }
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: GOLD, fontSize: 13, pointerEvents: 'none' }}>{prefix}</span>}
        {rows
          ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base, paddingLeft: prefix ? 32 : 14, resize: 'vertical' }} />
          : <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} style={{ ...base, paddingLeft: prefix ? 32 : 14, paddingRight: suffix ? 44 : 14 }} />
        }
        {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: GOLD, fontSize: 12, pointerEvents: 'none' }}>{suffix}</span>}
      </div>
    </div>
  )
}

function Sel({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <Label>{label}</Label>}
      <select value={value} onChange={onChange} style={{ width: '100%', background: BG3, border: `1px solid ${BDR2}`, borderRadius: 8, padding: '10px 14px', color: DARK, fontSize: 14, fontFamily: SN, outline: 'none', appearance: 'none' }}>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: BG2 }}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', full, small, disabled }) {
  const v = {
    primary: { background: `linear-gradient(135deg,${NAVY},${NAVY2})`, color: '#fff', border: 'none' },
    gold:    { background: `linear-gradient(135deg,#8B6340,${GOLD})`,  color: '#fff', border: 'none' },
    outline: { background: 'transparent', color: GOLD, border: `1px solid ${BDR2}` },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...v[variant], padding: small ? '7px 14px' : '11px 22px', borderRadius: 8, fontSize: small ? 12 : 14, fontFamily: SN, fontWeight: 500, letterSpacing: 1, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto', transition: 'all 0.2s' }}>
      {children}
    </button>
  )
}

function Card({ children, style = {} }) {
  return <div style={{ background: BG2, border: `1px solid ${BDR}`, borderRadius: 12, padding: 24, ...style }}>{children}</div>
}

function SecTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: FT, fontSize: 26, color: DARK, fontWeight: 300 }}>{children}</div>
      {sub && <div style={{ fontSize: 13, color: GRAY, marginTop: 6, fontFamily: SN }}>{sub}</div>}
      <div style={{ height: 1, background: `linear-gradient(90deg,${GOLD},transparent)`, marginTop: 14, opacity: 0.4 }} />
    </div>
  )
}

function KPI({ label, value, sub }) {
  return (
    <Card style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SN, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: FT, fontSize: 26, color: DARK, fontWeight: 300 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: GRAY, marginTop: 4, fontFamily: SN }}>{sub}</div>}
    </Card>
  )
}

// ── BRIEF ÁXICON ───────────────────────────────────────────────────────────
function AxiconBrief() {
  return (
    <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 32, marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
        <img src={LOGO_ICON} alt="AC" style={{ width: 52, height: 52, objectFit: 'contain' }} />
        <div>
          <div style={{ fontFamily: FT, fontSize: 20, color: DARK, fontWeight: 300 }}>Sobre a Áxicon</div>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SN, marginTop: 3 }}>Soluções Financeiras</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.8, fontFamily: SN, marginBottom: 20 }}>{AXICON_MISSAO}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {AXICON_VALORES.map(v => (
          <div key={v.titulo} style={{ background: BG3, border: `1px solid ${BDR}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SN, marginBottom: 6 }}>{v.titulo}</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, fontFamily: SN }}>{v.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 24, fontSize: 12, color: GRAY, fontFamily: SN }}>
        <span>📱 (44) 9.9114-72366</span>
        <span>🌐 www.axiconsolucoes.com</span>
        <span>📸 @axicon.solucoes</span>
      </div>
    </div>
  )
}

// ── GERADOR HTML PROPOSTA ──────────────────────────────────────────────────
function gerarHTML(dados, consultor) {
  const { cliente, cenarios, recomendacao, codigo } = dados
  const data = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })

  const cenariosHtml = cenarios.map(c => `
    <div style="background:#111;border:1px solid rgba(204,166,127,0.2);border-radius:12px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="font-family:Georgia,serif;font-size:18px;color:#fff;font-weight:300;">${c.titulo}</div>
        ${c.recomendado ? `<span style="background:linear-gradient(135deg,#001489,#2B367B);color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;letter-spacing:1px;font-family:Inter,sans-serif;">RECOMENDADO</span>` : ''}
      </div>
      <div style="font-size:13px;color:#777;margin-bottom:16px;font-family:Inter,sans-serif;line-height:1.6;">${c.descricao}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${c.kpis.map(k => `
          <div style="background:#1a1a1a;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:10px;color:#CCA67F;letter-spacing:2px;text-transform:uppercase;font-family:Inter,sans-serif;margin-bottom:5px;">${k.label}</div>
            <div style="font-family:Georgia,serif;font-size:17px;color:#fff;font-weight:300;">${k.value}</div>
            ${k.sub ? `<div style="font-size:11px;color:#555;margin-top:3px;font-family:Inter,sans-serif;">${k.sub}</div>` : ''}
          </div>`).join('')}
      </div>
      ${c.obs ? `<div style="margin-top:12px;font-size:12px;color:#555;font-style:italic;font-family:Inter,sans-serif;">* ${c.obs}</div>` : ''}
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proposta Áxicon — ${cliente.nome}</title>
<style>body{margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:Inter,Helvetica,sans-serif;}@media print{body{-webkit-print-color-adjust:exact;}}</style>
</head>
<body>
<div style="max-width:820px;margin:0 auto;padding:44px 28px;">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid rgba(204,166,127,0.2);">
    <img src="${LOGO_FULL}" alt="Áxicon" style="height:48px;object-fit:contain;" />
    <div style="text-align:right;font-size:12px;color:#888;font-family:Inter,sans-serif;line-height:1.9;">
      <div style="color:#CCA67F;font-weight:500;">${consultor?.nome || 'Consultor Áxicon'}</div>
      <div>${consultor?.email || ''}</div>
      <div>${consultor?.telefone || '(44) 9.9114-72366'}</div>
    </div>
  </div>

  <div style="margin-bottom:32px;">
    <div style="font-size:10px;color:#CCA67F;letter-spacing:3px;text-transform:uppercase;font-family:Inter,sans-serif;margin-bottom:10px;">PROPOSTA ESTRATÉGICA · VAREJO · ${codigo}</div>
    <div style="font-family:Georgia,serif;font-size:38px;color:#fff;font-weight:300;line-height:1.2;">${cliente.nome}</div>
    ${cliente.setor ? `<div style="font-size:14px;color:#777;margin-top:8px;font-family:Inter,sans-serif;">${cliente.setor}</div>` : ''}
    <div style="font-size:12px;color:#444;margin-top:14px;font-family:Inter,sans-serif;">${data}</div>
  </div>

  <div style="background:#111;border:1px solid rgba(204,166,127,0.12);border-radius:12px;padding:24px;margin-bottom:28px;">
    <div style="font-size:10px;color:#CCA67F;letter-spacing:2px;text-transform:uppercase;font-family:Inter,sans-serif;margin-bottom:14px;">Diagnóstico</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
      ${[
        ['Objetivo',     cliente.objetivo],
        ['Finalidade',   cliente.finalidade?.replace(/_/g,' ')],
        ['Urgência',     cliente.urgencia],
        ['Possui imóvel',cliente.temImovel],
        ['Renda Mensal', cliente.rendaMensal ? fmt(Number(cliente.rendaMensal)) : ''],
        ['Imóvel',       cliente.valorImovel ? fmt(Number(cliente.valorImovel)) : ''],
      ].filter(([,v]) => v).map(([l,v]) => `
        <div>
          <div style="font-size:10px;color:#555;font-family:Inter,sans-serif;margin-bottom:4px;">${l}</div>
          <div style="font-size:14px;color:#ccc;font-family:Inter,sans-serif;">${v}</div>
        </div>`).join('')}
    </div>
    ${cliente.observacoes ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);font-size:13px;color:#777;font-style:italic;font-family:Inter,sans-serif;">${cliente.observacoes}</div>` : ''}
  </div>

  ${recomendacao ? `
  <div style="background:linear-gradient(135deg,rgba(0,20,137,0.25),rgba(43,54,123,0.15));border:1px solid rgba(0,20,137,0.4);border-radius:12px;padding:24px;margin-bottom:28px;">
    <div style="font-size:10px;color:#CCA67F;letter-spacing:2px;text-transform:uppercase;font-family:Inter,sans-serif;margin-bottom:10px;">Recomendação Estratégica</div>
    <div style="font-size:14px;color:#ddd;line-height:1.8;font-family:Inter,sans-serif;">${recomendacao}</div>
  </div>` : ''}

  <div style="font-size:10px;color:#CCA67F;letter-spacing:2px;text-transform:uppercase;font-family:Inter,sans-serif;margin-bottom:18px;">Cenários Apresentados</div>
  ${cenariosHtml}

  <div style="border-top:1px solid rgba(204,166,127,0.12);padding-top:32px;margin-top:40px;">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;">
      <img src="${LOGO_ICON}" alt="AC" style="width:52px;height:52px;object-fit:contain;" />
      <div>
        <div style="font-family:Georgia,serif;font-size:20px;color:#fff;font-weight:300;">Sobre a Áxicon</div>
        <div style="font-size:10px;color:#CCA67F;letter-spacing:2px;text-transform:uppercase;font-family:Inter,sans-serif;margin-top:4px;">Soluções Financeiras</div>
      </div>
    </div>
    <p style="font-size:13px;color:#999;line-height:1.8;font-family:Inter,sans-serif;margin-bottom:20px;">${AXICON_MISSAO}</p>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:24px;">
      ${AXICON_VALORES.map(v => `
        <div style="background:#111;border:1px solid rgba(204,166,127,0.1);border-radius:8px;padding:14px;">
          <div style="font-size:10px;color:#CCA67F;letter-spacing:2px;text-transform:uppercase;font-family:Inter,sans-serif;margin-bottom:6px;">${v.titulo}</div>
          <div style="font-size:12px;color:#777;line-height:1.5;font-family:Inter,sans-serif;">${v.desc}</div>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:24px;font-size:12px;color:#555;font-family:Inter,sans-serif;">
      <span>📱 (44) 9.9114-72366</span>
      <span>🌐 www.axiconsolucoes.com</span>
      <span>📸 @axicon.solucoes</span>
    </div>
  </div>

  <div style="margin-top:44px;text-align:center;font-size:10px;color:#2a2a2a;font-family:Inter,sans-serif;letter-spacing:3px;text-transform:uppercase;padding-bottom:40px;">
    ÁXICON SOLUÇÕES FINANCEIRAS · GUIADOS PELA EFICIÊNCIA DE GERAR RESULTADOS E REALIZAR SONHOS
  </div>

</div>
</body>
</html>`
}

// ── TELA CRM ───────────────────────────────────────────────────────────────
function CRM({ onNova, onAbrir }) {
  const [lista, setLista]   = useState([])
  const [busca, setBusca]   = useState('')
  const [load, setLoad]     = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoad(true)
    const { data } = await supabase
      .from('propostas')
      .select('*')
      .eq('segmento', 'varejo')
      .order('created_at', { ascending: false })
    if (data) setLista(data)
    setLoad(false)
  }

  const filtrados = lista.filter(p =>
    p.dados?.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.dados?.cliente?.setor?.toLowerCase().includes(busca.toLowerCase())
  )

  const totalClientes = new Set(lista.map(p => p.dados?.cliente?.nome)).size

  return (
    <div>
      <SecTitle sub="Gestão de clientes e propostas do segmento varejo">CRM — Varejo</SecTitle>

      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        <KPI label="Clientes"   value={totalClientes} />
        <KPI label="Propostas"  value={lista.length} />
        <KPI label="Última"     value={lista[0] ? new Date(lista[0].created_at).toLocaleDateString('pt-BR') : '—'} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente ou setor..."
          style={{ flex: 1, background: BG3, border: `1px solid ${BDR2}`, borderRadius: 8, padding: '10px 14px', color: DARK, fontSize: 14, fontFamily: SN, outline: 'none' }} />
        <Btn variant="gold" onClick={() => onNova(null)}>+ Nova Simulação</Btn>
      </div>

      {load ? (
        <div style={{ textAlign: 'center', padding: 48, color: GRAY, fontFamily: SN }}>Carregando...</div>
      ) : filtrados.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 52 }}>
          <div style={{ fontFamily: FT, fontSize: 20, color: GRAY, marginBottom: 10 }}>Nenhuma proposta encontrada</div>
          <div style={{ fontSize: 13, color: GRAY, fontFamily: SN, marginBottom: 20 }}>Inicie uma simulação para apresentar cenários estratégicos ao cliente</div>
          <Btn variant="gold" onClick={() => onNova(null)}>Iniciar Simulação</Btn>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtrados.map(p => (
            <Card key={p.codigo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: FT, fontSize: 16, color: DARK, marginBottom: 4 }}>{p.dados?.cliente?.nome || '—'}</div>
                <div style={{ fontSize: 12, color: GRAY, fontFamily: SN }}>
                  {p.dados?.cliente?.objetivo || p.dados?.cliente?.setor || '—'} · {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div style={{ fontSize: 11, color: GOLD, fontFamily: SN, marginTop: 4, letterSpacing: 1 }}>{p.codigo}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn small variant="outline" onClick={() => onNova(p.dados?.cliente)}>Nova Simulação</Btn>
                <Btn small variant="primary" onClick={() => onAbrir(p)}>Ver Proposta</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TELA DIAGNÓSTICO ───────────────────────────────────────────────────────
function Diagnostico({ inicial, onProximo }) {
  const [d, setD] = useState({
    nome: '', setor: '', objetivo: '', finalidade: '',
    rendaMensal: '', valorImovel: '', dividas: '',
    temImovel: 'sim', restricoes: 'nao', urgencia: 'normal',
    prazoDesejado: '', observacoes: '',
    ...inicial,
  })
  const set = (k, v) => setD(p => ({ ...p, [k]: v }))

  return (
    <div>
      <SecTitle sub="Colete as informações do cliente para estruturar os melhores cenários">Diagnóstico do Cliente</SecTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <Card>
          <div style={{ fontFamily: FT, fontSize: 16, color: GOLD, marginBottom: 18 }}>Identificação</div>
          <Field label="Nome do cliente"      value={d.nome}       onChange={e => set('nome', e.target.value)}       placeholder="Nome completo" />
          <Field label="Profissão / Setor"    value={d.setor}      onChange={e => set('setor', e.target.value)}      placeholder="Ex: Médico, Empresário, Agricultor..." />
          <Field label="Objetivo principal"   value={d.objetivo}   onChange={e => set('objetivo', e.target.value)}   placeholder="O que o cliente quer conquistar?" />
          <Sel   label="Finalidade do crédito" value={d.finalidade} onChange={e => set('finalidade', e.target.value)}
            options={[
              { value: '', label: 'Selecione...' },
              { value: 'aquisicao_imovel',   label: 'Aquisição de Imóvel' },
              { value: 'construcao_reforma', label: 'Construção / Reforma' },
              { value: 'aquisicao_veiculo',  label: 'Aquisição de Veículo' },
              { value: 'capital_giro',       label: 'Capital de Giro' },
              { value: 'investimento',       label: 'Investimento / Aplicação' },
              { value: 'quitar_dividas',     label: 'Quitar Dívidas' },
              { value: 'outro',              label: 'Outro' },
            ]} />
        </Card>

        <Card>
          <div style={{ fontFamily: FT, fontSize: 16, color: GOLD, marginBottom: 18 }}>Situação Financeira</div>
          <Field label="Renda mensal"        value={d.rendaMensal}  onChange={e => set('rendaMensal', e.target.value)}  type="number" prefix="R$" placeholder="0" />
          <Field label="Valor do imóvel"     value={d.valorImovel}  onChange={e => set('valorImovel', e.target.value)}  type="number" prefix="R$" placeholder="0 (se possuir)" />
          <Field label="Dívidas atuais"      value={d.dividas}      onChange={e => set('dividas', e.target.value)}      type="number" prefix="R$" placeholder="0" />
          <Sel   label="Possui imóvel?" value={d.temImovel} onChange={e => set('temImovel', e.target.value)}
            options={[
              { value: 'sim',        label: 'Sim, quitado' },
              { value: 'financiado', label: 'Sim, ainda financiado' },
              { value: 'nao',        label: 'Não possui' },
            ]} />
        </Card>

        <Card>
          <div style={{ fontFamily: FT, fontSize: 16, color: GOLD, marginBottom: 18 }}>Perfil e Urgência</div>
          <Sel label="Urgência" value={d.urgencia} onChange={e => set('urgencia', e.target.value)}
            options={[
              { value: 'imediata',    label: 'Imediata (precisa agora)' },
              { value: 'curto',       label: 'Curto prazo (até 3 meses)' },
              { value: 'normal',      label: 'Normal (3–12 meses)' },
              { value: 'planejamento',label: 'Planejamento (1–3 anos)' },
            ]} />
          <Sel label="Restrições no CPF?" value={d.restricoes} onChange={e => set('restricoes', e.target.value)}
            options={[
              { value: 'nao',     label: 'Não' },
              { value: 'sim',     label: 'Sim' },
              { value: 'incerto', label: 'Não sabe' },
            ]} />
          <Field label="Prazo desejado" value={d.prazoDesejado} onChange={e => set('prazoDesejado', e.target.value)} type="number" suffix="meses" placeholder="Ex: 120" />
        </Card>

        <Card>
          <div style={{ fontFamily: FT, fontSize: 16, color: GOLD, marginBottom: 18 }}>Observações / Pitch</div>
          <Field
            label="Contexto adicional"
            value={d.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            placeholder="Contexto específico, objeções do cliente, oportunidade identificada, situação familiar..."
            rows={8}
          />
        </Card>
      </div>

      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Btn variant="gold" onClick={() => onProximo(d)} disabled={!d.nome || !d.finalidade}>
          Estruturar Cenários Estratégicos →
        </Btn>
      </div>
      {(!d.nome || !d.finalidade) && (
        <div style={{ textAlign: 'right', marginTop: 8, fontSize: 12, color: GRAY, fontFamily: SN }}>Preencha nome e finalidade para continuar</div>
      )}
    </div>
  )
}

// ── TELA CENÁRIOS ──────────────────────────────────────────────────────────
function Cenarios({ diag, onGerar }) {
  const [cons, setCons] = useState({
    tipo: 'imoveis', credito: '', prazo: 120,
    admin: 'brconsorcio', tipoLance: 'none', percLance: 0, upgrade: 0,
  })
  const [he, setHe] = useState({
    valorImovel: diag.valorImovel || '', percentual: 60,
    taxaMensal: 1.2, prazo: 120, carencia: 0, finalidade: '',
  })
  const [rec, setRec]               = useState('')
  const [ativos, setAtivos]         = useState(['consorcio', 'he'])

  const sc = (k, v) => setCons(p => ({ ...p, [k]: v }))
  const sh = (k, v) => setHe(p => ({ ...p, [k]: v }))

  const adm        = ADMINS[cons.admin]
  const taxaAdm    = adm?.taxaAdm[cons.tipo] || 0.18
  const prazos     = adm?.prazos[cons.tipo]  || [60, 120, 180]
  const creditoN   = Number(cons.credito) || 0

  const resCons = creditoN > 0 ? calcConsorcio({
    credito: creditoN, prazo: Number(cons.prazo), taxaAdm,
    tipoLance: cons.tipoLance, percLance: Number(cons.percLance), upgrade: Number(cons.upgrade),
  }) : null

  const valorHE = Number(he.valorImovel) * (Number(he.percentual) / 100)
  const resHE   = valorHE > 0 ? calcHE({ valor: valorHE, taxaMensal: Number(he.taxaMensal), prazo: Number(he.prazo) }) : null

  function toggle(id) {
    setAtivos(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  function buildCenarios() {
    const out = []

    if (ativos.includes('consorcio') && resCons) {
      const tipo = TIPOS_CARTA.find(t => t.id === cons.tipo)
      out.push({
        titulo: `Consórcio de ${tipo?.label}`,
        descricao: `Aquisição planejada sem juros via ${adm?.nome}. Taxa de administração de ${(taxaAdm * 100).toFixed(1)}% total — sem IOF, sem juros compostos, com flexibilidade de uso após contemplação.`,
        recomendado: diag.urgencia === 'normal' || diag.urgencia === 'planejamento',
        kpis: [
          { label: 'Crédito Total',   value: fmt(resCons.creditoFinal) },
          { label: 'Parcela Mensal',  value: fmt(resCons.parcela),    sub: `${cons.prazo} meses` },
          { label: 'Total a Pagar',   value: fmt(resCons.totalPagar), sub: 'sem juros compostos' },
          { label: 'Taxa Adm',        value: `${(taxaAdm*100).toFixed(1)}%`, sub: 'total no prazo' },
          { label: 'Administradora',  value: adm?.nome },
          cons.tipoLance !== 'none'
            ? { label: 'Lance',       value: fmt(resCons.lance),      sub: cons.tipoLance }
            : { label: 'Lance',       value: 'Sem lance' },
        ],
        obs: 'Contemplação por sorteio ou lance. A Áxicon assessora na estratégia de lance para antecipar a contemplação.',
      })
    }

    if (ativos.includes('he') && resHE) {
      out.push({
        titulo: 'Home Equity — ConsorEquity',
        descricao: `Transforme o patrimônio imobiliário em liquidez imediata. LTV de ${he.percentual}% sobre o valor do imóvel. Crédito estruturado com o bem como garantia — taxas reduzidas e prazos alongados.`,
        recomendado: diag.urgencia === 'imediata' || diag.urgencia === 'curto',
        kpis: [
          { label: 'Crédito Disponível', value: fmt(valorHE) },
          { label: 'LTV',                value: `${he.percentual}%`,         sub: 'do valor do imóvel' },
          { label: 'Parcela Price',       value: fmt(resHE.priceParcela),    sub: `${he.prazo}m · ${he.taxaMensal}% a.m.` },
          { label: 'Total Price',         value: fmt(resHE.priceTotalPago) },
          { label: 'Parcela SAC (1ª)',    value: fmt(resHE.sacPrimeira),     sub: 'decresce mensalmente' },
          { label: 'Total SAC',           value: fmt(resHE.sacTotalPago) },
        ],
        obs: he.carencia > 0 ? `Carência de ${he.carencia} meses — pagamento de juros apenas no período inicial.` : null,
      })
    }

    return out
  }

  return (
    <div>
      <SecTitle sub={`Estruture os melhores cenários para ${diag.nome}`}>Cenários Estratégicos</SecTitle>

      {/* Resumo diagnóstico */}
      <Card style={{ marginBottom: 22, background: 'linear-gradient(135deg,rgba(0,20,137,0.12),rgba(43,54,123,0.08))', borderColor: 'rgba(0,20,137,0.3)' }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[
            ['Cliente',    diag.nome],
            ['Perfil',     diag.setor],
            ['Finalidade', diag.finalidade?.replace(/_/g,' ')],
            ['Urgência',   diag.urgencia],
            ['Imóvel',     diag.valorImovel ? fmt(Number(diag.valorImovel)) : ''],
            ['Renda',      diag.rendaMensal ? fmt(Number(diag.rendaMensal)) : ''],
          ].filter(([,v]) => v).map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', fontFamily: SN }}>{l}</div>
              <div style={{ fontSize: 14, color: DARK, fontFamily: SN, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
        {diag.observacoes && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BDR}`, fontSize: 13, color: GRAY, fontStyle: 'italic', fontFamily: SN }}>{diag.observacoes}</div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>

        {/* CONSÓRCIO */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: FT, fontSize: 17, color: DARK }}>🏠 Consórcio</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: GRAY, fontFamily: SN }}>
              <input type="checkbox" checked={ativos.includes('consorcio')} onChange={() => toggle('consorcio')} />
              Incluir na proposta
            </label>
          </div>
          <Card>
            <Sel label="Tipo de carta"    value={cons.tipo}  onChange={e => sc('tipo', e.target.value)}  options={TIPOS_CARTA.map(t => ({ value: t.id, label: t.label }))} />
            <Sel label="Administradora"   value={cons.admin} onChange={e => sc('admin', e.target.value)} options={Object.entries(ADMINS).map(([k,v]) => ({ value: k, label: v.nome }))} />
            <Field label="Crédito (R$)"   value={cons.credito}   onChange={e => sc('credito', e.target.value)}   type="number" prefix="R$" placeholder="0" />
            <Sel   label="Prazo"          value={cons.prazo}     onChange={e => sc('prazo', Number(e.target.value))}
              options={prazos.map(p => ({ value: p, label: `${p} meses (${(p/12).toFixed(0)} anos)` }))} />
            <Sel   label="Lance"          value={cons.tipoLance} onChange={e => sc('tipoLance', e.target.value)}
              options={[{ value: 'none', label: 'Sem lance' }, { value: 'embutido', label: 'Lance embutido' }, { value: 'livre', label: 'Lance livre' }]} />
            {cons.tipoLance !== 'none' && (
              <Field label="% do lance" value={cons.percLance} onChange={e => sc('percLance', e.target.value)} type="number" suffix="%" />
            )}
            <Field label="Upgrade de crédito" value={cons.upgrade} onChange={e => sc('upgrade', e.target.value)} type="number" prefix="R$" placeholder="0" />

            {resCons && (
              <div style={{ background: BG3, borderRadius: 10, padding: 16, marginTop: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Crédito',       fmt(resCons.creditoFinal)],
                    ['Parcela',       fmt(resCons.parcela)],
                    ['Total a pagar', fmt(resCons.totalPagar)],
                    ['Taxa Adm',      `${(taxaAdm*100).toFixed(1)}%`],
                    ...(cons.tipoLance !== 'none' ? [['Lance', fmt(resCons.lance)]] : []),
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 10, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', fontFamily: SN }}>{l}</div>
                      <div style={{ fontFamily: FT, fontSize: 18, color: DARK, fontWeight: 300 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* HOME EQUITY */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: FT, fontSize: 17, color: DARK }}>🏦 Home Equity</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: GRAY, fontFamily: SN }}>
              <input type="checkbox" checked={ativos.includes('he')} onChange={() => toggle('he')} />
              Incluir na proposta
            </label>
          </div>
          <Card>
            <Field label="Valor do imóvel"         value={he.valorImovel}  onChange={e => sh('valorImovel', e.target.value)}  type="number" prefix="R$" placeholder="0" />
            <Field label="LTV — % do crédito"      value={he.percentual}   onChange={e => sh('percentual', e.target.value)}   type="number" suffix="%" />
            <Field label="Taxa de juros (% a.m.)"  value={he.taxaMensal}   onChange={e => sh('taxaMensal', e.target.value)}   type="number" suffix="% a.m." />
            <Field label="Prazo (meses)"            value={he.prazo}        onChange={e => sh('prazo', e.target.value)}        type="number" suffix="meses" />
            <Field label="Carência (meses)"         value={he.carencia}     onChange={e => sh('carencia', e.target.value)}     type="number" suffix="meses" />
            <Field label="Finalidade dos recursos"  value={he.finalidade}   onChange={e => sh('finalidade', e.target.value)}  placeholder="Ex: Quitar dívidas, reformar, investir..." />

            {resHE && (
              <div style={{ background: BG3, borderRadius: 10, padding: 16, marginTop: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['Crédito',       fmt(valorHE)],
                    ['LTV',           `${he.percentual}%`],
                    ['Parcela Price', fmt(resHE.priceParcela)],
                    ['Total Price',   fmt(resHE.priceTotalPago)],
                    ['SAC 1ª parc.',  fmt(resHE.sacPrimeira)],
                    ['Total SAC',     fmt(resHE.sacTotalPago)],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 10, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', fontFamily: SN }}>{l}</div>
                      <div style={{ fontFamily: FT, fontSize: 18, color: DARK, fontWeight: 300 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* RECOMENDAÇÃO */}
      <Card style={{ marginTop: 22 }}>
        <div style={{ fontFamily: FT, fontSize: 16, color: GOLD, marginBottom: 12 }}>Recomendação Estratégica</div>
        <Field
          value={rec}
          onChange={e => setRec(e.target.value)}
          placeholder="Descreva a estratégia recomendada. Ex: 'Dado o perfil de médio prazo e posse de imóvel, recomendo a combinação de consórcio para aquisição + HE para liquidez imediata...'"
          rows={4}
        />
      </Card>

      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Btn variant="gold" onClick={() => onGerar({ cenarios: buildCenarios(), recomendacao: rec })} disabled={ativos.length === 0 || buildCenarios().length === 0}>
          Gerar Proposta →
        </Btn>
      </div>
    </div>
  )
}

// ── TELA PROPOSTA ──────────────────────────────────────────────────────────
function Proposta({ diag, cenarios, recomendacao, codigo, consultor, onNova }) {
  const [salvo,    setSalvo]    = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { salvar() }, [])

  async function salvar() {
    setSalvando(true)
    try {
      await supabase.from('propostas').upsert({
        codigo,
        segmento: 'varejo',
        dados: { cliente: diag, cenarios, recomendacao, consultor },
        user_id: consultor?.id || null,
        created_at: new Date().toISOString(),
      }, { onConflict: 'codigo' })
      setSalvo(true)
    } catch (e) { console.error(e) }
    setSalvando(false)
  }

  function download() {
    const html = gerarHTML({ cliente: diag, cenarios, recomendacao, codigo }, consultor)
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    a.download = `proposta-axicon-${codigo}.html`
    a.click()
  }

  return (
    <div>
      <SecTitle sub={`Código: ${codigo}`}>Proposta Gerada</SecTitle>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
        <Btn variant="gold"    onClick={download}>⬇ Baixar HTML / PDF</Btn>
        <Btn variant="outline" onClick={onNova}>+ Nova Simulação</Btn>
        <div style={{ marginLeft: 'auto', fontSize: 13, fontFamily: SN, color: salvando ? GOLD : salvo ? '#4caf50' : GRAY }}>
          {salvando ? 'Salvando...' : salvo ? '✓ Salvo no Supabase' : ''}
        </div>
      </div>

      {/* PREVIEW */}
      <Card>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 22, borderBottom: `1px solid ${BDR}` }}>
          <img src={LOGO_FULL} alt="Áxicon" style={{ height: 48, objectFit: 'contain' }} />
          <div style={{ textAlign: 'right', fontSize: 12, color: GRAY, fontFamily: SN, lineHeight: 1.9 }}>
            <div style={{ color: GOLD, fontWeight: 500 }}>{consultor?.nome || 'Consultor Áxicon'}</div>
            <div>{consultor?.email}</div>
            <div>{consultor?.telefone || '(44) 9.9114-72366'}</div>
          </div>
        </div>

        <div style={{ fontSize: 10, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontFamily: SN, marginBottom: 10 }}>Proposta Estratégica · Varejo · {codigo}</div>
        <div style={{ fontFamily: FT, fontSize: 34, color: DARK, fontWeight: 300, marginBottom: 4 }}>{diag.nome}</div>
        {diag.setor && <div style={{ fontSize: 14, color: GRAY, fontFamily: SN, marginBottom: 14 }}>{diag.setor}</div>}
        <div style={{ fontSize: 12, color: '#444', fontFamily: SN, marginBottom: 28 }}>
          {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* Diagnóstico */}
        <Card style={{ marginBottom: 22, background: BG3 }}>
          <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SN, marginBottom: 12 }}>Diagnóstico</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22 }}>
            {[
              ['Objetivo',    diag.objetivo],
              ['Finalidade',  diag.finalidade?.replace(/_/g,' ')],
              ['Urgência',    diag.urgencia],
              ['Imóvel',      diag.temImovel],
              ['Renda',       diag.rendaMensal ? fmt(Number(diag.rendaMensal)) : ''],
            ].filter(([,v]) => v).map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: GRAY, fontFamily: SN }}>{l}</div>
                <div style={{ fontSize: 14, color: '#ccc', fontFamily: SN, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          {diag.observacoes && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BDR}`, fontSize: 13, color: GRAY, fontStyle: 'italic', fontFamily: SN }}>{diag.observacoes}</div>
          )}
        </Card>

        {/* Recomendação */}
        {recomendacao && (
          <Card style={{ marginBottom: 22, background: 'rgba(0,20,137,0.12)', borderColor: 'rgba(0,20,137,0.4)' }}>
            <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SN, marginBottom: 10 }}>Recomendação Estratégica</div>
            <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8, fontFamily: SN }}>{recomendacao}</div>
          </Card>
        )}

        {/* Cenários */}
        <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SN, marginBottom: 16 }}>Cenários Apresentados</div>
        {cenarios.map((c, i) => (
          <Card key={i} style={{ marginBottom: 14, background: BG3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: FT, fontSize: 18, color: DARK }}>{c.titulo}</div>
              {c.recomendado && (
                <span style={{ background: `linear-gradient(135deg,${NAVY},${NAVY2})`, color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11, letterSpacing: 1, fontFamily: SN }}>RECOMENDADO</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: GRAY, marginBottom: 16, fontFamily: SN, lineHeight: 1.6 }}>{c.descricao}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {c.kpis.map((k, j) => (
                <div key={j} style={{ background: BG2, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', fontFamily: SN, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontFamily: FT, fontSize: 16, color: DARK, fontWeight: 300 }}>{k.value}</div>
                  {k.sub && <div style={{ fontSize: 11, color: GRAY, marginTop: 2, fontFamily: SN }}>{k.sub}</div>}
                </div>
              ))}
            </div>
            {c.obs && <div style={{ marginTop: 10, fontSize: 12, color: '#555', fontStyle: 'italic', fontFamily: SN }}>* {c.obs}</div>}
          </Card>
        ))}

        {/* Brief Áxicon */}
        <AxiconBrief />
      </Card>
    </div>
  )
}

// ── APP ────────────────────────────────────────────────────────────────────
export default function Varejo() {
  const [tela,    setTela]    = useState('crm')
  const [diag,    setDiag]    = useState(null)
  const [result,  setResult]  = useState(null)
  const [codigo,  setCodigo]  = useState('')
  const [user,    setUser]    = useState(null)
  const [aberta,  setAberta]  = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const u = data.session.user
        setUser({ id: u.id, nome: u.user_metadata?.full_name || u.email, email: u.email, telefone: '(44) 9.9114-72366' })
      }
    })
  }, [])

  const steps = ['crm', 'diagnostico', 'cenarios', 'proposta']
  const stepLabels = { crm: 'CRM', diagnostico: 'Diagnóstico', cenarios: 'Cenários', proposta: 'Proposta' }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SN }}>

      {/* HEADER */}
      <header style={{ background: NAVY, borderBottom: `1px solid rgba(255,255,255,0.1)`, padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>

        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={LOGO_FULL} alt="Áxicon" style={{ height: 48, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(1)' }} />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase' }}>Varejo</div>
        </div>

        {/* STEPS */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => {
                  if (s === 'crm') { setAberta(null); setTela('crm') }
                  else if (s === 'diagnostico' && tela !== 'crm') setTela('diagnostico')
                  else if (s === 'cenarios' && (tela === 'cenarios' || tela === 'proposta')) setTela('cenarios')
                }}
                style={{
                  background: tela === s ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: `1px solid ${tela === s ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 20, padding: '6px 14px',
                  color: '#fff',
                  fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: SN, opacity: tela === s ? 1 : 0.6,
                }}
              >{stepLabels[s]}</button>
              {i < steps.length - 1 && <div style={{ width: 14, height: 1, background: 'rgba(255,255,255,0.15)' }} />}
            </div>
          ))}
        </div>

        {/* USER + LINK ATACADO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user && <div style={{ fontSize: 12, color: GRAY, fontFamily: SN }}>{user.nome}</div>}
          <a href="/" style={{ fontSize: 12, color: GOLD, textDecoration: 'none', fontFamily: SN, letterSpacing: 1, border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 20 }}>← Atacado</a>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px' }}>
        {tela === 'crm' && (
          <CRM
            onNova={cliente => { setDiag(cliente); setAberta(null); setTela('diagnostico') }}
            onAbrir={p => { setAberta(p); setCodigo(p.codigo); setDiag(p.dados?.cliente); setResult({ cenarios: p.dados?.cenarios, recomendacao: p.dados?.recomendacao }); setTela('proposta') }}
          />
        )}
        {tela === 'diagnostico' && (
          <Diagnostico
            inicial={diag || {}}
            onProximo={d => { setDiag(d); setTela('cenarios') }}
          />
        )}
        {tela === 'cenarios' && diag && (
          <Cenarios
            diag={diag}
            onGerar={({ cenarios, recomendacao }) => { const cod = gerarCodigo(); setCodigo(cod); setResult({ cenarios, recomendacao }); setAberta(null); setTela('proposta') }}
          />
        )}
        {tela === 'proposta' && diag && result && (
          <Proposta
            diag={diag}
            cenarios={aberta ? aberta.dados?.cenarios : result.cenarios}
            recomendacao={aberta ? aberta.dados?.recomendacao : result.recomendacao}
            codigo={codigo}
            consultor={user}
            onNova={() => { setAberta(null); setTela('crm') }}
          />
        )}
      </main>
    </div>
  )
}