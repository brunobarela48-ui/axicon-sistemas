/*
  Site público (www.axiconsolucoes.com) — lê notícias aprovadas pela
  curadoria editorial em /api/noticias (Supabase). Aprovações feitas em
  intranet.axiconsolucoes.com/curadoria aparecem aqui em até ~1 minuto.

  Renderiza em dois modos, conforme os containers presentes na página:
    Modo "Notícias" (página /noticias.html):
      #news-featured (card hero) + #news-grid (lista) + #news-filters (botões) + #news-status (estado vazio/erro)
    Modo "Home" (página /home.html):
      #home-news-grid → 1 card grande + 2 pequenos com as 3 mais recentes
      #news-upd (opcional) → atualiza com timestamp da mais recente
*/
(function () {
  const $featured     = document.getElementById('news-featured')
  const $grid         = document.getElementById('news-grid')
  const $filters      = document.getElementById('news-filters')
  const $status       = document.getElementById('news-status')
  const $homeGrid     = document.getElementById('home-news-grid')
  const $homeUpdated  = document.getElementById('news-upd')

  // Se nenhum container conhecido existir, este script não tem nada a fazer.
  if (!$grid && !$homeGrid) return

  const state = { items: [], filter: 'todas' }

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
  }

  function formatDate(s) {
    if (!s) return ''
    const d = new Date(s)
    if (isNaN(d)) return esc(s)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return 'Hoje · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    const yest = new Date(now); yest.setDate(yest.getDate() - 1)
    if (d.toDateString() === yest.toDateString()) return 'Ontem'
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays > 0 && diffDays < 8) return diffDays + ' dias'
    return d.toLocaleDateString('pt-BR')
  }

  function setStatus(html) { if ($status) $status.innerHTML = html }
  function clearStatus()   { if ($status) $status.innerHTML = '' }

  function imgStyleFor(item, fallback) {
    return item.imagem
      ? `style="background-image: url('${esc(item.imagem)}')"`
      : 'style="background: ' + fallback + ';"'
  }

  // ── Notícias page renderers ────────────────────────────────────────────
  function renderFeatured(item) {
    if (!$featured) return
    if (!item) { $featured.innerHTML = ''; return }
    const imgStyle = imgStyleFor(item, 'linear-gradient(135deg, var(--c-bg-dark) 0%, var(--c-primary) 100%)')
    $featured.innerHTML =
      '<a href="' + esc(item.link) + '" class="featured-story" target="_blank" rel="noopener">' +
        '<div class="featured-story-img-wrap">' +
          '<div class="featured-story-img" ' + imgStyle + '></div>' +
          '<div class="featured-story-badges">' +
            '<span class="news-badge news-badge-featured">Em destaque</span>' +
            (item.tag ? '<span class="news-badge">' + esc(item.tag) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="featured-story-content">' +
          '<div>' +
            '<div class="featured-story-meta">' + formatDate(item.data || item.publicado_em) + ' · ' + esc(item.fonte || '') + '</div>' +
            '<h2>' + esc(item.titulo) + '</h2>' +
            '<p>' + esc(item.resumo || '') + '</p>' +
          '</div>' +
          '<div class="featured-story-foot">' +
            '<span>Ler na fonte →</span>' +
            '<span>' + esc(item.fonte || '') + '</span>' +
          '</div>' +
        '</div>' +
      '</a>'
  }

  function renderSmallCard(item) {
    const imgStyle = imgStyleFor(item, 'linear-gradient(135deg, var(--c-cream-2) 0%, rgba(204, 166, 127, 0.18) 100%)')
    return (
      '<a href="' + esc(item.link) + '" class="news-card small" target="_blank" rel="noopener">' +
        '<div class="news-img-wrap small">' +
          '<div class="news-img" ' + imgStyle + '></div>' +
          (item.tag ? '<div class="news-badges"><span class="news-badge">' + esc(item.tag) + '</span></div>' : '') +
        '</div>' +
        '<div class="news-meta">' + formatDate(item.data || item.publicado_em) + ' · ' + esc(item.fonte || '') + '</div>' +
        '<h3>' + esc(item.titulo) + '</h3>' +
        '<p>' + esc(item.resumo || '') + '</p>' +
        '<div class="news-card-foot">Ler na fonte →</div>' +
      '</a>'
    )
  }

  function renderLargeCard(item) {
    const imgStyle = imgStyleFor(item, 'linear-gradient(135deg, var(--c-bg-dark) 0%, var(--c-primary) 100%)')
    return (
      '<a href="' + esc(item.link) + '" class="news-card large" target="_blank" rel="noopener">' +
        '<div class="news-img-wrap large">' +
          '<div class="news-img" ' + imgStyle + '></div>' +
          '<div class="news-badges">' +
            (item.destaque ? '<span class="news-badge news-badge-featured">Em destaque</span>' : '') +
            (item.tag ? '<span class="news-badge">' + esc(item.tag) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="news-meta">' + formatDate(item.data || item.publicado_em) + ' · ' + esc(item.fonte || '') + '</div>' +
        '<h3>' + esc(item.titulo) + '</h3>' +
        '<p>' + esc(item.resumo || '') + '</p>' +
        '<div class="news-card-foot">Ler na fonte →</div>' +
      '</a>'
    )
  }

  function renderNoticiasPage() {
    if (!$grid) return
    const filter = state.filter
    const visible = filter === 'todas'
      ? state.items.slice()
      : state.items.filter(i => (i.tag || '').toLowerCase() === filter.toLowerCase())

    const featured = visible.find(i => i.destaque) || visible[0] || null
    const grid = visible.filter(i => i !== featured)

    renderFeatured(featured)
    $grid.innerHTML = grid.map(renderSmallCard).join('')

    if (!visible.length) {
      setStatus('<p class="news-empty">Nenhuma notícia ' + (filter === 'todas' ? 'publicada' : 'nesta categoria') + ' no momento.</p>')
    } else {
      clearStatus()
    }
  }

  // ── Home renderer ──────────────────────────────────────────────────────
  // 3 cards: 1 grande (destaque ou mais recente) + 2 pequenos. Se houver
  // menos de 3 notícias aprovadas, mostra só o que tem.
  function renderHomePage() {
    if (!$homeGrid) return
    if (!state.items.length) {
      $homeGrid.innerHTML = '<p class="news-empty" style="grid-column: 1 / -1;">Curadoria editorial em andamento — as primeiras notícias publicadas aparecem aqui em breve.</p>'
      if ($homeUpdated) $homeUpdated.textContent = 'Curadoria diária 06h · 12h · 15h'
      return
    }
    const featured = state.items.find(i => i.destaque) || state.items[0]
    const others = state.items.filter(i => i !== featured).slice(0, 2)
    let html = renderLargeCard(featured)
    html += others.map(renderSmallCard).join('')
    $homeGrid.innerHTML = html
    if ($homeUpdated) {
      $homeUpdated.textContent = 'Atualizado ' + formatDate(featured.publicado_em || featured.data).toLowerCase()
    }
  }

  function bindFilters() {
    if (!$filters) return
    $filters.addEventListener('click', e => {
      const btn = e.target.closest('.news-filter')
      if (!btn) return
      $filters.querySelectorAll('.news-filter').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.filter = btn.dataset.filter || 'todas'
      renderNoticiasPage()
    })
  }

  async function load() {
    try {
      const res = await fetch('/api/noticias', { cache: 'no-store' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      state.items = (data.noticias || []).filter(i => i.titulo && i.link)
      bindFilters()
      renderNoticiasPage()
      renderHomePage()
    } catch (e) {
      console.error('[news] erro ao carregar', e)
      setStatus('<p class="news-empty">Não foi possível carregar a curadoria agora. Recarregue em instantes.</p>')
      if ($homeGrid) {
        $homeGrid.innerHTML = '<p class="news-empty" style="grid-column: 1 / -1;">Não foi possível carregar as notícias agora.</p>'
      }
    }
  }

  load()
})()
