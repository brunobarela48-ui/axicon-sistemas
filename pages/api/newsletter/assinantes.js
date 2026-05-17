import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'

// CRUD de assinantes da newsletter. Admin only.
//
// GET  /api/newsletter/assinantes               → lista todos (default últimos 1000)
// POST /api/newsletter/assinantes  {email,nome} → adiciona (upsert por email)
// DELETE /api/newsletter/assinantes?id=uuid     → desativa (soft delete: ativo=false)

function isEmail(s) { return typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) }

export default async function handler(req, res) {
  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('newsletter_assinantes')
      .select('id, email, nome, ativo, fonte, consentimento, descadastro_em, ultimo_envio_em, criado_em')
      .order('criado_em', { ascending: false })
      .limit(1000)
    if (error) return res.status(500).json({ error: error.message, itens: [] })
    const ativos = (data || []).filter(a => a.ativo).length
    return res.status(200).json({ itens: data || [], total: data?.length || 0, ativos })
  }

  if (req.method === 'POST') {
    const { email, nome } = req.body || {}
    if (!isEmail(email)) return res.status(400).json({ error: 'email inválido' })

    const e = email.trim().toLowerCase()
    // Upsert manual: se já existe (mesmo desativado), reativa
    const { data: existing } = await supabaseAdmin
      .from('newsletter_assinantes')
      .select('id, ativo')
      .eq('email', e)
      .maybeSingle()

    if (existing) {
      const { error } = await supabaseAdmin
        .from('newsletter_assinantes')
        .update({
          ativo: true,
          nome: nome || null,
          descadastro_em: null,
          descadastro_motivo: null,
        })
        .eq('id', existing.id)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true, reativado: !existing.ativo })
    }

    const { error } = await supabaseAdmin
      .from('newsletter_assinantes')
      .insert({ email: e, nome: nome || null, fonte: 'manual', criado_por: user.id })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id
    if (!id) return res.status(400).json({ error: 'id obrigatório' })
    const { error } = await supabaseAdmin
      .from('newsletter_assinantes')
      .update({ ativo: false, descadastro_em: new Date().toISOString(), descadastro_motivo: 'removido pelo admin' })
      .eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
