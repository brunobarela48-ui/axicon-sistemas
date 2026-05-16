import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  const { data, error } = await supabaseAdmin
    .from('noticias_pendentes')
    .select('*')
    .eq('status', 'pendente')
    .order('criado_em', { ascending: false })
    .limit(200)

  if (error) return res.status(500).json({ error: error.message, itens: [] })
  return res.status(200).json({ itens: data || [] })
}
