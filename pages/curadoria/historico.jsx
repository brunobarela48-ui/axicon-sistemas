import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const LOGO_FULL = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png'

const NAVY  = '#001489'
const GOLD  = '#CCA67F'
const BG    = '#EEF0F8'
const FT    = "'The Seasons','Georgia',serif"
const SN    = "'Montserrat','Helvetica Neue',sans-serif"

export default function HistoricoNewsletter() {
  const [session, setSession]   = useState(null)
  const [role, setRole]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [envios, setEnvios]     = useState([])
  const [sel, setSel]           = useState(null)        // edição selecionada (com html)
  const [busyDetalhe, setBusyDetalhe] = useState(false)
  const [erro, setErro]         = useState('')

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
    try {
      const r = await fetch('/api/newsletter/envios', { headers: { authorization: `Bearer ${session.access_token}` } })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha ao carregar'); return }
      setEnvios(j.itens || [])
    } catch { setErro('Falha de conexão') }
  }, [session])

  useEffect(() => { if (role === 'admin') carregar() }, [role, carregar])

  const abrir = async (envio) => {
    setErro(''); setSel({ ...envio, html_snapshot: null })
    setBusyDetalhe(true)
    try {
      const r = await fetch(`/api/newsletter/envios/${envio.id}`, { headers: { authorization: `Bearer ${session.access_token}` } })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha ao abrir edição'); return }
      setSel(j)
    } catch { setErro('Falha de conexão') }
    finally { setBusyDetalhe(false) }
  }

  const copiarHtml = async () => {
    if (!sel?.html_snapshot) return
    try { await navigator.clipboard.writeText(sel.html_snapshot) } catch {}
  }
  const baixarHtml = () => {
    if (!sel?.html_snapshot) return
    const blob = new Blob([sel.html_snapshot], { type: 'text/html;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const dt = (sel.iniciado_em || '').slice(0,10)
    a.download = `axicon-daily-edicao-${sel.edicao_numero}-${dt}.html`
    a.click()
  }

  if (loading) return <div style={center}><div style={{ color: NAVY, fontSize: 14, fontFamily: SN }}>Verificando acesso...</div></div>
  if (!session) { if (typeof window !== 'undefined') window.location.href = '/'; return null }
  if (role !== 'admin') {
    return (
      <div style={center}>
        <div style={{ background: 'white', borderRadius: 14, padding: '32px 36px', maxWidth: 480, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize: 11, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>ACESSO RESTRITO</div>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>Módulo restrito a administradores.</p>
          <a href="/" style={{ display: 'inline-block', marginTop: 18, fontSize: 12, color: NAVY, textDecoration: 'none', border: `1px solid ${NAVY}40`, padding: '8px 18px', borderRadius: 20 }}>← Voltar</a>
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
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase' }}>Newsletter · Histórico</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/curadoria/newsletter" style={linkChrome}>← Composer</a>
          <a href="/" style={linkChrome}>← Intranet</a>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 60px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 24 }}>
        {/* Coluna esquerda: lista */}
        <section>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>EDIÇÕES ENVIADAS</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', fontFamily: FT }}>Histórico</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{envios.length} {envios.length === 1 ? 'edição' : 'edições'} arquivadas.</div>
          </div>

          {erro && <div style={alertErr}>{erro}</div>}

          {envios.length === 0 ? (
            <div style={empty}>
              Ainda não há edições enviadas. Quando você disparar a primeira em <a href="/curadoria/newsletter" style={{ color: NAVY }}>/curadoria/newsletter</a>, ela aparece aqui.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {envios.map(e => {
                const isCustom = e.tipo === 'custom'
                const titulo = isCustom
                  ? (e.payload_json?.rotulo || 'E-mail custom')
                  : `Edição #${e.edicao_numero}`
                return (
                  <div
                    key={e.id}
                    onClick={() => abrir(e)}
                    style={card(sel?.id === e.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8 }}>
                      <div style={{ fontFamily: FT, fontWeight: 700, fontSize: 14, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={isCustom ? pillCustom : pillDaily}>{isCustom ? '📧 CUSTOM' : '📰 DAILY'}</span>
                        {titulo}
                      </div>
                      <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>{fmtData(e.iniciado_em)}</div>
                    </div>
                    <div style={{ fontSize: 13, color: '#444', marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.assunto}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
                      <span style={pillOk}>{e.total_enviados ?? 0} ENVIADAS</span>
                      {(e.total_falhas ?? 0) > 0 && <span style={pillErr}>{e.total_falhas} FALHAS</span>}
                      {!e.finalizado_em && <span style={pillWarn}>EM ANDAMENTO</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Coluna direita: preview da edição selecionada */}
        <section style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
          <div style={panel}>
            {!sel ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', minHeight: 500, color: '#aaa', fontSize: 13, padding: 24, textAlign: 'center' }}>
                Selecione uma edição na lista para ver a versão arquivada.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
                      {sel.tipo === 'custom'
                        ? `📧 E-MAIL CUSTOM${sel.payload_json?.rotulo ? ' · ' + sel.payload_json.rotulo : ''}`
                        : `EDIÇÃO #${sel.edicao_numero}`}
                    </div>
                    <div style={{ fontFamily: FT, fontWeight: 700, fontSize: 16, color: '#1a1a1a', lineHeight: 1.3 }}>{sel.assunto}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      Enviada em {fmtDataHora(sel.iniciado_em)} · {sel.total_enviados ?? 0} entregue{(sel.total_enviados ?? 0) === 1 ? '' : 's'}
                      {(sel.total_falhas ?? 0) > 0 && <span style={{ color: '#c62828' }}> · {sel.total_falhas} falha{sel.total_falhas === 1 ? '' : 's'}</span>}
                      {sel.tipo === 'custom' && sel.payload_json?.modo && (
                        <span> · modo: {sel.payload_json.modo}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={copiarHtml} disabled={!sel.html_snapshot} style={btnGhost}>📋 Copiar</button>
                    <button onClick={baixarHtml} disabled={!sel.html_snapshot} style={btnGhost}>⬇ Baixar</button>
                  </div>
                </div>

                <div style={previewWrap}>
                  {busyDetalhe ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>Carregando arquivo...</div>
                  ) : sel.html_snapshot ? (
                    <iframe title={`Edição #${sel.edicao_numero}`} srcDoc={sel.html_snapshot} style={{ width: '100%', height: '100%', border: 0, borderRadius: 6, background: '#FAF6EE' }} />
                  ) : (
                    <div style={{ padding: 32, color: '#888', fontSize: 13, textAlign: 'center' }}>
                      Esta edição foi enviada antes da feature de arquivo (snapshot HTML) entrar no ar. Os metadados estão registrados, mas o HTML não foi salvo na época.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function fmtData(iso) {
  if (!iso) return ''
  const d = new Date(iso); if (isNaN(d)) return iso
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function fmtDataHora(iso) {
  if (!iso) return ''
  const d = new Date(iso); if (isNaN(d)) return iso
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const center = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, padding: 24 }
const panel = { background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }
const previewWrap = { width: '100%', height: '70vh', minHeight: 500, background: '#ECE8DE', borderRadius: 8, overflow: 'hidden' }
const empty = { background: 'white', borderRadius: 12, padding: '32px 16px', textAlign: 'center', color: '#888', fontSize: 13, border: '1px dashed #ddd' }
const card = (active) => ({
  background: 'white', borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
  border: `1.5px solid ${active ? NAVY + '60' : 'transparent'}`,
  boxShadow: active ? '0 2px 12px rgba(0,20,137,.12)' : '0 1px 4px rgba(0,0,0,.04)',
  transition: 'all .15s',
})
const linkChrome = { fontSize: 12, color: GOLD, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 20 }
const btnBase = { padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: SN, border: 'none' }
const btnGhost = { ...btnBase, background: 'white', color: NAVY, border: `1.5px solid ${NAVY}40` }
const pillOk = { padding: '2px 8px', borderRadius: 10, background: '#4caf50', color: '#fff', fontWeight: 600, letterSpacing: 0.5 }
const pillErr = { padding: '2px 8px', borderRadius: 10, background: '#c62828', color: '#fff', fontWeight: 600, letterSpacing: 0.5 }
const pillWarn = { padding: '2px 8px', borderRadius: 10, background: '#f9a825', color: '#fff', fontWeight: 600, letterSpacing: 0.5 }
const pillDaily  = { padding: '2px 6px', borderRadius: 6, background: NAVY + '12', color: NAVY, fontWeight: 700, fontSize: 9, letterSpacing: 1 }
const pillCustom = { padding: '2px 6px', borderRadius: 6, background: '#B87333' + '18', color: '#B87333', fontWeight: 700, fontSize: 9, letterSpacing: 1 }
const alertErr = { padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: '#fde8e8', color: '#c62828', fontSize: 12, border: '1px solid #f4433640' }
