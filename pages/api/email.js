import { supabase } from '../../lib/supabase'
import { sendEmail, sendBulk, brevoAccount } from '../../lib/brevo'

async function getUser(token) {
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: u } = await supabase.from('usuarios').select('role,ativo,nome').eq('id', user.id).single()
  return u?.ativo ? { ...user, role: u.role, nome: u.nome } : null
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = await getUser(token)
  if (!user) return res.status(401).json({ error: 'Token inválido' })

  // GET — health-check: confirma que a API key e o domínio estão ativos no Brevo
  if (req.method === 'GET') {
    try {
      const acc = await brevoAccount()
      return res.json({
        ok: true,
        conta: acc.email,
        empresa: acc.companyName,
        plano: acc.plan,
      })
    } catch (e) {
      return res.status(502).json({ ok: false, error: e.message })
    }
  }

  if (req.method === 'POST') {
    const { to, subject, html, text, replyTo, tags, bulk } = req.body || {}
    if (!to || !subject)         return res.status(400).json({ error: 'to e subject são obrigatórios' })
    if (!html && !text)          return res.status(400).json({ error: 'Informe html ou text' })

    // replyTo padrão = o assessor que disparou, pra respostas caírem nele
    const reply = replyTo || (user.email ? { email: user.email, name: user.nome || undefined } : undefined)

    try {
      if (bulk || Array.isArray(to) && to.length > 1) {
        const r = await sendBulk(to, { subject, html, text, replyTo: reply, tags })
        return res.json(r)
      }
      const r = await sendEmail({ to, subject, html, text, replyTo: reply, tags })
      return res.json({ enviados: 1, falhas: 0, messageId: r.messageId })
    } catch (e) {
      return res.status(502).json({ error: e.message })
    }
  }

  res.status(405).json({ error: 'Método não permitido' })
}
