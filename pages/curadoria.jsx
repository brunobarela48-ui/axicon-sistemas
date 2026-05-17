import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const LOGO_FULL = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png'

// Mesma paleta da intranet
const NAVY  = '#001489'
const NAVY2 = '#2B367B'
const GOLD  = '#CCA67F'
const BG    = '#EEF0F8'
const FT    = "'The Seasons','Georgia',serif"
const SN    = "'Montserrat','Helvetica Neue',sans-serif"

const TAGS_FILTRO = ['Todas','Macro','Câmbio','Crédito','Mercado de Capitais','Agro','Cross-Border','Regulatório']

export default function Curadoria() {
  const [session, setSession]   = useState(null)
  const [role, setRole]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [itens, setItens]       = useState([])
  const [fonte, setFonte]       = useState('Todas')
  const [tag, setTag]           = useState('Todas')
  const [busy, setBusy]         = useState({})         // { [id]: 'aprovando' | 'rejeitando' }
  const [fetching, setFetching] = useState(false)      // botão "buscar agora"
  const [msg, setMsg]           = useState('')
  const [erro, setErro]         = useState('')

  // Sessão + role
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (!session) { setLoading(false); return }
      try {
        const r = await fetch('/api/auth', { headers: { authorization: `Bearer ${session.access_token}` } })
        const j = await r.json()
        setRole(j?.user?.role || null)
      } catch {}
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const carregar = useCallback(async () => {
    if (!session) return
    setErro('')
    try {
      const r = await fetch('/api/curadoria/pendentes', { headers: { authorization: `Bearer ${session.access_token}` } })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Erro ao carregar pendentes'); return }
      setItens(j.itens || [])
    } catch (e) {
      setErro('Falha de conexão ao carregar pendentes.')
    }
  }, [session])

  useEffect(() => { if (role === 'admin') carregar() }, [role, carregar])

  const aprovar = async (id, destaque = false) => {
    setBusy(b => ({ ...b, [id]: 'aprovando' })); setMsg(''); setErro('')
    try {
      const r = await fetch('/api/curadoria/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, destaque }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha ao aprovar'); return }
      setItens(list => list.filter(i => i.id !== id))
      setMsg('Notícia publicada no site.')
    } finally {
      setBusy(b => { const c = { ...b }; delete c[id]; return c })
    }
  }

  const rejeitar = async (id) => {
    setBusy(b => ({ ...b, [id]: 'rejeitando' })); setMsg(''); setErro('')
    try {
      const r = await fetch('/api/curadoria/rejeitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha ao rejeitar'); return }
      setItens(list => list.filter(i => i.id !== id))
      setMsg('Notícia rejeitada.')
    } finally {
      setBusy(b => { const c = { ...b }; delete c[id]; return c })
    }
  }

  const buscarAgora = async () => {
    const secret = window.prompt('CRON_SECRET (apenas para forçar uma busca manual):')
    if (!secret) return
    setFetching(true); setMsg(''); setErro('')
    try {
      const r = await fetch('/api/curadoria/buscar', {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}` },
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha na busca'); return }
      setMsg(`Busca concluída: ${j.inseridos || 0} novos · ${j.duplicados || 0} duplicados · ${j.falhas || 0} feeds falharam.`)
      await carregar()
    } catch (e) {
      setErro('Falha de conexão na busca.')
    } finally {
      setFetching(false)
    }
  }

  if (loading) {
    return <div style={center}><div style={{ color: NAVY, fontSize: 14, fontFamily: SN }}>Verificando acesso...</div></div>
  }
  if (!session) {
    if (typeof window !== 'undefined') window.location.href = '/'
    return null
  }
  if (role !== 'admin') {
    return (
      <div style={center}>
        <div style={{ background: 'white', borderRadius: 14, padding: '32px 36px', maxWidth: 480, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize: 11, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>ACESSO RESTRITO</div>
          <div style={{ fontSize: 18, fontFamily: FT, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Curadoria editorial</div>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, fontFamily: SN }}>Este módulo é restrito a administradores. Peça acesso ao responsável do sistema.</p>
          <a href="/" style={{ display: 'inline-block', marginTop: 18, fontSize: 12, color: NAVY, textDecoration: 'none', border: `1px solid ${NAVY}40`, padding: '8px 18px', borderRadius: 20, fontFamily: SN, letterSpacing: 1 }}>← Voltar</a>
        </div>
      </div>
    )
  }

  // Fontes únicas para o filtro
  const fontesUnicas = ['Todas', ...Array.from(new Set(itens.map(i => i.fonte).filter(Boolean))).sort()]

  const visiveis = itens.filter(i =>
    (fonte === 'Todas' || i.fonte === fonte) &&
    (tag === 'Todas' || i.tag === tag)
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SN }}>
      {/* HEADER */}
      <header style={{ background: NAVY, padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={LOGO_FULL} alt="Áxicon" style={{ height: 44, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(1)' }} />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase' }}>Curadoria de notícias</div>
        </div>
        <a href="/" style={{ fontSize: 12, color: GOLD, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 20 }}>← Intranet</a>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Título + ações */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>FLUXO EDITORIAL · DIÁRIO</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', fontFamily: FT }}>{visiveis.length} pendente{visiveis.length === 1 ? '' : 's'}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Busca automática às 06h, 12h e 15h. Aprovar = vai para www.axiconsolucoes.com/noticias.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="/curadoria/newsletter" style={{ ...btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>✉ Compor newsletter →</a>
            <button onClick={carregar} style={btnGhost}>↻ Atualizar</button>
            <button onClick={buscarAgora} disabled={fetching} style={{ ...btnPrimary, opacity: fetching ? 0.5 : 1 }}>
              {fetching ? 'Buscando...' : '⚡ Buscar agora'}
            </button>
          </div>
        </div>

        {/* Mensagens */}
        {msg && <Alert kind="ok">{msg}</Alert>}
        {erro && <Alert kind="erro">{erro}</Alert>}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
          <FilterGroup label="FONTE" value={fonte} options={fontesUnicas} onChange={setFonte} />
          <FilterGroup label="CATEGORIA" value={tag} options={TAGS_FILTRO} onChange={setTag} />
        </div>

        {/* Lista */}
        {visiveis.length === 0 ? (
          <div style={empty}>
            {itens.length === 0
              ? 'Nenhuma notícia pendente no momento. O próximo lote chega na próxima janela (06h/12h/15h).'
              : 'Nenhuma notícia bate com os filtros aplicados.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {visiveis.map(item => (
              <article key={item.id} style={cardStyle}>
                {item.imagem && (
                  <div style={{ width: 160, minWidth: 160, height: 120, background: `url('${item.imagem}') center/cover, ${BG}`, borderRadius: 10, alignSelf: 'flex-start' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    {item.fonte && <span style={badge(NAVY)}>{item.fonte}</span>}
                    {item.tag && <span style={badge(GOLD, '#5a4520')}>{item.tag}</span>}
                    {item.data && <span style={{ fontSize: 11, color: '#888' }}>{fmtData(item.data)}</span>}
                    {item.tempo_leitura && <span style={{ fontSize: 11, color: '#888' }}>· ⏱ {item.tempo_leitura} min de leitura</span>}
                  </div>
                  <h3 style={{ fontSize: 17, fontFamily: FT, fontWeight: 700, color: '#1a1a1a', margin: '0 0 10px', lineHeight: 1.3 }}>
                    {item.titulo}
                  </h3>
                  {item.analise ? (
                    <p style={{ fontSize: 14, color: '#333', lineHeight: 1.75, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>{item.analise}</p>
                  ) : item.resumo ? (
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: '0 0 12px' }}>{item.resumo}</p>
                  ) : null}
                  {item.analise && item.resumo && item.resumo !== item.analise && (
                    <details style={{ marginBottom: 12 }}>
                      <summary style={{ fontSize: 11, color: NAVY, cursor: 'pointer', fontWeight: 600, letterSpacing: 1 }}>RESUMO CURTO (CARD DO SITE)</summary>
                      <p style={{ fontSize: 12, color: '#777', lineHeight: 1.6, margin: '8px 0 0', fontStyle: 'italic' }}>{item.resumo}</p>
                    </details>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={linkSrc}>Ler na fonte ↗</a>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => rejeitar(item.id)} disabled={!!busy[item.id]} style={btnReject}>
                      {busy[item.id] === 'rejeitando' ? '...' : '✗ Rejeitar'}
                    </button>
                    <button onClick={() => aprovar(item.id, true)} disabled={!!busy[item.id]} style={btnFeature} title="Aprovar e marcar como destaque">
                      {busy[item.id] === 'aprovando' ? '...' : '★ Destaque'}
                    </button>
                    <button onClick={() => aprovar(item.id, false)} disabled={!!busy[item.id]} style={btnApprove}>
                      {busy[item.id] === 'aprovando' ? '...' : '✓ Aprovar'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(0,20,137,0.1)', padding: '16px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: '#bbb', letterSpacing: 1 }}>ÁXICON SOLUÇÕES FINANCEIRAS · USO INTERNO · CURADORIA EDITORIAL</span>
      </footer>
    </div>
  )
}

// ── helpers visuais ────────────────────────────────────────────────────────
function Alert({ kind, children }) {
  const ok = kind === 'ok'
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 8, marginBottom: 16,
      background: ok ? '#e8f5e9' : '#fde8e8',
      border: `1px solid ${ok ? '#4caf5040' : '#f4433640'}`,
      color: ok ? '#1b5e20' : '#c62828',
      fontSize: 13,
    }}>{children}</div>
  )
}

function FilterGroup({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(o => {
          const active = o === value
          return (
            <button key={o} onClick={() => onChange(o)} style={{
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: SN, fontSize: 12,
              border: `1.5px solid ${active ? NAVY : '#ddd'}`,
              background: active ? NAVY + '14' : 'white',
              color: active ? NAVY : '#888',
              fontWeight: active ? 600 : 400,
            }}>{o}</button>
          )
        })}
      </div>
    </div>
  )
}

function fmtData(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const now = new Date()
  const diffH = (now - d) / 3600000
  if (diffH < 1) return 'agora'
  if (diffH < 24 && d.toDateString() === now.toDateString()) {
    return `hoje · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }
  const y = new Date(now); y.setDate(y.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'ontem'
  return d.toLocaleDateString('pt-BR')
}

// ── styles ─────────────────────────────────────────────────────────────────
const center = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, padding: 24 }
const cardStyle = { display: 'flex', gap: 18, background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }
const empty = { background: 'white', borderRadius: 12, padding: '48px 24px', textAlign: 'center', color: '#888', fontSize: 13, border: '1px dashed #ddd' }
const badge = (bg, fg = '#fff') => ({ fontSize: 10, padding: '3px 10px', borderRadius: 10, background: bg, color: fg, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' })
const linkSrc = { fontSize: 11, color: NAVY, textDecoration: 'none', borderBottom: `1px solid ${NAVY}40`, paddingBottom: 1 }
const btnBase = { padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: SN, transition: 'all .15s' }
const btnApprove = { ...btnBase, background: NAVY, color: '#fff', border: 'none' }
const btnFeature = { ...btnBase, background: 'white', color: GOLD, border: `1.5px solid ${GOLD}` }
const btnReject  = { ...btnBase, background: 'white', color: '#888', border: '1.5px solid #ddd' }
const btnPrimary = { ...btnBase, background: NAVY, color: '#fff', border: 'none', padding: '10px 18px', fontSize: 13 }
const btnGhost   = { ...btnBase, background: 'white', color: NAVY, border: `1.5px solid ${NAVY}40`, padding: '10px 18px', fontSize: 13 }
