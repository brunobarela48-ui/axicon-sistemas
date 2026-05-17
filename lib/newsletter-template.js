/*
  Renderer da Áxicon Daily News como HTML email-safe.

  Email-safe = tabelas, inline styles, sem flexbox/grid/JS. Tem que
  renderizar em Gmail web/mobile, Apple Mail, Outlook (até o desktop).
  Fontes via Google Fonts no <head>; fallback Georgia para clients
  que ignoram webfont em email (Outlook desktop).

  Baseado no design entregue por Claude Design (newslatter bundle).
  Visual: editorial bronze sobre cream, Cormorant Garamond italic
  nos headlines, mistura de pautas longas + mini-notas estilo the news.
*/

const SITE_BASE = 'https://www.axiconsolucoes.com'

// Paleta extraída de assets/colors_and_type.css
const C = {
  paper:      '#FAF6EE',
  paper2:     '#F7EFE3',
  ink:        '#0E0A07',
  ink2:       '#2A1F18',
  ink3:       '#7A6E64',
  line:       'rgba(14,10,7,0.10)',
  lineStrong: 'rgba(14,10,7,0.18)',
  accent:     '#B87333',  // bronze
  accentDeep: '#713F2A',
  accentSoft: '#ECD9C0',
}

const FONT_SERIF = "'Cormorant Garamond', 'EB Garamond', Garamond, Georgia, serif"
const FONT_SANS  = "'Inter', 'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif"

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

// Permite negrito leve no body: <b>texto</b>. Tudo mais é escapado.
function escAllowB(s) {
  return esc(s).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')
}

