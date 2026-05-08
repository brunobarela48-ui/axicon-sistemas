import { supabase } from '../../lib/supabase'

async function getUser(token) {
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: u } = await supabase.from('usuarios').select('role,ativo').eq('id', user.id).single()
  return u?.ativo ? { ...user, role: u.role } : null
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  // GET — qualquer usuário autenticado pode ler
  if (req.method === 'GET') {
    const user = await getUser(token)
    if (!user) return res.status(401).json({ error: 'Token inválido', comunicados: [] })
    const { data, error } = await supabase
      .from('comunicados')
      .select('*')
      .eq('ativo', true)
      .order('ordem')
      .order('criado_em', { ascending: false })
    if (error) return res.status(200).json({ comunicados: [] }) // tabela pode não existir ainda
    return res.json({ comunicados: data || [] })
  }

  // Escrita — apenas admin
  const user = await getUser(token)
  if (!user) return res.status(401).json({ error: 'Token inválido' })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Apenas admins podem editar' })

  if (req.method === 'POST') {
    const { tipo, titulo, corpo, cor, icone, progresso, meta_label, ordem } = req.body
    const { data, error } = await supabase
      .from('comunicados')
      .insert({
        tipo, titulo,
        corpo: corpo || null,
        cor: cor || '#001489',
        icone: icone || '📌',
        progresso: progresso ?? 0,
        meta_label: meta_label || null,
        ordem: ordem ?? 0,
        ativo: true,
        criado_por: user.email,
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ comunicado: data })
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id obrigatório' })
    const { data, error } = await supabase
      .from('comunicados')
      .update(updates)
      .eq('id', id)
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ comunicado: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id obrigatório' })
    await supabase.from('comunicados').update({ ativo: false }).eq('id', id)
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
