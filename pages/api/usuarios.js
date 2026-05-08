import { supabase } from '../../lib/supabase'
import { supabaseAdmin } from '../../lib/supabase-admin'

// Usa supabaseAdmin para ignorar RLS na leitura do role
async function getRole(token) {
  if (!token) return null
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const { data } = await supabaseAdmin
    .from('crm_funcionarios')
    .select('role, ativo')
    .eq('email', user.email)
    .eq('empresa_id', 'axicon')
    .single()
  return data?.role === 'admin' && data?.ativo ? 'admin' : null
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const role  = await getRole(token)
  if (!role) return res.status(403).json({ error: 'Acesso negado. Apenas admins.' })

  // GET — lista todos os usuários
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('crm_funcionarios')
      .select('id, nome, email, role, ativo, tem_acesso, cargo, empresa_id')
      .eq('empresa_id', 'axicon')
      .order('nome')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ usuarios: data })
  }

  // POST — cria ou atualiza acesso de login para um funcionário
  if (req.method === 'POST') {
    const { email, nome, role: novoRole, ativo } = req.body
    if (!email) return res.status(400).json({ error: 'email obrigatório' })

    const { data: existente } = await supabaseAdmin
      .from('crm_funcionarios')
      .select('id')
      .eq('email', email)
      .eq('empresa_id', 'axicon')
      .single()

    if (existente) {
      const { data, error } = await supabaseAdmin
        .from('crm_funcionarios')
        .update({
          role:          novoRole || 'consultor_varejo',
          ativo:         ativo ?? true,
          tem_acesso:    true,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', existente.id)
        .select()
        .single()
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ usuario: data })
    } else {
      const { data, error } = await supabaseAdmin
        .from('crm_funcionarios')
        .insert({
          empresa_id:    'axicon',
          nome:          nome || email,
          email,
          role:          novoRole || 'consultor_varejo',
          ativo:         ativo ?? true,
          tem_acesso:    true,
          salario:       0,
          status:        'ativo',
          atualizado_em: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ usuario: data })
    }
  }

  // PATCH — atualiza role ou status de acesso
  if (req.method === 'PATCH') {
    const { email, role: novoRole, ativo } = req.body
    if (!email) return res.status(400).json({ error: 'email obrigatório' })

    const updates = { atualizado_em: new Date().toISOString() }
    if (novoRole !== undefined) updates.role  = novoRole
    if (ativo   !== undefined) updates.ativo  = ativo

    const { data, error } = await supabaseAdmin
      .from('crm_funcionarios')
      .update(updates)
      .eq('email', email)
      .eq('empresa_id', 'axicon')
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ usuario: data })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
