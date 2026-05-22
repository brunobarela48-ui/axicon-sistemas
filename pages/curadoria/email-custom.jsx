import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

const LOGO_FULL = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png'

const NAVY  = '#001489'
const GOLD  = '#CCA67F'
const BRONZE = '#B87333'
const BG    = '#EEF0F8'
const FT    = "'The Seasons','Georgia',serif"
const SN    = "'Montserrat','Helvetica Neue',sans-serif"

const TEMPLATE_INICIAL = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Áxicon</title>
</head>
<body style="margin:0;padding:0;background:#EEF0F8;font-family:Georgia,serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#EEF0F8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:32px;color:#1a1a1a;line-height:1.6;font-size:15px;">

              <h1 style="font-family:Georgia,serif;font-size:24px;color:#001489;margin:0 0 16px;">
                Olá,
              </h1>

              <p>
                Escreva aqui o conteúdo do seu e-mail. Pode editar tudo —
                este é só um esqueleto inicial seguro pra a maioria dos
                clientes de e-mail.
              </p>

              <p style="margin-top:24px;">
                Atenciosamente,<br>
                <strong style="color:#B87333;">Áxicon Soluções Financeiras</strong>
              </p>

            </td>
          </tr>
          <tr>
            <td style="background:#1a1a1a;padding:20px 32px;color:#aaa;font-size:11px;text-align:center;">
              © Áxicon Soluções Financeiras<br>
              <a href="%unsubscribe%" style="color:#aaa;text-decoration:underline;">Descadastrar</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

