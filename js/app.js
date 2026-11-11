// ==========================================================
// AnimeRush - COMPACT & CLEAN MAIN CONTROLLER (js/app.js)
// ==========================================================

let currentAnimeList = [];
let activeAnimeItem = null;
let selectedLetter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  currentAnimeList = getFullAnimeList();
  renderNavigationMenus();
  renderSidebarWidgets();
  renderAnimeGrid(currentAnimeList);
  if (typeof hydrateDefaultPosters === 'function') hydrateDefaultPosters();

  if (typeof TELEGRAM_CHANNEL_URL !== 'undefined' && TELEGRAM_CHANNEL_URL) {
    document.querySelectorAll('a[href*="t.me"]').forEach(a => a.href = TELEGRAM_CHANNEL_URL);
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-item')) closeAllDropdowns();
  });

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') window.location.href = 'admin.html';
  });
});

// 1. Top Menus & Sidebar
function renderNavigationMenus() {
  const az = document.getElementById('az-letters-bar');
  if (az) {
    const letters = ['ALL', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    az.innerHTML = letters.map(l => `<button class="az-btn ${l === selectedLetter ? 'active' : ''}" onclick="filterByLetter('${l}')">${l}</button>`).join('');
  }
  const gen = document.getElementById('dropdown-genres');
  if (gen) {
    gen.innerHTML = GENRE_LIST.map(g => `<button class="drop-option" onclick="filterByGenre('${g}')"><span>${g}</span><span style="color:#38bdf8;font-size:0.75rem;">View</span></button>`).join('');
  }
}

function renderSidebarWidgets() {
  const recentEl = document.getElementById('recent-posts-list');
  if (recentEl) {
    recentEl.innerHTML = getFullAnimeList().slice(0, 5).map(item => {
      const count = item.episodes?.length || 0;
      const badge = count > 0 ? `<strong style="color:#22c55e;">| EP-${String(count).padStart(2, '0')} Added</strong>` : `<span style="color:#94a3b8;">| Not Uploaded</span>`;
      return `<div class="recent-item" onclick="openStoryPage(${item.id})">${item.title} [Hindi-Eng-Jap] HD ${badge}</div>`;
    }).join('');
  }
  const catEl = document.getElementById('sidebar-categories');
  if (catEl) {
    catEl.innerHTML = SIDEBAR_CATEGORIES.map(c => `<button class="cat-chip" onclick="filterByCategoryTag('${c}')">${c}</button>`).join('');
  }
}

// 2. Main Anime Grid
function renderAnimeGrid(list) {
  const grid = document.getElementById('anime-grid');
  if (!grid) return;
  if (!list?.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;background:var(--bg-card);border-radius:12px;"><h3>⚠️ Anime Not Found</h3></div>`;
    return;
  }

  grid.innerHTML = list.map(item => {
    const fallback = createSvgPoster(item.title, item.accent || '#1e3a8a', 'MULTI AUDIO');
    const poster = (item.poster?.startsWith('http') && !item.poster.includes('...')) ? item.poster : fallback;
    const badges = (item.langs || ['HI', 'EN', 'JP']).map(l => `<span class="lang-badge">${l}</span>`).join('');
    return `
      <article class="anime-card" onclick="openStoryPage(${item.id})">
        <div class="card-badges">${item.isGlobalApi ? '<span class="lang-badge api">API</span>' : ''}${badges}</div>
        <img data-anime-id="${item.id}" src="${poster}" alt="${item.title.replace(/"/g, '&quot;')}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';" />
        <div class="card-overlay"><div class="card-title">${item.title} [Hindi-Eng-Jap] 480p, 720p & 1080p HD</div></div>
      </article>`;
  }).join('');
}

// 3. Filters & Search
function toggleDropdown(id, e) {
  if (e) e.stopPropagation();
  const el = document.getElementById(id);
  const open = el?.classList.contains('open');
  closeAllDropdowns();
  if (!open) el?.classList.add('open');
}
function closeAllDropdowns() { document.querySelectorAll('.dropdown-panel').forEach(el => el.classList.remove('open')); }
function toggleAzDrawer() { closeAllDropdowns(); showHomeView(); document.getElementById('az-drawer')?.classList.toggle('open'); }

function showFilterBanner(label) {
  const b = document.getElementById('filter-banner'), t = document.getElementById('filter-banner-text');
  if (b && t) { t.innerHTML = `Filter: <strong style="color:#38bdf8;">${label}</strong> (${currentAnimeList.length})`; b.classList.add('active'); }
}

function resetAllFilters() {
  selectedLetter = 'ALL';
  currentAnimeList = getFullAnimeList();
  document.getElementById('filter-banner')?.classList.remove('active');
  if (document.getElementById('global-search-input')) document.getElementById('global-search-input').value = '';
  renderNavigationMenus(); showHomeView(); renderAnimeGrid(currentAnimeList);
}

function filterByLetter(l) {
  selectedLetter = l; renderNavigationMenus();
  if (l === 'ALL') return resetAllFilters();
  currentAnimeList = getFullAnimeList().filter(a => {
    const ch = a.title.trim().charAt(0).toUpperCase();
    return l === '#' ? /^[^A-Z]/.test(ch) : ch === l;
  });
  showHomeView(); renderAnimeGrid(currentAnimeList); showFilterBanner(`Letter "${l}"`);
}

function filterByLanguage(code, label) {
  closeAllDropdowns();
  currentAnimeList = code === 'ALL' ? getFullAnimeList() : getFullAnimeList().filter(a => (a.langs || []).includes(code));
  showHomeView(); renderAnimeGrid(currentAnimeList); showFilterBanner(label);
}

function filterByQuality(q, label) {
  closeAllDropdowns();
  currentAnimeList = q === 'ZIP' ? getFullAnimeList() : getFullAnimeList().filter(a => (a.qualities || []).includes(q));
  showHomeView(); renderAnimeGrid(currentAnimeList); showFilterBanner(label);
}

function filterByGenre(genre) {
  closeAllDropdowns();
  currentAnimeList = getFullAnimeList().filter(a => (a.genres || []).some(g => g.toLowerCase() === genre.toLowerCase()));
  if (!currentAnimeList.length) return runGlobalSearch(genre);
  showHomeView(); renderAnimeGrid(currentAnimeList); showFilterBanner(genre);
}

function filterByCategoryTag(cat) {
  if (cat.includes('1080p')) return filterByQuality('1080p', cat);
  if (cat.includes('720p')) return filterByQuality('720p', cat);
  if (cat.includes('480p')) return filterByQuality('480p', cat);
  if (cat.includes('Hindi')) return filterByLanguage('HI', cat);
  filterByGenre(cat);
}

async function runGlobalSearch(qOverride) {
  const q = (qOverride || document.getElementById('global-search-input')?.value || '').trim();
  if (!q) return resetAllFilters();
  showHomeView();
  document.getElementById('anime-grid').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#38bdf8;">🌍 Searching "${q}"...</div>`;
  currentAnimeList = await searchGlobalAnimeApi(q);
  renderAnimeGrid(currentAnimeList);
  if (currentAnimeList.length) showFilterBanner(`Search: "${q}"`);
}

// 4. Story & Trailer Page
function findAnimeById(id) {
  return getAdminSavedAnime().find(a => Number(a.id) === Number(id)) ||
         currentAnimeList.find(a => Number(a.id) === Number(id)) ||
         getFullAnimeList().find(a => Number(a.id) === Number(id)) || currentAnimeList[0];
}

async function openStoryPage(id) {
  activeAnimeItem = findAnimeById(id);
  if (!activeAnimeItem) return;
  hideAllSubViews();
  document.getElementById('story-view').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const fallback = createSvgPoster(activeAnimeItem.title, '#0284c7', 'AnimeRush');
  document.getElementById('story-poster').src = (activeAnimeItem.poster?.startsWith('http')) ? activeAnimeItem.poster : fallback;
  document.getElementById('story-title').textContent = `${activeAnimeItem.title} [Hindi-Eng-Jap] Multi Audio HD`;
  document.getElementById('story-anilist-ref').textContent = `AniList ID #${activeAnimeItem.id}`;
  document.getElementById('story-plot').textContent = activeAnimeItem.synopsis || `Watch and download ${activeAnimeItem.title} in HD.`;

  const box = document.getElementById('story-trailer-box');
  if (box) {
    box.innerHTML = `<p style="color:#38bdf8;font-size:0.84rem;">🎬 Loading trailer...</p>`;
    if (!activeAnimeItem.trailerEmbedUrl) {
      const t = await fetchJikanTrailerForAnime(activeAnimeItem.title);
      if (t?.embedUrl) activeAnimeItem.trailerEmbedUrl = t.embedUrl;
    }
    box.innerHTML = activeAnimeItem.trailerEmbedUrl
      ? `<div style="position:relative;padding-bottom:56.25%;height:0;border-radius:10px;overflow:hidden;"><iframe src="${activeAnimeItem.trailerEmbedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe></div>`
      : `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(activeAnimeItem.title + ' trailer')}" target="_blank" class="btn-primary" style="background:#dc2626;display:inline-block;">▶️ Watch Trailer on YouTube</a>`;
  }
}

// 5. Smart Download Vault (Shows Active vs Not Added Clearly)
function isValidUrl(u) {
  return u && String(u).trim() !== '' && !String(u).startsWith('#') && u !== 'https://drive.google.com/' && !String(u).startsWith('localfile://');
}

function renderBtn(url, label, color) {
  if (isValidUrl(url)) {
    return `<button class="dl-btn ${color}" onclick="startDirectDownload('${String(url).replace(/'/g, "\\'")}')">✅ ${label} [ACTIVE]</button>`;
  }
  return `<button class="dl-btn" disabled style="background:#1e293b;color:#64748b;border:1px dashed #334155;cursor:not-allowed;opacity:0.55;">🚫 ${label} (Not Added)</button>`;
}

function openLinksVault() {
  if (!activeAnimeItem) activeAnimeItem = getFullAnimeList()[0];
  const saved = getAdminSavedAnime().find(a => Number(a.id) === Number(activeAnimeItem.id));
  const episodes = saved?.episodes || activeAnimeItem.episodes || [];
  const zipUrl = saved?.fullZipUrl || activeAnimeItem.fullZipUrl || '';

  hideAllSubViews();
  document.getElementById('vault-view').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('vault-heading').textContent = `${activeAnimeItem.title} – Download`;
  document.getElementById('vault-submeta').textContent = `By AnimeRush Admin • AniList #${activeAnimeItem.id}`;

  const zipBox = document.getElementById('vault-zip-box');
  if (zipBox) {
    zipBox.style.display = isValidUrl(zipUrl) ? 'block' : 'none';
    zipBox.innerHTML = isValidUrl(zipUrl) ? `
      <div class="zip-pack-title"><span>📦 FULL SEASON .ZIP BATCH</span><span style="color:#4ade80;">● ACTIVE</span></div>
      <div class="dl-btn-row">${renderBtn(zipUrl, 'Full Season .ZIP', 'green')}</div>` : '';
  }

  const epList = document.getElementById('vault-episodes-list');
  if (!episodes.length) {
    epList.innerHTML = `<div style="padding:28px;text-align:center;border:1px dashed #ef4444;border-radius:10px;"><h3 style="color:#f87171;">⚠️ Episodes Not Uploaded Yet</h3></div>`;
    return;
  }

  epList.innerHTML = episodes.map((ep, i) => `
    <div class="ep-accordion ${i === 0 ? 'open' : ''}">
      <div class="ep-header" onclick="this.parentElement.classList.toggle('open')">
        <div><span class="ep-badge">EP ${ep.epNumber}</span> <strong>${ep.title || 'Episode ' + ep.epNumber}</strong></div>
        <span>▼</span>
      </div>
      <div class="ep-body">
        ${isValidUrl(ep.directFileUrl) ? `<div class="server-group"><div class="server-label" style="color:#4ade80;">📁 PERSONAL / DIRECT FILE ● ACTIVE</div><div class="dl-btn-row">${renderBtn(ep.directFileUrl, ep.directFileName || 'Direct HD Video', 'purple')}</div></div>` : ''}
        ${renderServerRow('🟢 GOOGLE DRIVE DIRECT', ep.servers?.gdrive)}
        ${renderServerRow('☁️ HUBCLOUD', ep.servers?.hubcloud)}
        ${renderServerRow('⚡ GDFLIX / MEGA / OTHER', ep.servers?.gdflix)}
      </div>
    </div>`).join('');
}

function renderServerRow(title, links = {}) {
  const hasAny = isValidUrl(links?.p480) || isValidUrl(links?.p720) || isValidUrl(links?.p1080);
  if (!hasAny) {
    return `<div class="server-group"><div class="server-label">${title} <span style="color:#64748b;">(Offline)</span></div><span style="color:#64748b;font-size:0.78rem;">❌ Link Not Added</span></div>`;
  }
  return `
    <div class="server-group">
      <div class="server-label">${title} <span style="color:#4ade80;">● ACTIVE</span></div>
      <div class="dl-btn-row">
        ${renderBtn(links.p480, '480p', 'red')}
        ${renderBtn(links.p720, '720p HEVC', 'blue')}
        ${renderBtn(links.p1080, '1080p FHD', 'green')}
      </div>
    </div>`;
}

// 6. Direct Download Trigger (Fixes Mobile Drive App / Snapseed Hijack)
function startDirectDownload(url) {
  let finalUrl = String(url).trim();
  const driveId = finalUrl.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{15,})/)?.[1];
  if (driveId && !finalUrl.includes('/folders/')) {
    finalUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`;
  }
  window.open(finalUrl, '_blank', 'noopener,noreferrer');
}

// 7. Trailers Page
async function openTrailersPage(q = '') {
  closeAllDropdowns(); hideAllSubViews();
  document.getElementById('trailers-view').classList.add('active');
  const grid = document.getElementById('jikan-trailers-grid');
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#fde047;">🎬 Loading Trailers...</div>`;
  const list = await fetchJikanTrailersList(q);
  grid.innerHTML = list.map(item => `
    <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:12px;overflow:hidden;">
      ${item.embedUrl ? `<div style="position:relative;padding-bottom:56.25%;height:0;"><iframe src="${item.embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe></div>` : `<img src="${item.poster}" style="width:100%;height:190px;object-fit:cover;"/>`}
      <div style="padding:12px;">
        <h3 style="font-size:0.95rem;color:#fff;margin-bottom:8px;">${item.title}</h3>
        <button class="btn-primary" style="width:100%;background:#16a34a;" onclick="openAnimeFromTrailer(${item.id}, '${item.title.replace(/'/g, "\\'")}', '${item.poster}', '${item.embedUrl}')">📥 Download Page</button>
      </div>
    </div>`).join('');
}

function searchJikanTrailersPage() { openTrailersPage(document.getElementById('trailer-search-input')?.value.trim()); }
function openAnimeFromTrailer(id, title, poster, embed) {
  if (!findAnimeById(id)) currentAnimeList.unshift(formatApiMediaToAnimeRush(id, title, poster, '', ['Action'], embed));
  openStoryPage(id);
}
function hideAllSubViews() {
  document.getElementById('home-view').style.display = 'none';
  ['story-view', 'vault-view', 'trailers-view'].forEach(id => document.getElementById(id)?.classList.remove('active'));
}
function showHomeView() { hideAllSubViews(); document.getElementById('home-view').style.display = 'grid'; }
function toggleThemeMode() { document.body.classList.toggle('light-mode'); }