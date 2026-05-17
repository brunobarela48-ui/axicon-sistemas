import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getAdminUser } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const user = await getAdminUser(req)
  if (!user) return res.status(403).json({ error: 'Acesso restrito a administradores' })

  const { id, destaque } = req.body || {}
  if (!id) return res.status(400).json({ error: 'id obrigatório' })

  const { data: pend, error: errFetch } = await supabaseAdmin
    .from('noticias_pendentes')
    .select('*')
    .eq('id', id)
    .single()
  if (errFetch || !pend) return res.status(404).json({ error: 'Pendente não encontrado' })
  if (pend.status !== 'pendente') return res.status(409).json({ error: 'Item já decidido' })

  // Promove para publicadas
  const { error: errIns } = await supabaseAdmin
    .from('noticias_publicadas')
    .insert({
      pendente_id: pend.id,
      titulo: pend.titulo,
      resumo: pend.resumo,
      analise: pend.analise,
      tempo_leitura: pend.tempo_leitura,
      fonte: pend.fonte,
      link: pend.link,
      data: pend.data || pend.criado_em,
      tag: pend.tag,
      imagem: pend.imagem,
      destaque: !!destaque,
      publicado_por: user.id
    })
  if (errIns) return res.status(500).json({ error: errIns.message })

  // Atualiza status do pendente
  await supabaseAdmin
    .from('noticias_pendentes')
    .update({ status: 'aprovado', decidido_em: new Date().toISOString(), decidido_por: user.id })
    .eq('id', id)

  return res.status(200).json({ ok: true })
}
