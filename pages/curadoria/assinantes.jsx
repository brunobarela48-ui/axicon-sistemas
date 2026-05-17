import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const LOGO_FULL = 'https://2_c5bat1pokohkuoehdainw25lalyo3oo5l4eq_py6a.canva-cdn.email/66b7eeec7cda66fffe0b25b4e86fe48f.png'

const NAVY  = '#001489'
const GOLD  = '#CCA67F'
const BRONZE = '#B87333'
const BG    = '#EEF0F8'
const FT    = "'The Seasons','Georgia',serif"
const SN    = "'Montserrat','Helvetica Neue',sans-serif"

export default function AssinantesNewsletter() {
  const [session, setSession]   = useState(null)
  const [role, setRole]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [assinantes, setAssinantes] = useState([])
  const [stats, setStats]       = useState({ total: 0, ativos: 0 })
  const [filter, setFilter]     = useState('ativos')   // ativos | todos | inativos
  const [busca, setBusca]       = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [csvText, setCsvText]   = useState('')
  const [busy, setBusy]         = useState(false)
  const [msg, setMsg]           = useState('')
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
    setErro('')
    try {
      const r = await fetch('/api/newsletter/assinantes', { headers: { authorization: `Bearer ${session.access_token}` } })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha ao carregar'); return }
      setAssinantes(j.itens || [])
      setStats({ total: j.total, ativos: j.ativos })
    } catch {
      setErro('Falha de conexão')
    }
  }, [session])

  useEffect(() => { if (role === 'admin') carregar() }, [role, carregar])

  const adicionar = async (e) => {
    e?.preventDefault?.()
    if (!novoEmail) { setErro('Digite um email'); return }
    setBusy(true); setMsg(''); setErro('')
    try {
      const r = await fetch('/api/newsletter/assinantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: novoEmail, nome: novoNome }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha ao adicionar'); return }
      setMsg(j.reativado ? `${novoEmail} reativado.` : `${novoEmail} adicionado.`)
      setNovoEmail(''); setNovoNome('')
      carregar()
    } finally { setBusy(false) }
  }

  const remover = async (id, email) => {
    if (!confirm(`Remover ${email} da lista?`)) return
    setMsg(''); setErro('')
    try {
      const r = await fetch(`/api/newsletter/assinantes?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${session.access_token}` },
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha ao remover'); return }
      setMsg(`${email} removido.`)
      carregar()
    } catch {
      setErro('Falha de conexão')
    }
  }

  const importarCsv = async () => {
    if (!csvText.trim()) { setErro('Cole emails (1 por linha ou CSV)'); return }
    setBusy(true); setMsg(''); setErro('')
    try {
      const r = await fetch('/api/newsletter/assinantes-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ csv: csvText, fonte: 'csv' }),
      })
      const j = await r.json()
      if (!r.ok) { setErro(j?.error || 'Falha na importação'); return }
      setMsg(`Importação: ${j.inseridos} novos · ${j.reativados} reativados · ${j.jaAtivos} já estavam ativos.`)
      setCsvText('')
      carregar()
    } finally { setBusy(false) }
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

  const visiveis = assinantes.filter(a => {
    if (filter === 'ativos' && !a.ativo) return false
    if (filter === 'inativos' && a.ativo) return false
    if (busca && !`${a.email} ${a.nome || ''}`.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: SN }}>
      <header style={{ background: NAVY, padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img src={LOGO_FULL} alt="Áxicon" style={{ height: 44, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(1)' }} />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: 3, textTransform: 'uppercase' }}>Newsletter · Assinantes</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/curadoria/newsletter" style={linkChrome}>← Composer</a>
          <a href="/" style={linkChrome}>← Intranet</a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>LISTA DA NEWSLETTER</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', fontFamily: FT }}>
              {stats.ativos} ativo{stats.ativos !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{stats.total} cadastrados no total · cap atual de envio: 100 por edição</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="buscar por email ou nome..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ ...input, width: 220 }}
            />
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...input, width: 130 }}>
              <option value="ativos">Ativos</option>
              <option value="todos">Todos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>

        {msg && <Alert kind="ok">{msg}</Alert>}
        {erro && <Alert kind="erro">{erro}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
          {/* Adicionar individual */}
          <form onSubmit={adicionar} style={panel}>
            <div style={{ fontSize: 11, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>ADICIONAR INDIVIDUAL</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="email" placeholder="email@dominio.com" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} style={{ ...input, flex: 1 }} required />
              <input type="text" placeholder="nome (opcional)" value={novoNome} onChange={e => setNovoNome(e.target.value)} style={{ ...input, flex: 1 }} />
            </div>
            <button type="submit" disabled={busy || !novoEmail} style={btnPrimary}>+ Adicionar</button>
          </form>
          {/* Importar CSV */}
          <div style={panel}>
            <div style={{ fontSize: 11, color: NAVY, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>IMPORTAR EM LOTE</div>
            <textarea
              placeholder="cole emails (1 por linha) ou CSV: email,nome"
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={3}
              style={{ ...input, width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            />
            <button onClick={importarCsv} disabled={busy || !csvText.trim()} style={{ ...btnPrimary, marginTop: 8 }}>↑ Importar</button>
          </div>
        </div>

        {/* Lista */}
        <div style={panel}>
          {visiveis.length === 0 ? (
            <div style={empty}>
              {assinantes.length === 0
                ? 'Nenhum assinante ainda. Adicione o primeiro acima.'
                : 'Nenhum assinante bate com filtros / busca.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                  <th style={th}>Email</th>
                  <th style={th}>Nome</th>
                  <th style={th}>Status</th>
                  <th style={th}>Fonte</th>
                  <th style={th}>Cadastro</th>
                  <th style={{ ...th, textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f4f4f4' }}>
                    <td style={td}>{a.email}</td>
                    <td style={td}>{a.nome || <span style={{ color: '#bbb' }}>—</span>}</td>
                    <td style={td}>
                      {a.ativo
                        ? <span style={pillOk}>ATIVO</span>
                        : <span style={pillOff}>INATIVO</span>}
                    </td>
                    <td style={{ ...td, color: '#888' }}>{a.fonte || '—'}</td>
                    <td style={{ ...td, color: '#888', fontSize: 12 }}>{fmtDate(a.criado_em)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {a.ativo && (
                        <button onClick={() => remover(a.id, a.email)} style={btnDanger}>✗ Remover</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
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

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d) ? iso : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const center = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, padding: 24 }
const panel = { background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }
const empty = { padding: '40px 16px', textAlign: 'center', color: '#888', fontSize: 13 }
const input = { padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: SN, outline: 'none', background: '#fafaf8', minWidth: 0 }
const linkChrome = { fontSize: 12, color: GOLD, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 20 }
const btnBase = { padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: SN, border: 'none' }
const btnPrimary = { ...btnBase, background: NAVY, color: '#fff' }
const btnDanger = { ...btnBase, background: 'white', color: '#c62828', border: '1.5px solid #f4433640', padding: '6px 10px', fontSize: 11 }
const th = { padding: '8px 10px', fontSize: 11, color: NAVY, letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase' }
const td = { padding: '10px 10px', color: '#1a1a1a' }
const pillOk = { fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#4caf50', color: '#fff', fontWeight: 600, letterSpacing: 0.5 }
const pillOff = { fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#bbb', color: '#fff', fontWeight: 600, letterSpacing: 0.5 }
