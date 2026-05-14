import { useState, useRef } from 'react'
import { supabaseAdmin } from '../../lib/supabase-admin'

const BLUE  = '#001489'
const LOGO  = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png'

const CHECKLIST_DOCS = [
  { id: 'contrato_social', label: 'Contrato Social' },
  { id: 'cartao_cnpj',     label: 'Cartão CNPJ' },
  { id: 'balanco_p1',      label: 'Balanço Patrimonial (ano -1)' },
  { id: 'balanco_p2',      label: 'Balanço Patrimonial (ano -2)' },
  { id: 'dre_p1',          label: 'DRE (ano -1)' },
  { id: 'dre_p2',          label: 'DRE (ano -2)' },
  { id: 'extrato_ban',     label: 'Extratos Bancários (6 meses)' },
  { id: 'comp_endereco',   label: 'Comprovante de Endereço' },
  { id: 'rg_socios',       label: 'RG/CPF dos Sócios' },
  { id: 'cnd',             label: 'Certidão Negativa de Débitos' },
]

const ETAPA_INFO = {
  // Varejo
  lead_captado:         { label: 'Em análise',              color: '#1d4ed8', step: 1, total: 6 },
  primeiro_contato:     { label: 'Primeiro contato',        color: '#3b82f6', step: 2, total: 6 },
  primeira_reuniao:     { label: 'Reunião realizada',       color: '#22d3ee', step: 3, total: 6 },
  lead_qualificado:     { label: 'Proposta em preparação',  color: '#f59e0b', step: 4, total: 6 },
  negociando:           { label: 'Em negociação',           color: '#eab308', step: 5, total: 6 },
  aguardando_pagamento: { label: 'Aguardando formalização', color: '#0ea5e9', step: 6, total: 6 },
  fechado_ganho:        { label: 'Concluído',               color: '#2e8a4e', step: 6, total: 6 },
  fechado_perdido:      { label: 'Encerrado',               color: '#b71c1c', step: 0, total: 6 },
  // Atacado
  lead_capitado:        { label: 'Em análise',              color: '#1d4ed8', step: 1, total: 5 },
  analise_negocio:      { label: 'Análise em andamento',    color: '#f59e0b', step: 2, total: 5 },
  apresentacao_proposta:{ label: 'Proposta apresentada',    color: '#7c3aed', step: 3, total: 5 },
  documentacao:         { label: 'Aguardando documentação', color: '#1e40af', step: 4, total: 5 },
  projeto_aprovado:     { label: 'Aprovado',                color: '#2e8a4e', step: 5, total: 5 },
}

function parseExtras(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return {} }
}

export async function getServerSideProps(context) {
  const { token } = context.params

  const { data: allContatos } = await supabaseAdmin
    .from('crm_contatos')
    .select('*')
    .eq('empresa_id', 'axicon')

  const parseEx = (raw) => {
    if (!raw) return {}
    if (typeof raw === 'object') return raw
    try { return JSON.parse(raw) } catch { return {} }
  }

  const contatos = (allContatos || []).filter(c => parseEx(c.campos_extras).portal_token === token)

  if (!contatos.length) {
    return { props: { error: true, token } }
  }

  const c = contatos[0]

  const [resV, resA, resComs] = await Promise.all([
    supabaseAdmin.from('crm_negocios_varejo').select('*').eq('contato_id', c.id).eq('empresa_id', 'axicon'),
    supabaseAdmin.from('crm_negocios_atacado').select('*').eq('contato_id', c.id).eq('empresa_id', 'axicon'),
    supabaseAdmin.from('comunicados').select('id,tipo,titulo,corpo,cor,icone,progresso,meta_label')
      .eq('ativo', true).order('ordem').order('criado_em', { ascending: false }),
  ])

  const fromNeg = (r, area) => {
    const extras = parseExtras(r.campos_extras)
    return {
      id: r.id,
      titulo: r.titulo,
      valor: r.valor,
      etapa: r.etapa,
      produto: r.produto,
      area: extras.area || area,
      checklist: extras.checklist_docs || {},
    }
  }

  return {
    props: {
      token,
      contato: { id: c.id, nome: c.nome, empresa: c.empresa, email: c.email, area: c.area },
      negocios: [
        ...(resV.data || []).map(r => fromNeg(r, 'varejo')),
        ...(resA.data || []).map(r => fromNeg(r, 'atacado')),
      ],
      comunicados: resComs.data || [],
    },
  }
}

export default function PortalCliente({ error, token, contato, negocios: initialNegocios = [], comunicados = [] }) {
  const [negocios, setNegocios] = useState(initialNegocios)
  const [uploading, setUploading] = useState(null)
  const fileInputs = useRef({})

  if (error) {
    return (
      <div style={{ fontFamily: 'Inter, Arial, sans-serif', background: '#F5F6FA', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <img src={LOGO} alt="Áxicon" style={{ height: 48, filter: 'brightness(0) saturate(100%) invert(8%) sepia(96%) saturate(7500%) hue-rotate(220deg) brightness(89%) contrast(101%)' }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Link inválido</div>
        <div style={{ fontSize: 14, color: '#888', textAlign: 'center', maxWidth: 340 }}>Este link do portal não existe ou expirou. Entre em contato com seu consultor.</div>
      </div>
    )
  }

  const fmtBRL = (v) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) : 'R$ —'

  const getEtapa = (etapa) => ETAPA_INFO[etapa] || { label: etapa, color: '#888', step: 1, total: 5 }

  const handleUpload = async (negocioId, itemId, file) => {
    if (!file) return
    setUploading({ negocioId, itemId })
    const form = new FormData()
    form.append('file', file, file.name)
    form.append('negocio_id', String(negocioId))
    form.append('item_id', itemId)
    try {
      const r = await fetch(`/api/portal/${token}`, { method: 'POST', body: form })
      const d = await r.json()
      if (!r.ok) { alert('Erro ao enviar: ' + (d.error || r.status)); return }
      setNegocios(prev => prev.map(n => {
        if (n.id !== negocioId) return n
        return { ...n, checklist: { ...n.checklist, [itemId]: { checked: true, arquivo: { nome: file.name, tipo: file.type, url: d.url } } } }
      }))
    } catch { alert('Erro de conexão ao enviar o arquivo.') }
    finally { setUploading(null) }
  }

  const negociosAtivos = negocios.filter(n => n.etapa !== 'fechado_perdido')
  const negociosDoc    = negociosAtivos.filter(n => n.area === 'atacado')

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',Arial,sans-serif", background: '#F5F6FA', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ background: BLUE, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,20,137,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={LOGO} alt="Áxicon" style={{ height: 34, filter: 'brightness(0) invert(1)' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.25)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>Portal do Cliente</span>
        </div>
        {contato.empresa && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contato.empresa}</span>
        )}
      </header>

      {/* Welcome bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e8eaf0', padding: '24px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Olá, {contato.nome?.split(' ')[0]}!</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Acompanhe o status das suas propostas e envie documentos pendentes.</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* ── Propostas ────────────────────────────────────────────── */}
        {negocios.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <Label>Suas propostas</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {negocios.map(n => {
                const etapa   = getEtapa(n.etapa)
                const perdido = n.etapa === 'fechado_perdido'
                const pct     = perdido ? 0 : Math.round((etapa.step / etapa.total) * 100)
                return (
                  <div key={n.id} style={{ background: 'white', borderRadius: 14, padding: '22px 26px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: perdido ? '1.5px solid #fee2e2' : '1px solid #e8eaf0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{n.titulo}</div>
                        {n.produto && <div style={{ fontSize: 13, color: '#888' }}>{n.produto}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: perdido ? '#b71c1c' : BLUE }}>{fmtBRL(n.valor)}</span>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: `${etapa.color}18`, color: etapa.color, fontWeight: 700, border: `1.5px solid ${etapa.color}40`, whiteSpace: 'nowrap' }}>
                          {etapa.label}
                        </span>
                      </div>
                    </div>
                    {!perdido && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 6 }}>
                          <span>Progresso da operação</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: '#f0f0f5', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: etapa.color, borderRadius: 3, transition: 'width .5s' }} />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Documentação ─────────────────────────────────────────── */}
        {negociosDoc.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <Label>Documentação</Label>
            {negociosDoc.map(n => {
              const cl     = n.checklist || {}
              const feitos = CHECKLIST_DOCS.filter(d => cl[d.id]?.checked).length
              return (
                <div key={n.id} style={{ background: 'white', borderRadius: 14, padding: '22px 26px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e8eaf0', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{n.titulo}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: feitos === CHECKLIST_DOCS.length ? '#2e8a4e' : '#888' }}>
                      {feitos}/{CHECKLIST_DOCS.length} entregues
                    </span>
                  </div>
                  {/* Barra de progresso docs */}
                  <div style={{ height: 4, borderRadius: 2, background: '#f0f0f5', marginBottom: 18, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(feitos / CHECKLIST_DOCS.length) * 100}%`, background: '#2e8a4e', borderRadius: 2, transition: 'width .4s' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {CHECKLIST_DOCS.map(doc => {
                      const item  = cl[doc.id]
                      const done  = !!item?.checked
                      const isUp  = uploading?.negocioId === n.id && uploading?.itemId === doc.id
                      const key   = `${n.id}_${doc.id}`
                      const fileUrl = item?.arquivo?.url?.startsWith('http') ? item.arquivo.url : null
                      return (
                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 9, background: done ? '#f0fdf4' : '#fafafa', border: `1px solid ${done ? '#bbf7d0' : '#e8eaf0'}`, gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{done ? '✅' : '📄'}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{doc.label}</div>
                              {done && item?.arquivo?.nome && (
                                <div style={{ fontSize: 11, color: '#2e8a4e', marginTop: 2 }}>
                                  {fileUrl ? (
                                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: '#2e8a4e', textDecoration: 'none' }}>
                                      {item.arquivo.nome} ↗
                                    </a>
                                  ) : item.arquivo.nome}
                                </div>
                              )}
                            </div>
                          </div>
                          {!done && (
                            <>
                              <input
                                type="file"
                                ref={el => { fileInputs.current[key] = el }}
                                style={{ display: 'none' }}
                                onChange={e => {
                                  const f = e.target.files?.[0]
                                  if (f) handleUpload(n.id, doc.id, f)
                                  e.target.value = ''
                                }}
                              />
                              <button
                                onClick={() => fileInputs.current[key]?.click()}
                                disabled={!!isUp}
                                style={{ padding: '7px 16px', borderRadius: 7, border: `1.5px solid ${BLUE}`, background: isUp ? '#f0f0f5' : 'white', color: isUp ? '#aaa' : BLUE, fontSize: 12, fontWeight: 600, cursor: isUp ? 'wait' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {isUp ? 'Enviando…' : 'Enviar'}
                              </button>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* ── Comunicados ───────────────────────────────────────────── */}
        {comunicados.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <Label>Comunicados</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comunicados.map(com => {
                const cor = com.cor || BLUE
                return (
                  <div key={com.id} style={{ background: `${cor}0C`, borderRadius: 12, padding: '16px 20px', border: `1.5px solid ${cor}30`, borderLeft: `4px solid ${cor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: com.corpo ? 8 : 0 }}>
                      <span style={{ fontSize: 18 }}>{com.icone || '📌'}</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{com.titulo}</div>
                    </div>
                    {com.corpo && <div style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginLeft: 28 }}>{com.corpo}</div>}
                    {com.progresso > 0 && (
                      <div style={{ marginTop: 12, marginLeft: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 5 }}>
                          <span>{com.meta_label || 'Progresso'}</span>
                          <span>{com.progresso}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: `${cor}20`, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${com.progresso}%`, background: cor, borderRadius: 3 }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Estado vazio */}
        {negocios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#555' }}>Nenhuma proposta ativa</div>
            <div style={{ fontSize: 13 }}>Entre em contato com seu consultor da Áxicon para mais informações.</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e8eaf0', padding: '22px 32px', textAlign: 'center', background: 'white' }}>
        <img src={LOGO} alt="Áxicon" style={{ height: 28, filter: `brightness(0) saturate(100%) invert(8%) sepia(96%) saturate(7500%) hue-rotate(220deg)`, marginBottom: 8 }} />
        <div style={{ fontSize: 11, color: '#bbb' }}>Soluções financeiras para pessoas e empresas</div>
      </footer>
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: '#bbb', textTransform: 'uppercase', marginBottom: 14, paddingLeft: 2 }}>
      {children}
    </div>
  )
}
