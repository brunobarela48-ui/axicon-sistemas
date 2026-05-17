import { supabaseAdmin } from '../../../lib/supabase-admin'

// GET /api/newsletter/descadastrar?token=xxxx
// Endpoint público (sem auth): clicado pelo link de descadastro no email.
// Marca o assinante como inativo e renderiza uma página de confirmação.
//
// Liberado no proxy.ts via PUBLIC_API_PATHS.

export const config = { runtime: 'nodejs' }

export default async function handler(req, res) {
  const token = String(req.query?.token || '').trim()
  if (!token || !/^[a-f0-9]{20,64}$/i.test(token)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(400).send(htmlPage('Link inválido', 'O link de descadastro está incompleto ou expirou. Se você quer parar de receber, responda a última edição com a palavra REMOVER.'))
  }

  const { data: assinante, error: errLookup } = await supabaseAdmin
    .from('newsletter_assinantes')
    .select('id, email, ativo, descadastro_em')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  if (errLookup) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(500).send(htmlPage('Erro', 'Não conseguimos processar agora. Tente em alguns minutos.'))
  }
  if (!assinante) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(404).send(htmlPage('Link não reconhecido', 'Esse link de descadastro não corresponde a nenhum assinante.'))
  }

  if (assinante.ativo) {
    await supabaseAdmin
      .from('newsletter_assinantes')
      .update({
        ativo: false,
        descadastro_em: new Date().toISOString(),
        descadastro_motivo: 'unsubscribe via link',
      })
      .eq('id', assinante.id)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  return res.status(200).send(htmlPage(
    'Descadastrado',
    `Confirmado: ${esc(assinante.email)} não vai mais receber a Áxicon Daily News.<br><br>Se foi engano, é só responder ao último email que enviarmos que readicionamos com prazer.`
  ))
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

function htmlPage(titulo, body) {
  return `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)} — Áxicon Daily News</title>
<style>
  body{margin:0;padding:0;background:#FAF6EE;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#0E0A07}
  .wrap{max-width:560px;margin:80px auto;padding:48px 40px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(74,40,24,.08)}
  h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:500;font-style:italic;margin:0 0 18px;color:#713F2A}
  p{font-size:15px;line-height:1.7;color:#2A1F18;margin:0}
  .foot{margin-top:48px;padding-top:24px;border-top:1px solid rgba(14,10,7,.10);font-size:11px;color:#7A6E64;text-align:center;letter-spacing:.04em}
  a{color:#713F2A}
</style></head><body>
<div class="wrap">
  <h1>${esc(titulo)}</h1>
  <p>${body}</p>
  <div class="foot">ÁXICON · Soluções Financeiras · Maringá-PR · <a href="https://www.axiconsolucoes.com">axiconsolucoes.com</a></div>
</div>
</body></html>`
}