export default function EmailCustomComposer() {
  const [session, setSession]   = useState(null)
  const [role, setRole]         = useState(null)
  const [loading, setLoading]   = useState(true)

  const [assunto, setAssunto]   = useState('')
  const [rotulo, setRotulo]     = useState('')
  const [html, setHtml]         = useState(TEMPLATE_INICIAL)

  const [modo, setModo]         = useState('assinantes')  // 'assinantes' | 'lista'
  const [listaTexto, setListaTexto] = useState('')

  const [destTeste, setDestTeste] = useState('')
  const [contagemAtivos, setContagemAtivos] = useState(null)

  const [busyTeste, setBusyTeste] = useState(false)
  const [busySend, setBusySend]   = useState(false)
  const [msg, setMsg]   = useState('')
  const [erro, setErro] = useState('')

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (!session) { setLoading(false); return }
      try {
        const r = await fetch('/api/auth', { headers: { authorization: `Bearer ${session.access_token}` } })
        const j = await r.json()
        setRole(j?.user?.role || null)
        if (j?.user?.email) setDestTeste(j.user.email)
      } catch {}
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Contagem de assinantes
  useEffect(() => {
    if (role !== 'admin' || !session) return
    fetch('/api/newsletter/assinantes', { headers: { authorization: `Bearer ${session.access_token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) setContagemAtivos(j.ativos ?? 0) })
      .catch(() => {})
  }, [role, session])

  // Parse da lista colada
  const listaParseada = useMemo(() => {
    if (modo !== 'lista') return []
    return Array.from(new Set(
      listaTexto
        .split(/[\s,;\n]+/)
        .map(s => s.trim().toLowerCase())
        .filter(s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s))
    ))
  }, [modo, listaTexto])

  const totalDestino = modo === 'assinantes' ? (contagemAtivos ?? 0) : listaParseada.length

  const enviarTeste = async () => {
    setMsg(''); setErro('')
    if (!assunto) { setErro('Digite um assunto'); return }
    if (!html || html.length < 20) { setErro('HTML muito curto'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destTeste)) { setErro('E-mail de teste inválido'); return }
    setBusyTeste(true)
    try {
      const r = await fetch('/api/newsletter/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ modo: 'teste', assunto, html, destinatarios: [destTeste] }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha no envio'); return }
      setMsg(`Teste enviado para ${destTeste}. Confira a caixa (e o spam).`)
    } catch (e) {
      setErro('Erro de conexão: ' + e.message)
    } finally { setBusyTeste(false) }
  }

  const disparar = async () => {
    setMsg(''); setErro('')
    if (!assunto) { setErro('Digite um assunto'); return }
    if (!html || html.length < 20) { setErro('HTML muito curto'); return }
    if (modo === 'assinantes' && !contagemAtivos) { setErro('Não há assinantes ativos. Cadastre em /curadoria/assinantes'); return }
    if (modo === 'lista' && listaParseada.length === 0) { setErro('Cole pelo menos um e-mail válido na lista'); return }

    const c1 = confirm(
      `ENVIO EM LOTE\n\n` +
      `Assunto: ${assunto}\n` +
      `Destino: ${modo === 'assinantes' ? `${contagemAtivos} assinantes ativos` : `${listaParseada.length} e-mails colados`}\n\n` +
      `Você fez um teste antes? Clique OK só se sim.`
    )
    if (!c1) return
    const c2 = prompt('Para confirmar, digite ENVIAR (em maiúsculas):')
    if (c2 !== 'ENVIAR') { setMsg('Envio cancelado.'); return }

    setBusySend(true)
    try {
      const r = await fetch('/api/newsletter/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          modo, assunto, html, rotulo,
          destinatarios: modo === 'lista' ? listaParseada : [],
        }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha no envio em lote'); return }
      setMsg(`✓ Disparo concluído · ${j.enviados} entregues · ${j.falhas || 0} falhas. Veja em /curadoria/historico.`)
    } catch (e) {
      setErro('Erro de conexão: ' + e.message)
    } finally { setBusySend(false) }
  }

  if (loading) return <div style={center}><div style={{ color: NAVY, fontSize: 14, fontFamily: SN }}>Verificando acesso...</div></div>
  if (!session) { if (typeof window !== 'undefined') window.location.href = '/'; return null }
  if (role !== 'admin') {
    return (
      <div style={center}>
        <div style={{ background: 'white', borderRadius: 14, padding: '32px 36px', maxWidth: 480, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize: 11, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>ACESSO RESTRITO</div>
          <div style={{ fontSize: 18, fontFamily: FT, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>E-mail Custom</div>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, fontFamily: SN }}>Este módulo é restrito a administradores.</p>
          <a href="/" style={{ display: 'inline-block', marginTop: 18, fontSize: 12, color: NAVY, textDecoration: 'none', border: `1px solid ${NAVY}40`, padding: '8px 18px', borderRadius: 20, fontFamily: SN, letterSpacing: 1 }}>← Voltar</a>
        </div>
      </div>
    )
  }

  const podeEnviar = !!assunto && html.length >= 20 && totalDestino > 0

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SN }}>
      <header style={{ background: NAVY, padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={LOGO_FULL} alt="Áxicon" style={{ height: 44, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(1)' }} />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase' }}>E-mail Custom · HTML composer</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/curadoria/historico" style={linkChrome}>📚 Histórico</a>
          <a href="/curadoria/newsletter" style={linkChrome}>← Newsletter</a>
          <a href="/" style={linkChrome}>← Intranet</a>
        </div>
      </header>

      <main style={{ maxWidth: 1500, margin: '0 auto', padding: '28px 24px 60px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Coluna ESQUERDA: composição */}
        <section>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>DISPARO AVULSO</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', fontFamily: FT }}>Compor e-mail custom</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Cole o HTML, escolha o destino, dispare via Brevo. Arquiva automaticamente no histórico.</div>
          </div>

          {msg && <Alert kind="ok">{msg}</Alert>}
          {erro && <Alert kind="erro">{erro}</Alert>}

          <div style={panel}>
            <Field label="ASSUNTO" value={assunto} onChange={setAssunto} placeholder="Ex: Newsletter de boas-vindas — Áxicon" />
            <Field label="RÓTULO (interno, p/ histórico)" value={rotulo} onChange={setRotulo} placeholder="Ex: Boas-vindas dez/2026" />

            <div style={{ marginTop: 4, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>HTML DO E-MAIL</div>
              <textarea
                value={html}
                onChange={e => setHtml(e.target.value)}
                rows={22}
                spellCheck={false}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 14px',
                  border: '1.5px solid #ddd', borderRadius: 8,
                  fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  outline: 'none', background: '#fafaf8',
                  lineHeight: 1.5, resize: 'vertical',
                }}
              />
              <div style={{ fontSize: 11, color: '#888', marginTop: 6, lineHeight: 1.5 }}>
                {html.length.toLocaleString('pt-BR')} caracteres ·
                {' '}Tokens reconhecidos: <code style={code}>%unsubscribe%</code> (substituído pelo link único de cada assinante, quando o destino for "Assinantes ativos").
              </div>
            </div>

            <div style={{ marginTop: 14, padding: 12, background: '#FAF6EE', borderRadius: 8, border: '1px solid #CCA67F40' }}>
              <div style={{ fontSize: 11, color: NAVY, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>DICAS PARA HTML DE E-MAIL</div>
              <ul style={{ fontSize: 12, color: '#444', margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                <li>Use <strong>tabelas</strong> em vez de flex/grid (Outlook não renderiza).</li>
                <li>Estilos <strong>inline</strong> (<code style={code}>style="..."</code>), não <code style={code}>&lt;style&gt;</code>.</li>
                <li>Largura máxima recomendada: <strong>600px</strong>.</li>
                <li>Inclua <code style={code}>%unsubscribe%</code> para envios à base de assinantes (LGPD).</li>
              </ul>
            </div>
          </div>

          {/* Destinatário */}
          <div style={{ ...panel, marginTop: 16 }}>
            <div style={{ fontSize: 11, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>DESTINATÁRIOS</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <ModoBtn active={modo === 'assinantes'} onClick={() => setModo('assinantes')}>
                📋 Lista de assinantes <span style={{ opacity: 0.75 }}>({contagemAtivos ?? '...'})</span>
              </ModoBtn>
              <ModoBtn active={modo === 'lista'} onClick={() => setModo('lista')}>
                📝 Lista colada {modo === 'lista' && <span style={{ opacity: 0.75 }}>({listaParseada.length})</span>}
              </ModoBtn>
            </div>

            {modo === 'lista' ? (
              <div>
                <textarea
                  value={listaTexto}
                  onChange={e => setListaTexto(e.target.value)}
                  rows={6}
                  placeholder={'cole emails separados por vírgula, espaço ou linha\nex:\nfulano@empresa.com\nbeltrano@empresa.com'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px',
                    border: '1.5px solid #ddd', borderRadius: 8,
                    fontSize: 13, fontFamily: SN,
                    outline: 'none', background: '#fafaf8',
                    lineHeight: 1.5, resize: 'vertical',
                  }}
                />
                <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                  {listaParseada.length} e-mail{listaParseada.length === 1 ? '' : 's'} válido{listaParseada.length === 1 ? '' : 's'}.
                  {' '}Máx. 100 por envio.
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                Vai disparar para <strong>{contagemAtivos ?? '...'}</strong> assinantes em <code style={code}>newsletter_assinantes.ativo = true</code>.
                {' '}Gerencia em <a href="/curadoria/assinantes" style={{ color: NAVY }}>/curadoria/assinantes</a>.
              </div>
            )}
          </div>
        </section>

        {/* Coluna DIREITA: preview + ações */}
        <section style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
          <div style={panel}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <input
                type="email"
                value={destTeste}
                onChange={e => setDestTeste(e.target.value)}
                placeholder="email para teste"
                style={input}
              />
              <button style={{ ...btnPrimary, background: BRONZE, whiteSpace: 'nowrap' }} onClick={enviarTeste} disabled={busyTeste || !destTeste || !assunto}>
                {busyTeste ? 'Enviando...' : '✉ Enviar teste'}
              </button>
            </div>

            <button
              style={{
                ...btnPrimary,
                background: '#8E2A1F',
                width: '100%',
                padding: '12px 14px',
                fontSize: 13,
                opacity: (busySend || !podeEnviar) ? 0.5 : 1,
                marginBottom: 14,
              }}
              onClick={disparar}
              disabled={busySend || !podeEnviar}
            >
              {busySend
                ? 'Disparando...'
                : `📤 Disparar para ${totalDestino} ${modo === 'assinantes' ? 'assinantes' : 'destinatários'}`}
            </button>

            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Preview · ~640px (largura de email)</div>
            <div style={previewWrap}>
              <iframe
                title="Preview do e-mail custom"
                srcDoc={html}
                sandbox="allow-same-origin"
                style={{ width: '100%', height: '100%', border: 0, borderRadius: 6, background: '#fff' }}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px',
          border: '1.5px solid #ddd', borderRadius: 8,
          fontSize: 13, fontFamily: SN, outline: 'none',
          background: '#fafaf8',
        }}
      />
    </div>
  )
}

function ModoBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
        border: `1.5px solid ${active ? NAVY : '#ddd'}`,
        background: active ? NAVY : 'white',
        color: active ? '#fff' : NAVY,
        fontFamily: SN, fontSize: 12, fontWeight: 600,
        flex: 1,
      }}
    >{children}</button>
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

const center = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, padding: 24 }
const panel = { background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }
const input = { flex: 1, padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: SN, outline: 'none', background: '#fafaf8', minWidth: 0 }
const previewWrap = { width: '100%', height: '70vh', minHeight: 500, background: '#ECE8DE', borderRadius: 8, overflow: 'hidden' }
const linkChrome = { fontSize: 12, color: GOLD, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 20 }
const btnBase = { padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: SN, transition: 'all .15s', border: 'none' }
const btnPrimary = { ...btnBase, background: NAVY, color: '#fff' }
const code = { background: '#fff', padding: '1px 6px', borderRadius: 4, fontSize: 11, color: '#1a1a1a', border: '1px solid #ddd', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }
