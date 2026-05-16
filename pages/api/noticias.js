import { supabaseAdmin } from '../../lib/supabase-admin'

// Endpoint público — consumido pelo public/news.js no site institucional.
// Sem auth: serve a lista de notícias aprovadas pelo curador.
// Cache leve para reduzir hits no DB; aprovações novas aparecem em ~1 min.

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' })

  const { data, error } = await supabaseAdmin
    .from('noticias_publicadas')
    .select('titulo, resumo, fonte, link, data, tag, imagem, destaque, publicado_em')
    .order('destaque', { ascending: false })
    .order('publicado_em', { ascending: false })
    .limit(60)

  if (error) {
    return res.status(500).json({ error: error.message, noticias: [] })
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
  return res.status(200).json({ noticias: data || [] })
}
