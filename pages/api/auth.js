import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {

  // GET — busca dados do usuário logado pelo token
  if (req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Token não fornecido' })

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Token inválido' })

    // Busca role do usuário na tabela usuarios
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    // Se não existe ainda, cria como consultor
    if (!usuario) {
      const { data: novo } = await supabase
        .from('usuarios')
        .insert({ id: user.id, email: user.email, nome: user.user_metadata?.full_name || user.email, role: 'consultor', ativo: true })
        .select()
        .single()
      return res.status(200).json({ user: { ...user, role: 'consultor', ativo: true, ...novo } })
    }

    if (!usuario.ativo) return res.status(403).json({ error: 'Usuário inativo. Contate o administrador.' })

    return res.status(200).json({ user: { ...user, role: usuario.role, ativo: usuario.ativo, nome: usuario.nome } })
  }

  res.status(405).json({ error: 'Método não permitido' })
}