import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { getAdminUser } from '../../../../lib/auth'

// GET /api/newsletter/envios/<id>
// Retorna detalhe completo de uma edição arquivada (com html_snapshot).
// Admin only.

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id obrigatório' })

  const { data, error } = await supabaseAdmin
    .from('newsletter_envios')
    .select('id, tipo, edicao_numero, assunto, iniciado_em, finalizado_em, total_enviados, total_falhas, payload_json, html_snapshot, text_snapshot')
    .eq('id', id)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Edição não encontrada' })

  return res.status(200).json(data)
}
