import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

// Garante que cada campo personalizado tem uma coluna dedicada nas tabelas de negócios.
// Chamado quando um campo é criado no CRM.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { campo_id } = req.body
  if (!campo_id || typeof campo_id !== 'string' || !campo_id.startsWith('campo_')) {
    return res.status(400).json({ error: 'campo_id inválido' })
  }

  const { error } = await supabase.rpc('crm_add_campo_column', { p_campo_id: campo_id })
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ok: true })
}
