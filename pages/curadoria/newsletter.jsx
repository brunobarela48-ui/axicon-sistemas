import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const LOGO_FULL = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png'

const NAVY  = '#001489'
const NAVY2 = '#2B367B'
const GOLD  = '#CCA67F'
const BRONZE = '#B87333'
const BG    = '#EEF0F8'
const FT    = "'The Seasons','Georgia',serif"
const SN    = "'Montserrat','Helvetica Neue',sans-serif"

const KINDS = {
  NONE: 0,        // não incluir
  MANCHETE: 1,    // mini-nota
  STORY: 2,       // pauta longa
}

export default function NewsletterComposer() {
  const [session, setSession]   = useState(null)
  const [role, setRole]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [publicadas, setPublicadas] = useState([])     // noticias_publicadas
  const [picks, setPicks]       = useState({})         // { [id]: KINDS.* }
  const iframeRef               = useRef(null)

  // Campos editoriais
  const [assunto, setAssunto]   = useState('bom dia. — Áxicon Daily News')
  const [headline, setHeadline] = useState('o crédito está mudando de <em>endereço</em>.')
  const [intro, setIntro]       = useState('bom dia. faz tempo que a engenharia financeira não cabe mais só dentro do quadrilátero da Faria Lima.\n\nboa leitura. ☕')
  const [moodLine, setMoodLine] = useState('fora do eixo')
  const [edicaoNumber, setEdicaoNumber] = useState(1)

  // Estado do preview e envio
  const [previewHtml, setPreviewHtml] = useState('')
  const [busyPreview, setBusyPreview] = useState(false)
  const [busySend, setBusySend]       = useState(false)
  const [busyBroadcast, setBusyBroadcast] = useState(false)
  const [destEmail, setDestEmail]     = useState('')
  const [contagemAtivos, setContagemAtivos] = useState(null)
  const [msg, setMsg]   = useState('')
  const [erro, setErro] = useState('')

  // Auth + role
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (!session) { setLoading(false); return }
      try {
        const r = await fetch('/api/auth', { headers: { authorization: `Bearer ${session.access_token}` } })
        const j = await r.json()
        setRole(j?.user?.role || null)
        if (j?.user?.email) setDestEmail(j.user.email)
      } catch {}
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Carrega publicadas (precisa de role admin)
  const carregar = useCallback(async () => {
    if (!session) return
    try {
      const r = await fetch('/api/curadoria/publicadas', { headers: { authorization: `Bearer ${session.access_token}` } })
      if (!r.ok) {
        // fallback: usa o endpoint público /api/noticias
        const r2 = await fetch('/api/noticias')
        const j2 = await r2.json()
        setPublicadas((j2.noticias || []).map((n, i) => ({ ...n, id: n.id || `pub-${i}` })))
        return
      }
      const j = await r.json()
      setPublicadas(j.itens || [])
    } catch {
      // fallback público
      const r2 = await fetch('/api/noticias')
      const j2 = await r2.json()
      setPublicadas(j2.noticias || [])
    }
  }, [session])

  useEffect(() => { if (role === 'admin') carregar() }, [role, carregar])

  // Pré-carrega contagem de assinantes ativos para mostrar no botão
  useEffect(() => {
    if (role !== 'admin' || !session) return
    fetch('/api/newsletter/assinantes', { headers: { authorization: `Bearer ${session.access_token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) setContagemAtivos(j.ativos ?? 0) })
      .catch(() => {})
  }, [role, session])

  const selecionadas = useMemo(() => {
    const stories = []
    const manchetes = []
    publicadas.forEach(n => {
      const k = picks[n.id]
      if (k === KINDS.STORY) stories.push(n.id)
      else if (k === KINDS.MANCHETE) manchetes.push(n.id)
    })
    return { stories, manchetes, total: stories.length + manchetes.length }
  }, [publicadas, picks])

  const setKind = (id, kind) => setPicks(p => ({ ...p, [id]: kind }))

  // Aplica picks default: top 2 com analise viram story, próximos 4 viram manchete
  const aplicarSugestao = () => {
    const np = {}
    let storyCount = 0, mancheteCount = 0
    for (const n of publicadas) {
      if (n.analise && storyCount < 2) { np[n.id] = KINDS.STORY; storyCount++ }
      else if (mancheteCount < 4) { np[n.id] = KINDS.MANCHETE; mancheteCount++ }
      else np[n.id] = KINDS.NONE
    }
    setPicks(np)
  }

  const limparTudo = () => setPicks({})

  const gerarPreview = async () => {
    setMsg(''); setErro('')
    if (selecionadas.total === 0) { setErro('Selecione ao menos 1 notícia'); return }
    setBusyPreview(true)
    try {
      const r = await fetch('/api/newsletter/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          assunto, headline, intro: intro.split(/\n\n+/), moodLine, edicaoNumber,
          stories: selecionadas.stories,
          manchetes: selecionadas.manchetes,
        }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha ao gerar preview'); return }
      setPreviewHtml(j.html || '')
    } catch (e) {
      setErro('Erro de conexão ao gerar preview')
    } finally {
      setBusyPreview(false)
    }
  }

  const copiarHtml = async () => {
    if (!previewHtml) { setErro('Gere o preview primeiro'); return }
    try {
      await navigator.clipboard.writeText(previewHtml)
      setMsg('HTML copiado.')
    } catch {
      setErro('Não consegui copiar. Use o botão Baixar.')
    }
  }

  const baixarHtml = () => {
    if (!previewHtml) { setErro('Gere o preview primeiro'); return }
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `axicon-daily-${edicaoNumber}-${new Date().toISOString().slice(0,10)}.html`
    a.click()
    setMsg('Download iniciado.')
  }

  const enviarTeste = async () => {
    setMsg(''); setErro('')
    if (!destEmail) { setErro('Digite um email para o teste'); return }
    if (selecionadas.total === 0) { setErro('Selecione ao menos 1 notícia'); return }
    setBusySend(true)
    try {
      const r = await fetch('/api/newsletter/teste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          destinatario: destEmail,
          assunto, headline, intro: intro.split(/\n\n+/), moodLine, edicaoNumber,
          stories: selecionadas.stories,
          manchetes: selecionadas.manchetes,
        }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha no envio'); return }
      setMsg(`Email enviado para ${destEmail}. Confira sua caixa (e o spam).`)
    } catch (e) {
      setErro('Erro de conexão ao enviar')
    } finally {
      setBusySend(false)
    }
  }

  const enviarParaTodos = async () => {
    setMsg(''); setErro('')
    if (selecionadas.total === 0) { setErro('Selecione ao menos 1 notícia'); return }
    if (!contagemAtivos || contagemAtivos === 0) { setErro('Não há assinantes ativos. Cadastre em /curadoria/assinantes'); return }

    // Dupla confirmação para evitar disparo acidental
    const c1 = confirm(`ENVIO EM LOTE\n\nEdição #${edicaoNumber} será enviada para ${contagemAtivos} assinantes ativos.\n\nVocê fez o teste antes? Clique OK só se sim.`)
    if (!c1) return
    const c2 = prompt(`Para confirmar, digite a palavra ENVIAR (em maiúsculas):`)
    if (c2 !== 'ENVIAR') { setMsg('Envio cancelado.'); return }

    setBusyBroadcast(true)
    try {
      const r = await fetch('/api/newsletter/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          assunto, headline, intro: intro.split(/\n\n+/), moodLine, edicaoNumber,
          stories: selecionadas.stories,
          manchetes: selecionadas.manchetes,
        }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha no envio em lote'); return }
      setMsg(`Edição #${edicaoNumber} enviada · ${j.enviados} entregues · ${j.falhas} falhas.`)
    } catch (e) {
      setErro('Erro de conexão ao enviar em lote')
    } finally {
      setBusyBroadcast(false)
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
          <div style={{ fontSize: 18, fontFamily: FT, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Newsletter</div>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, fontFamily: SN }}>Este módulo é restrito a administradores.</p>
          <a href="/" style={{ display: 'inline-block', marginTop: 18, fontSize: 12, color: NAVY, textDecoration: 'none', border: `1px solid ${NAVY}40`, padding: '8px 18px', borderRadius: 20, fontFamily: SN, letterSpacing: 1 }}>← Voltar</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SN }}>
      <header style={{ background: NAVY, padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={LOGO_FULL} alt="Áxicon" style={{ height: 44, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(1)' }} />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase' }}>Áxicon Daily News · composer</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/curadoria/email-custom" style={linkChrome}>📧 E-mail Custom</a>
          <a href="/curadoria/historico" style={linkChrome}>📚 Histórico</a>
          <a href="/curadoria" style={linkChrome}>← Curadoria</a>
          <a href="/" style={linkChrome}>← Intranet</a>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 60px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Coluna ESQUERDA: composição */}
        <section>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>EDIÇÃO</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', fontFamily: FT }}>Compor newsletter</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Selecione notícias publicadas, escreva a abertura e visualize antes de enviar.</div>
          </div>

          {msg && <Alert kind="ok">{msg}</Alert>}
          {erro && <Alert kind="erro">{erro}</Alert>}

          {/* Campos editoriais */}
          <div style={panel}>
            <Field label="ASSUNTO DO EMAIL"   value={assunto} onChange={setAssunto} placeholder="bom dia. — edição #..." />
            <Field label="NÚMERO DA EDIÇÃO" value={edicaoNumber} onChange={v => setEdicaoNumber(Number(v) || 1)} type="number" />
            <Field label="FRASE DE HUMOR" value={moodLine} onChange={setMoodLine} placeholder="fora do eixo" />
            <Field label="MANCHETE DO DIA"  value={headline} onChange={setHeadline} placeholder="manchete principal (suporta <em>...</em>)" />
            <Field label="ABERTURA" value={intro} onChange={setIntro} textarea rows={6} placeholder="Parágrafos separados por linha em branco" />
          </div>

          {/* Seleção de notícias */}
          <div style={{ ...panel, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: NAVY, letterSpacing: 2, fontWeight: 700 }}>NOTÍCIAS DISPONÍVEIS</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                  {publicadas.length} aprovadas · <strong>{selecionadas.total}</strong> selecionadas
                  {selecionadas.total > 0 && (
                    <span style={{ color: '#888' }}> ({selecionadas.stories.length} pautas longas + {selecionadas.manchetes.length} manchetes)</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btnGhost} onClick={aplicarSugestao} disabled={!publicadas.length}>Aplicar sugestão</button>
                <button style={btnGhost} onClick={limparTudo} disabled={selecionadas.total === 0}>Limpar</button>
              </div>
            </div>

            {publicadas.length === 0 ? (
              <div style={empty}>Nenhuma notícia publicada ainda. Acesse <a href="/curadoria" style={{ color: NAVY }}>/curadoria</a> para aprovar as primeiras.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {publicadas.map(n => {
                  const k = picks[n.id] || KINDS.NONE
                  return (
                    <div key={n.id} style={itemRow(k !== KINDS.NONE)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                          {n.fonte && <span style={badge(NAVY)}>{n.fonte}</span>}
                          {n.tag && <span style={badge(BRONZE, '#fff')}>{n.tag}</span>}
                          {n.analise && <span style={{ fontSize: 10, color: '#5a9', fontWeight: 600 }}>✓ análise</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', fontFamily: FT, lineHeight: 1.3 }}>{n.titulo}</div>
                        {n.resumo && <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.resumo}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                        <Pill active={k === KINDS.NONE}     color="#888"   onClick={() => setKind(n.id, KINDS.NONE)}     >✗</Pill>
                        <Pill active={k === KINDS.MANCHETE} color={GOLD}   onClick={() => setKind(n.id, KINDS.MANCHETE)} title="Mini-nota">Manchete</Pill>
                        <Pill active={k === KINDS.STORY}    color={NAVY}   onClick={() => setKind(n.id, KINDS.STORY)}    title="Pauta longa">Pauta</Pill>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Coluna DIREITA: preview + ações */}
        <section style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
          <div style={panel}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <button style={{ ...btnPrimary, flex: 1, minWidth: 140 }} onClick={gerarPreview} disabled={busyPreview || selecionadas.total === 0}>
                {busyPreview ? 'Gerando...' : '↻ Atualizar preview'}
              </button>
              <button style={btnGhost} onClick={copiarHtml} disabled={!previewHtml}>📋 Copiar HTML</button>
              <button style={btnGhost} onClick={baixarHtml} disabled={!previewHtml}>⬇ Baixar .html</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="email"
                value={destEmail}
                onChange={e => setDestEmail(e.target.value)}
                placeholder="email para teste"
                style={input}
              />
              <button style={{ ...btnPrimary, background: BRONZE, whiteSpace: 'nowrap' }} onClick={enviarTeste} disabled={busySend || !destEmail || selecionadas.total === 0}>
                {busySend ? 'Enviando...' : '✉ Enviar teste'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <button
                style={{
                  ...btnPrimary,
                  background: '#8E2A1F',
                  flex: 1,
                  fontSize: 13,
                  opacity: (!contagemAtivos || busyBroadcast || selecionadas.total === 0) ? 0.5 : 1,
                }}
                onClick={enviarParaTodos}
                disabled={busyBroadcast || !contagemAtivos || selecionadas.total === 0}
                title={contagemAtivos ? `Envia para ${contagemAtivos} assinantes ativos` : 'Nenhum assinante ativo cadastrado'}>
                {busyBroadcast ? 'Disparando...' : `📤 Enviar para todos (${contagemAtivos ?? '...'})`}
              </button>
              <a href="/curadoria/assinantes" style={{ ...btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>👥 Gerenciar lista</a>
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Preview · ~640px (largura de email)</div>
            <div style={previewWrap}>
              {previewHtml ? (
                <iframe
                  ref={iframeRef}
                  title="Preview da newsletter"
                  srcDoc={previewHtml}
                  style={{ width: '100%', height: '100%', border: 0, borderRadius: 6, background: '#FAF6EE' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: 13, padding: 24, textAlign: 'center' }}>
                  Selecione as notícias e clique em "Atualizar preview" para ver como vai chegar no email.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

// ── componentes auxiliares ─────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', textarea, rows = 3, placeholder }) {
  const common = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px',
    border: '1.5px solid #ddd', borderRadius: 8,
    fontSize: 13, fontFamily: SN, outline: 'none',
    background: '#fafaf8',
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} style={{ ...common, resize: 'vertical', lineHeight: 1.5 }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={common} />
      }
    </div>
  )
}

function Pill({ active, color, onClick, children, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '6px 10px', borderRadius: 6,
        border: `1.5px solid ${active ? color : '#ddd'}`,
        background: active ? color : 'white',
        color: active ? '#fff' : color,
        fontFamily: SN, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}>{children}</button>
  )
}

function Alert({ kind, children }) {
  const ok = kind === 'ok'
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 8, marginBottom: 12,
      background: ok ? '#e8f5e9' : '#fde8e8',
      border: `1px solid ${ok ? '#4caf5040' : '#f4433640'}`,
      color: ok ? '#1b5e20' : '#c62828',
      fontSize: 13,
    }}>{children}</div>
  )
}

// ── styles ─────────────────────────────────────────────────────────────
const center = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, padding: 24 }
const panel = { background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }
const empty = { background: '#fafaf8', borderRadius: 8, padding: '32px 16px', textAlign: 'center', color: '#888', fontSize: 13, border: '1px dashed #ddd' }
const input = { flex: 1, padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: SN, outline: 'none', background: '#fafaf8', minWidth: 0 }
const previewWrap = { width: '100%', height: '70vh', minHeight: 500, background: '#ECE8DE', borderRadius: 8, overflow: 'hidden' }
const linkChrome = { fontSize: 12, color: GOLD, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 20 }
const badge = (bg, fg = '#fff') => ({ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: bg, color: fg, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' })
const btnBase = { padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: SN, transition: 'all .15s', border: 'none' }
const btnPrimary = { ...btnBase, background: NAVY, color: '#fff' }
const btnGhost   = { ...btnBase, background: 'white', color: NAVY, border: `1.5px solid ${NAVY}40` }
const itemRow = (selected) => ({
  display: 'flex', alignItems: 'flex-start', padding: '10px 12px',
  border: `1.5px solid ${selected ? NAVY + '40' : '#eee'}`,
  background: selected ? NAVY + '06' : '#fafaf8',
  borderRadius: 8,
})
