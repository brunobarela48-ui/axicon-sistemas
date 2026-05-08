import { supabaseAdmin as supabase } from '../../lib/supabase-admin'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('crm_data')
      .select('dados')
      .eq('empresa_id', 'axicon')
      .single()

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
    return res.status(200).json({ dados: data?.dados || null })
  }

  if (req.method === 'POST') {
    const { dados } = req.body
    if (!dados) return res.status(400).json({ error: 'dados obrigatório' })

    const { error } = await supabase
      .from('crm_data')
      .upsert(
        { empresa_id: 'axicon', dados, atualizado_em: new Date().toISOString() },
        { onConflict: 'empresa_id' }
      )

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
