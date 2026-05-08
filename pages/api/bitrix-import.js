export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { webhookUrl, method, params = {}, paginate = false } = req.body

  if (!webhookUrl || !method) {
    return res.status(400).json({ error: 'webhookUrl e method são obrigatórios' })
  }

  let base
  try {
    const u = new URL(webhookUrl)
    const ok = u.hostname.endsWith('bitrix24.com') ||
               u.hostname.endsWith('bitrix24.com.br') ||
               u.hostname.endsWith('bitrix24.net') ||
               u.hostname.endsWith('bitrix24.ru')
    if (!ok) return res.status(400).json({ error: 'URL deve ser de um domínio Bitrix24' })
    base = webhookUrl.endsWith('/') ? webhookUrl : webhookUrl + '/'
  } catch {
    return res.status(400).json({ error: 'URL do webhook inválida' })
  }

  const bxFetch = async (start = undefined) => {
    const body = start !== undefined ? { ...params, start } : params
    const r = await fetch(`${base}${method}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
    const data = await r.json()
    if (data.error) throw new Error(data.error_description || data.error)
    return data
  }

  try {
    if (!paginate) {
      const data = await bxFetch()
      return res.status(200).json(data)
    }

    // Paginated — loop until done (max 1000 records to avoid Vercel timeout)
    const MAX = 1000
    let all = []
    let start = 0
    while (all.length < MAX) {
      const data = await bxFetch(start)
      const items = Array.isArray(data.result) ? data.result : []
      all = all.concat(items)
      if (!data.next || items.length === 0) break
      start = data.next
    }

    return res.status(200).json({ result: all, total: all.length })
  } catch (e) {
    if (e.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Timeout — o Bitrix24 demorou muito para responder' })
    }
    return res.status(500).json({ error: e.message })
  }
}
