import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { usuario_email, mes, ano } = req.query

    let query = supabase
      .from('agendamentos')
      .select('*')
      .order('inicio', { ascending: true })

    if (usuario_email) {
      query = query.or(`criado_por.eq.${usuario_email},participantes.cs.{${usuario_email}}`)
    }

    if (mes && ano) {
      const inicio = `${ano}-${String(mes).padStart(2,'0')}-01`
      const fimMes = new Date(Number(ano), Number(mes), 0).getDate()
      const fim = `${ano}-${String(mes).padStart(2,'0')}-${fimMes}`
      query = query.gte('inicio', inicio).lte('inicio', fim + 'T23:59:59')
    }

    const { data, error } = await query.limit(500)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ agendamentos: data || [] })
  }

  if (req.method === 'POST') {
    const { titulo, descricao, inicio, fim, tipo, participantes, local, negocio_id, contato_id, criado_por, cor } = req.body
    if (!titulo || !inicio) return res.status(400).json({ error: 'titulo e inicio obrigatórios' })

    const { data, error } = await supabase.from('agendamentos').insert({
      titulo,
      descricao: descricao || null,
      inicio,
      fim: fim || null,
      tipo: tipo || 'reuniao',
      participantes: participantes || [],
      local: local || null,
      negocio_id: negocio_id || null,
      contato_id: contato_id || null,
      criado_por: criado_por || null,
      cor: cor || '#001489',
      criado_em: new Date().toISOString(),
    }).select().single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ agendamento: data })
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body
    if (!id) return res.status(400).json({ error: 'id obrigatório' })
    const { error } = await supabase.from('agendamentos').update(updates).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id obrigatório' })
    const { error } = await supabase.from('agendamentos').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
