import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'

// GET /api/curadoria/publicadas
// Lista notícias publicadas (aprovadas) com TODOS os campos (id, analise, etc.)
// para uso no newsletter composer. Admin only.

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  // Janela padrão: últimos 30 dias (parametrizável via ?dias=N)
  const dias = Math.max(1, Math.min(365, parseInt(req.query.dias, 10) || 30))
  const desde = new Date(Date.now() - dias * 86400000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('noticias_publicadas')
    .select('*')
    .gte('publicado_em', desde)
    .order('publicado_em', { ascending: false })
    .limit(200)

  if (error) return res.status(500).json({ error: error.message, itens: [] })
  return res.status(200).json({ itens: data || [] })
}
