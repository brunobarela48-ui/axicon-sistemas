import { supabase } from '../../lib/supabase'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Upload multipart -> Supabase Storage
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)

    // Extrair boundary e campos do multipart
    const contentType = req.headers['content-type'] || ''
    const boundary = contentType.split('boundary=')[1]
    if (!boundary) return res.status(400).json({ error: 'Boundary ausente' })

    const parts = splitMultipart(body, boundary)
    const filePart = parts.find(p => p.filename)
    const contextoPart = parts.find(p => p.name === 'contexto')
    const idPart = parts.find(p => p.name === 'id')

    if (!filePart) return res.status(400).json({ error: 'Arquivo não enviado' })

    const contexto = contextoPart?.data?.toString() || 'geral'
    const refId = idPart?.data?.toString() || 'sem-id'
    const ext = filePart.filename.split('.').pop()
    const path = `${contexto}/${refId}/${Date.now()}_${filePart.filename}`

    const { data, error } = await supabase.storage
      .from('anexos')
      .upload(path, filePart.data, {
        contentType: filePart.contentType || 'application/octet-stream',
        upsert: false,
      })

    if (error) return res.status(500).json({ error: error.message })

    const { data: urlData } = supabase.storage.from('anexos').getPublicUrl(path)

    return res.status(200).json({
      path,
      url: urlData.publicUrl,
      nome: filePart.filename,
      tipo: filePart.contentType,
      tamanho: filePart.data.length,
    })
  }

  if (req.method === 'DELETE') {
    const { path } = req.query
    if (!path) return res.status(400).json({ error: 'path obrigatório' })
    const { error } = await supabase.storage.from('anexos').remove([path])
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}

function splitMultipart(buffer, boundary) {
  const sep = Buffer.from('--' + boundary)
  const parts = []
  let start = 0

  while (start < buffer.length) {
    const idx = buffer.indexOf(sep, start)
    if (idx === -1) break
    const next = buffer.indexOf(sep, idx + sep.length)
    const end = next === -1 ? buffer.length : next
    const part = buffer.slice(idx + sep.length + 2, end - 2)
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) { start = end; continue }

    const headerStr = part.slice(0, headerEnd).toString()
    const data = part.slice(headerEnd + 4)

    const dispMatch = headerStr.match(/Content-Disposition:[^\r\n]*name="([^"]*)"/)
    const fileMatch = headerStr.match(/filename="([^"]*)"/)
    const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/)

    parts.push({
      name: dispMatch?.[1],
      filename: fileMatch?.[1],
      contentType: ctMatch?.[1]?.trim(),
      data,
    })
    start = end
  }
  return parts
}
