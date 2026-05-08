export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { system, messages, max_tokens = 1000 } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'Parâmetros inválidos' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens, system, messages }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Erro na API Anthropic' })

    const text = (data.content || []).map(b => b.text || '').join('\n')
    return res.status(200).json({ text })
  } catch {
    return res.status(500).json({ error: 'Erro de conexão com a API' })
  }
}
