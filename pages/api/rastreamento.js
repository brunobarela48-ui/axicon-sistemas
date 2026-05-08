import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Token necessário' })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return res.status(401).json({ error: 'Token inválido' })

    const { data: userData } = await supabase.from('usuarios').select('role').eq('email', user.email).single()
    if (userData?.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' })

    const { data, error } = await supabase
      .from('rastreamento')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(2000)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ eventos: data || [] })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
