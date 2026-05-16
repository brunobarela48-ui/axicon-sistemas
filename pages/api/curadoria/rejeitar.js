import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  const { id } = req.body || {}
  if (!id) return res.status(400).json({ error: 'id obrigatório' })

  const { error } = await supabaseAdmin
    .from('noticias_pendentes')
    .update({ status: 'rejeitado', decidido_em: new Date().toISOString(), decidido_por: user.id })
    .eq('id', id)
    .eq('status', 'pendente')

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
