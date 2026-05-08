import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email obrigatório' })

    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('destinatario_email', email)
      .order('criado_em', { ascending: false })
      .limit(50)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ notificacoes: data || [] })
  }

  if (req.method === 'POST') {
    const { destinatario_email, remetente_nome, mensagem, contexto } = req.body
    if (!destinatario_email || !mensagem) return res.status(400).json({ error: 'campos obrigatórios' })

    const { error } = await supabase.from('notificacoes').insert({
      destinatario_email,
      remetente_nome: remetente_nome || 'Sistema',
      mensagem,
      contexto: contexto || null,
      lida: false,
      criado_em: new Date().toISOString(),
    })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'PATCH') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id obrigatório' })

    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