function dayLabelPtBR(date = new Date()) {
  const dias = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`
}

function tag(t) {
  return t ? `<span style="font-family:${FONT_SANS};font-size:10px;font-weight:600;color:${C.accentDeep};letter-spacing:1.5px;text-transform:uppercase">${esc(t)}</span>` : ''
}

// ── BLOCOS ───────────────────────────────────────────────────────────────

function blockMasthead({ moodLine, dayLabel, edicaoNumber }) {
  return `
  <tr><td style="padding:36px 36px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:0 0 8px;font-family:${FONT_SANS};font-size:11px;color:${C.ink3};letter-spacing:0.18em;text-transform:uppercase">
          edição #${esc(edicaoNumber)}
          <a href="#" style="float:right;color:${C.accentDeep};text-decoration:none">Leia online</a>
        </td>
      </tr>
      <tr>
        <td style="border-top:1px solid ${C.line};padding:24px 0 8px;text-align:center">
          <img src="${SITE_BASE}/assets/monogram-bronze.svg" width="44" height="34" alt="Áxicon" style="display:block;margin:0 auto 12px"/>
          <div style="font-family:'The Seasons','Cinzel',Georgia,serif;font-size:24px;font-weight:500;color:${C.ink};letter-spacing:6px;text-transform:uppercase">ÁXICON</div>
          <div style="font-family:${FONT_SERIF};font-size:14px;font-style:italic;color:${C.ink2};margin-top:2px">Daily News</div>
          ${moodLine ? `<p style="margin:18px 0 0;font-family:${FONT_SERIF};font-size:18px;font-style:italic;color:${C.accentDeep}">${esc(moodLine)}</p>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding:18px 0 0;text-align:center;font-family:${FONT_SANS};font-size:11px;color:${C.ink3};letter-spacing:0.14em;text-transform:uppercase">
          ${esc(dayLabel)}
        </td>
      </tr>
    </table>
  </td></tr>`
}

function blockHero({ headline, intro }) {
  const introHtml = (intro || []).map(p => `<p style="margin:0 0 14px;font-family:${FONT_SANS};font-size:16px;line-height:1.65;color:${C.ink}">${escAllowB(p)}</p>`).join('')
  return `
  <tr><td style="padding:36px 36px 0">
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;font-weight:500;color:${C.accent};letter-spacing:0.32em;text-transform:uppercase">Hoje</p>
    <h1 style="margin:0 0 24px;font-family:${FONT_SERIF};font-size:36px;font-weight:500;font-style:italic;line-height:1.12;color:${C.ink};letter-spacing:-0.012em">
      ${escAllowB(headline).replace(/&lt;em&gt;/g,'<em style="color:'+C.accentDeep+'">').replace(/&lt;\/em&gt;/g,'</em>')}
    </h1>
    ${introHtml}
  </td></tr>`
}

function blockCover({ image, credit }) {
  if (!image) return ''
  return `
  <tr><td style="padding:28px 36px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td>
        <img src="${esc(image)}" alt="" width="568" style="display:block;width:100%;max-width:568px;height:auto;border-radius:4px"/>
        ${credit ? `<p style="margin:6px 0 0;font-family:${FONT_SANS};font-size:10px;color:${C.ink3};letter-spacing:0.06em;text-align:right">Imagem: ${esc(credit)}</p>` : ''}
      </td></tr>
    </table>
  </td></tr>`
}

function blockIndex(items) {
  if (!items?.length) return ''
  const lis = items.map((it, i) => {
    const num = String(i + 1).padStart(2, '0')
    return `
      <tr><td style="padding:14px 0;border-top:1px solid ${C.line}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="48" valign="top" style="font-family:${FONT_SERIF};font-size:18px;font-style:italic;color:${C.accent};letter-spacing:0.1em;padding-top:2px">${num}</td>
          <td valign="top" style="font-family:${FONT_SANS};font-size:15px;line-height:1.5;color:${C.ink2}">
            ${esc(it.text)}
          </td>
        </tr></table>
      </td></tr>`
  }).join('')
  return `
  <tr><td style="padding:36px 36px 0">
    <p style="margin:0 0 18px;font-family:${FONT_SANS};font-size:11px;font-weight:500;color:${C.accent};letter-spacing:0.32em;text-transform:uppercase">Na edição de hoje</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${lis}</table>
  </td></tr>`
}

function blockManchetes({ kicker, title, notes }) {
  if (!notes?.length) return ''
  const lis = notes.map(n => `
    <tr><td style="padding:18px 0;border-top:1px solid ${C.line}">
      <p style="margin:0 0 6px;font-family:${FONT_SANS};font-size:15px;font-weight:600;color:${C.ink};line-height:1.4">${esc(n.title)}</p>
      <p style="margin:0;font-family:${FONT_SANS};font-size:14px;line-height:1.62;color:${C.ink2}">${escAllowB(n.body)}${n.link ? ` <a href="${esc(n.link)}" style="color:${C.accentDeep};text-decoration:underline">ler na fonte →</a>` : ''}</p>
    </td></tr>`).join('')
  return `
  <tr><td style="padding:48px 36px 0">
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;font-weight:500;color:${C.accent};letter-spacing:0.32em;text-transform:uppercase">${esc(kicker || 'Manchetes')}</p>
    <h2 style="margin:0 0 14px;font-family:${FONT_SERIF};font-size:28px;font-weight:500;line-height:1.14;color:${C.ink}">${esc(title || 'As principais notícias de hoje')}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${lis}</table>
  </td></tr>`
}

function blockStory(story) {
  const bodyParas = (story.body || []).map(p => `<p style="margin:0 0 14px;font-family:${FONT_SANS};font-size:16px;line-height:1.65;color:${C.ink}">${escAllowB(p)}</p>`).join('')
  return `
  <tr><td style="padding:48px 36px 0">
    <p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:11px;font-weight:500;color:${C.accent};letter-spacing:0.32em;text-transform:uppercase">${esc(story.eyebrow || '')}</p>
    <h2 style="margin:0 0 18px;font-family:${FONT_SERIF};font-size:30px;font-weight:500;line-height:1.12;color:${C.ink};letter-spacing:-0.012em">
      ${escAllowB(story.title).replace(/&lt;em&gt;/g,'<em style="color:'+C.accentDeep+'">').replace(/&lt;\/em&gt;/g,'</em>')}
    </h2>
    ${story.image ? `
    <img src="${esc(story.image)}" alt="" width="568" style="display:block;width:100%;max-width:568px;height:auto;border-radius:4px;margin:0 0 18px"/>
    ${story.imageCredit ? `<p style="margin:-12px 0 18px;font-family:${FONT_SANS};font-size:10px;color:${C.ink3};letter-spacing:0.06em;text-align:right">Imagem: ${esc(story.imageCredit)}</p>` : ''}
    ` : ''}
    ${story.lead ? `<p style="margin:0 0 18px;font-family:${FONT_SERIF};font-size:20px;font-style:italic;line-height:1.5;color:${C.accentDeep}">${esc(story.lead)}</p>` : ''}
    ${bodyParas}
    ${story.link ? `<p style="margin:18px 0 0"><a href="${esc(story.link)}" style="font-family:${FONT_SANS};font-size:12px;font-weight:600;color:${C.accentDeep};text-decoration:none;letter-spacing:0.18em;text-transform:uppercase;border-bottom:1px solid ${C.accent};padding-bottom:2px">Ler na fonte →</a></p>` : ''}
  </td></tr>`
}

function blockQuemSomos() {
  return `
  <tr><td style="padding:64px 36px 0;background:${C.paper2}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="text-align:center;padding:32px 0 20px">
        <img src="${SITE_BASE}/assets/monogram-bronze.svg" width="36" alt="Áxicon" style="display:block;margin:0 auto 10px"/>
        <div style="font-family:'The Seasons','Cinzel',Georgia,serif;font-size:18px;color:${C.ink};letter-spacing:5px;text-transform:uppercase">ÁXICON</div>
        <div style="font-family:${FONT_SERIF};font-size:12px;font-style:italic;color:${C.ink3};margin-top:2px">Soluções Financeiras</div>
      </td></tr>
      <tr><td>
        <h4 style="margin:0 0 14px;font-family:${FONT_SERIF};font-size:22px;font-style:italic;font-weight:400;line-height:1.3;color:${C.ink};text-align:center">
          Inteligência financeira não deveria ter um endereço fixo.
        </h4>
        <p style="margin:0 0 12px;font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:${C.ink2};text-align:center;max-width:480px;margin-left:auto;margin-right:auto">
          A <b>Áxicon Daily News</b> é a curadoria editorial da Áxicon Soluções Financeiras &mdash; mercado de capitais, crédito estruturado, agro e M&amp;A brasileiro, sem ruído.
        </p>
        <p style="margin:0 0 32px;font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:${C.ink3};text-align:center">
          Direto na sua caixa de entrada. É gratuito.
        </p>
      </td></tr>
    </table>
  </td></tr>`
}

function blockFooter() {
  return `
  <tr><td style="padding:32px 36px 40px;background:${C.paper2};border-top:1px solid ${C.line};text-align:center">
    <p style="margin:0 0 10px;font-family:${FONT_SANS};font-size:11px;color:${C.ink3};line-height:1.6">© 2026 Áxicon Soluções Financeiras · Av. Brasil, 4035 · Maringá-PR · 87013-000</p>
    <p style="margin:0 0 10px;font-family:${FONT_SANS};font-size:11px;color:${C.ink3}">
      <a href="${SITE_BASE}/noticias.html" style="color:${C.accentDeep};text-decoration:none">arquivo de edições</a>
      &nbsp;·&nbsp;
      <a href="mailto:contato@axicon.com.br" style="color:${C.accentDeep};text-decoration:none">fale conosco</a>
      &nbsp;·&nbsp;
      <a href="%unsubscribe%" style="color:${C.accentDeep};text-decoration:none">descadastrar</a>
    </p>
    <p style="margin:8px 0 0;font-family:${FONT_SANS};font-size:10px;color:${C.ink3};opacity:0.7">${SITE_BASE.replace('https://','')} · (44) 9.9114-7236 · @axicon.solucoes</p>
  </td></tr>`
}

// ── ENTRYPOINT ───────────────────────────────────────────────────────────

/**
 * @param {Object} input
 * @param {string} input.assunto       — assunto do email (usado também como preheader fallback)
 * @param {string} input.headline      — manchete do dia, aceita <em>...</em>
 * @param {string[]} input.intro       — parágrafos de abertura (1 a 3)
 * @param {string} [input.moodLine]    — frase de humor sob o lockup (italic)
 * @param {number|string} input.edicaoNumber
 * @param {string} [input.dayLabel]    — "Sábado, 16 de maio de 2026" (default: hoje)
 * @param {string} [input.coverImage]  — URL da imagem de cover
 * @param {string} [input.coverCredit]
 * @param {Object} [input.manchetes]   — { kicker, title, notes: [{title, body, link}] }
 * @param {Object[]} [input.stories]   — [{ eyebrow, title, image, imageCredit, lead, body: [p1,p2,...], link }]
 * @returns {{ html: string, text: string }}
 */
export function renderNewsletter(input) {
  const {
    assunto, headline, intro = [], moodLine,
    edicaoNumber, dayLabel = dayLabelPtBR(),
    coverImage, coverCredit,
    manchetes, stories = [],
  } = input

  // Index automático: gera lista a partir das stories + manchete agregada
  const indexItems = []
  if (manchetes?.notes?.length) {
    indexItems.push({ text: `${manchetes.kicker || 'Manchetes'} · ${manchetes.notes.length} notas curtas` })
  }
  stories.forEach(s => indexItems.push({ text: s.eyebrow ? `${s.eyebrow} · ${stripHtml(s.title)}` : stripHtml(s.title) }))

  const blocks = [
    blockMasthead({ moodLine, dayLabel, edicaoNumber }),
    blockHero({ headline, intro }),
    blockCover({ image: coverImage, credit: coverCredit }),
    blockIndex(indexItems),
    manchetes ? blockManchetes(manchetes) : '',
    ...stories.map(blockStory),
    blockQuemSomos(),
    blockFooter(),
  ].filter(Boolean).join('')

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta http-equiv="x-ua-compatible" content="ie=edge"/>
<title>${esc(assunto || 'Áxicon Daily News')}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap');
  body{margin:0;padding:0;background:#ECE8DE;}
  a{color:${C.accentDeep};}
  img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
  table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
  /* preheader (oculto no corpo, visível no preview do client) */
  .preheader{display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;}
  @media (max-width: 640px) {
    .nw-shell{width:100% !important;}
    .nw-pad{padding-left:20px !important;padding-right:20px !important;}
  }
</style>
</head>
<body>
<span class="preheader">${esc((intro && intro[0]) || assunto || '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ECE8DE">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" class="nw-shell" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:640px;background:${C.paper};box-shadow:0 1px 2px rgba(74,40,24,.06),0 24px 60px -28px rgba(74,40,24,.22)">
      ${blocks}
    </table>
  </td></tr>
</table>
</body>
</html>`

  // Versão texto (para email clients que não renderizam HTML / para preview)
  const text = renderText({ headline, intro, manchetes, stories, edicaoNumber, dayLabel })

  return { html, text }
}

function renderText({ headline, intro, manchetes, stories, edicaoNumber, dayLabel }) {
  const lines = []
  lines.push(`ÁXICON DAILY NEWS · edição #${edicaoNumber} · ${dayLabel}`)
  lines.push('')
  lines.push(stripHtml(headline))
  lines.push('')
  ;(intro || []).forEach(p => { lines.push(stripHtml(p)); lines.push('') })
  if (manchetes?.notes?.length) {
    lines.push('── ' + (manchetes.kicker || 'Manchetes').toUpperCase() + ' ──')
    lines.push('')
    manchetes.notes.forEach(n => {
      lines.push(stripHtml(n.title))
      lines.push(stripHtml(n.body))
      if (n.link) lines.push(`  Ler: ${n.link}`)
      lines.push('')
    })
  }
  ;(stories || []).forEach(s => {
    lines.push('── ' + (s.eyebrow || '').toUpperCase() + ' ──')
    lines.push(stripHtml(s.title))
    lines.push('')
    if (s.lead) { lines.push(stripHtml(s.lead)); lines.push('') }
    ;(s.body || []).forEach(p => { lines.push(stripHtml(p)); lines.push('') })
    if (s.link) { lines.push(`Ler na fonte: ${s.link}`); lines.push('') }
  })
  lines.push('—')
  lines.push('Áxicon Soluções Financeiras · Maringá-PR · www.axiconsolucoes.com')
  lines.push('Descadastrar: %unsubscribe%')
  return lines.join('\n')
}

function stripHtml(s) {
  return String(s ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

export { dayLabelPtBR }
