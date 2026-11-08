// ==========================================================
// AnimeRush - MAIN UI CONTROLLER, DRIVE FILES & JIKAN TRAILERS
// ==========================================================

let currentAnimeList = [];
let activeAnimeItem = null;
let selectedLetter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  currentAnimeList = getFullAnimeList();
  renderNavigationMenus();
  renderSidebarWidgets();
  renderAnimeGrid(currentAnimeList);
  hydrateDefaultPosters();

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item')) closeAllDropdowns();
  });

  // Press Ctrl + Shift + A on homepage to open admin.html
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      window.location.href = 'admin.html';
    }
  });
});

// 1. Render Top Dropdowns
function renderNavigationMenus() {
  const azContainer = document.getElementById('az-letters-bar');
  if (azContainer) {
    const letters = ['ALL', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    azContainer.innerHTML = letters.map(letter => `
      <button class="az-btn ${letter === selectedLetter ? 'active' : ''}" onclick="filterByLetter('${letter}')">${letter}</button>
    `).join('');
  }

  const genreContainer = document.getElementById('dropdown-genres');
  if (genreContainer) {
    genreContainer.innerHTML = GENRE_LIST.map(genre => `
      <button class="drop-option" onclick="filterByGenre('${genre}')">
        <span>${genre}</span>
        <span style="color:#38bdf8; font-size:0.75rem;">View</span>
      </button>
    `).join('');
  }
}

// 2. Render Sidebar Widgets
function renderSidebarWidgets() {
  const all = getFullAnimeList();
  const recentEl = document.getElementById('recent-posts-list');
  if (recentEl) {
    recentEl.innerHTML = all.slice(0, 5).map(item => {
      const epCount = item.episodes ? item.episodes.length : 0;
      const statusBadge = epCount > 0
        ? `<strong style="color:#22c55e;">| EP-${String(epCount).padStart(2, '0')} Added</strong>`
        : `<span style="color:#94a3b8;">| Not Uploaded</span>`;
      return `
        <div class="recent-item" onclick="openStoryPage(${item.id})">
          ${item.title} [Hindi-Eng-Jap] Multi Audio 480p, 720p & 1080p HD ${statusBadge}
        </div>
      `;
    }).join('');
  }

  const catEl = document.getElementById('sidebar-categories');
  if (catEl) {
    catEl.innerHTML = SIDEBAR_CATEGORIES.map(cat => `
      <button class="cat-chip" onclick="filterByCategoryTag('${cat}')">${cat}</button>
    `).join('');
  }
}

// 3. Render 3-Column Poster Grid
function renderAnimeGrid(list) {
  const grid = document.getElementById('anime-grid');
  if (!grid) return;

  if (!list || list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border);">
        <h3>⚠️ Anime Not Found in Local List</h3>
        <p style="color: var(--text-muted); margin-top: 8px;">Use the Top Global API Search Bar to search any anime worldwide!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(item => {
    const fallbackSvg = createSvgPoster(item.title, item.accent || '#1e3a8a', 'MULTI AUDIO');
    const validPoster = (item.poster && item.poster.startsWith('http') && !item.poster.includes('...'))
      ? item.poster
      : fallbackSvg;

    const badges = (item.langs || ['HI', 'EN', 'JP']).map(l => `<span class="lang-badge">${l}</span>`).join('');
    const apiBadge = item.isGlobalApi ? `<span class="lang-badge api">API</span>` : '';

    return `
      <article class="anime-card" onclick="openStoryPage(${item.id})">
        <div class="card-badges">${apiBadge}${badges}</div>
        <img
          data-anime-id="${item.id}"
          src="${validPoster}"
          alt="${item.title.replace(/"/g, '&quot;')}"
          referrerpolicy="no-referrer"
          loading="lazy"
          onerror="this.onerror=null; this.src='${fallbackSvg}';"
        />
        <div class="card-overlay">
          <div class="card-title">
            ${item.title} [Hindi-Eng-Jap] Multi Audio 480p, 720p & 1080p HD WEB-DL | 10bit HEVC
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// 4. Dropdowns & Filters
function toggleDropdown(menuId, event) {
  if (event) event.stopPropagation();
  const target = document.getElementById(menuId);
  if (!target) return;
  const wasOpen = target.classList.contains('open');
  closeAllDropdowns();
  if (!wasOpen) target.classList.add('open');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-panel').forEach(el => el.classList.remove('open'));
}

function toggleAzDrawer() {
  closeAllDropdowns();
  showHomeView();
  document.getElementById('az-drawer')?.classList.toggle('open');
}

function showFilterBanner(label) {
  const banner = document.getElementById('filter-banner');
  const text = document.getElementById('filter-banner-text');
  if (banner && text) {
    text.innerHTML = `Active Filter: <strong style="color:#38bdf8;">${label}</strong> (${currentAnimeList.length} shows)`;
    banner.classList.add('active');
  }
}

function resetAllFilters() {
  selectedLetter = 'ALL';
  currentAnimeList = getFullAnimeList();
  document.getElementById('filter-banner')?.classList.remove('active');
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) searchInput.value = '';
  renderNavigationMenus();
  showHomeView();
  renderAnimeGrid(currentAnimeList);
}

function filterByLetter(letter) {
  selectedLetter = letter;
  renderNavigationMenus();
  const all = getFullAnimeList();
  if (letter === 'ALL') return resetAllFilters();
  currentAnimeList = all.filter(item => {
    const first = item.title.trim().charAt(0).toUpperCase();
    return letter === '#' ? /^[^A-Z]/.test(first) : first === letter;
  });
  showHomeView();
  renderAnimeGrid(currentAnimeList);
  showFilterBanner(`Starting with "${letter}"`);
}

function filterByLanguage(code, label) {
  closeAllDropdowns();
  const all = getFullAnimeList();
  currentAnimeList = code === 'ALL' ? all : all.filter(a => (a.langs || []).includes(code));
  showHomeView();
  renderAnimeGrid(currentAnimeList);
  showFilterBanner(`Language: ${label}`);
}

function filterByQuality(qualityCode, label) {
  closeAllDropdowns();
  const all = getFullAnimeList();
  currentAnimeList = qualityCode === 'ZIP' ? all : all.filter(a => (a.qualities || []).includes(qualityCode));
  showHomeView();
  renderAnimeGrid(currentAnimeList);
  showFilterBanner(`Quality: ${label}`);
}

function filterByGenre(genre) {
  closeAllDropdowns();
  const all = getFullAnimeList();
  currentAnimeList = all.filter(a => (a.genres || []).some(g => g.toLowerCase() === genre.toLowerCase()));
  if (currentAnimeList.length === 0) return runGlobalSearch(genre);
  showHomeView();
  renderAnimeGrid(currentAnimeList);
  showFilterBanner(`Genre: ${genre}`);
}

function filterByCategoryTag(cat) {
  if (cat.includes('1080p')) return filterByQuality('1080p', cat);
  if (cat.includes('720p')) return filterByQuality('720p', cat);
  if (cat.includes('480p')) return filterByQuality('480p', cat);
  if (cat.includes('Hindi')) return filterByLanguage('HI', cat);
  if (cat.includes('Tamil')) return filterByLanguage('TAM', cat);
  if (cat.includes('Telugu')) return filterByLanguage('TEL', cat);
  filterByGenre(cat);
}

// 5. Global API Search
async function runGlobalSearch(overrideQuery) {
  const input = document.getElementById('global-search-input');
  const query = (overrideQuery || (input ? input.value : '') || '').trim();
  if (!query) return resetAllFilters();

  showHomeView();
  const grid = document.getElementById('anime-grid');
  grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#38bdf8; font-weight:700;">
    🌍 Searching Anime for "${query}"...
  </div>`;

  const results = await searchGlobalAnimeApi(query);
  currentAnimeList = results;
  renderAnimeGrid(currentAnimeList);
  if (results.length > 0) showFilterBanner(`Global API Results for "${query}"`);
}

// 6. Open Story Page + Auto-Load Official Trailer via Jikan API
function findAnimeById(id) {
  const adminMatch = getAdminSavedAnime().find(a => Number(a.id) === Number(id));
  if (adminMatch) return adminMatch;
  return currentAnimeList.find(a => Number(a.id) === Number(id)) ||
         getFullAnimeList().find(a => Number(a.id) === Number(id)) ||
         currentAnimeList[0];
}

async function openStoryPage(id) {
  activeAnimeItem = findAnimeById(id);
  if (!activeAnimeItem) return;

  hideAllSubViews();
  document.getElementById('story-view').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const fallbackSvg = createSvgPoster(activeAnimeItem.title, '#0284c7', 'AnimeRush');
  const validPoster = (activeAnimeItem.poster && activeAnimeItem.poster.startsWith('http') && !activeAnimeItem.poster.includes('...'))
    ? activeAnimeItem.poster
    : fallbackSvg;

  document.getElementById('story-poster').src = validPoster;
  document.getElementById('story-title').textContent = `${activeAnimeItem.title} [Hindi-Eng-Jap] Multi Audio 480p, 720p & 1080p HD WEB-DL`;
  document.getElementById('story-anilist-ref').textContent = `Official Series Reference: AniList Media #${activeAnimeItem.id}`;
  document.getElementById('story-plot').textContent = activeAnimeItem.synopsis || `Watch and download ${activeAnimeItem.title} in Multi-Audio HD.`;
  document.getElementById('story-hinglish').textContent = activeAnimeItem.seoHighlights ||
    `Agar aap ${activeAnimeItem.title} Hindi Download karte hain, toh aapko Google Drive, HubCloud, GDFlix aur MEGA servers par fast download milega.`;

  // Load Official Trailer via Jikan API
  const trailerBox = document.getElementById('story-trailer-box');
  if (trailerBox) {
    trailerBox.innerHTML = `<p style="color:#38bdf8; font-size:0.84rem;">🎬 Fetching official trailer from Jikan API...</p>`;
    let embedUrl = activeAnimeItem.trailerEmbedUrl || '';

    if (!embedUrl) {
      const jikanData = await fetchJikanTrailerForAnime(activeAnimeItem.title);
      if (jikanData && jikanData.embedUrl) {
        embedUrl = jikanData.embedUrl;
        activeAnimeItem.trailerEmbedUrl = embedUrl;
      }
    }

    if (embedUrl) {
      trailerBox.innerHTML = `
        <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:10px; border:1px solid var(--border); background:#000;">
          <iframe src="${embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen loading="lazy"></iframe>
        </div>
      `;
    } else {
      const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(activeAnimeItem.title + ' official anime trailer')}`;
      trailerBox.innerHTML = `
        <div style="padding:14px; background:var(--bg-card); border-radius:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <span style="font-size:0.84rem; color:var(--text-muted);">Direct embed not provided by Jikan for this title.</span>
          <a href="${ytSearch}" target="_blank" class="btn-primary" style="background:#dc2626;">▶️ Watch Official Trailer on YouTube</a>
        </div>
      `;
    }
  }
}

// 7. Open Links Vault (Google Drive + Direct File + Other Servers OR "Not Found")
function openLinksVault() {
  if (!activeAnimeItem) activeAnimeItem = getFullAnimeList()[0];

  const adminSaved = getAdminSavedAnime().find(a => Number(a.id) === Number(activeAnimeItem.id));
  const uploadedEpisodes = (adminSaved && Array.isArray(adminSaved.episodes))
    ? adminSaved.episodes
    : (Array.isArray(activeAnimeItem.episodes) ? activeAnimeItem.episodes : []);

  const fullZipUrl = adminSaved?.fullZipUrl || activeAnimeItem.fullZipUrl || '';

  hideAllSubViews();
  document.getElementById('vault-view').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('vault-heading').textContent = `${activeAnimeItem.title} – Download`;
  document.getElementById('vault-submeta').textContent = `By AnimeRush Admin • Official AniList #${activeAnimeItem.id}`;

  // Render ZIP Box
  const zipBox = document.getElementById('vault-zip-box');
  if (zipBox) {
    if (fullZipUrl || uploadedEpisodes.length > 0) {
      zipBox.innerHTML = `
        <div class="zip-pack-title">
          <span>📦 FULL SEASON .ZIP & GOOGLE DRIVE BATCH DOWNLOAD</span>
          <span>ACTIVE</span>
        </div>
        <div class="dl-btn-row">
          ${fullZipUrl ? `<button class="dl-btn green" onclick="triggerChibiRedirect('${fullZipUrl}', 'Full_Drive_ZIP')">🟢 Direct Google Drive Full Season .ZIP</button>` : ''}
          <button class="dl-btn red" onclick="triggerChibiRedirect('#zip480', '480p_Batch_ZIP', true)">📦 480p Batch .ZIP</button>
          <button class="dl-btn blue" onclick="triggerChibiRedirect('#zip720', '720p_HEVC_ZIP', true)">📦 720p HEVC .ZIP</button>
          <button class="dl-btn green" onclick="triggerChibiRedirect('#zip1080', '1080p_HEVC_ZIP', true)">📦 1080p HEVC .ZIP</button>
        </div>
      `;
    } else {
      zipBox.innerHTML = `
        <div class="zip-pack-title" style="color:#f87171;">
          <span>📦 FULL SEASON .ZIP BATCH DOWNLOAD</span>
          <span>NOT UPLOADED YET</span>
        </div>
        <p style="font-size:0.82rem; color:var(--text-muted);">⏳ Full Season .ZIP will unlock once Admin uploads episodes for this anime.</p>
      `;
    }
  }

  const epContainer = document.getElementById('vault-episodes-list');

  // Strict check: Show "Not Found" if Admin hasn't uploaded episodes
  if (!uploadedEpisodes || uploadedEpisodes.length === 0) {
    epContainer.innerHTML = `
      <div style="background:#141720; border:1px dashed #ef4444; border-radius:10px; padding:28px 18px; text-align:center; margin-top:12px;">
        <div style="font-size:2.2rem; margin-bottom:8px;">⚠️</div>
        <h3 style="color:#f87171; font-size:1.15rem; margin-bottom:6px;">
          Episodes Not Found (Not Uploaded Yet)
        </h3>
        <p style="color:#94a3b8; font-size:0.88rem; max-width:460px; margin:0 auto 16px; line-height:1.5;">
          Admin has not uploaded any episodes for <strong>${activeAnimeItem.title}</strong> yet. Wait for the next update or request it on our Telegram channel!
        </p>
        <a href="https://t.me/" target="_blank" class="tg-pill">✈️ Request Anime on Telegram</a>
      </div>
    `;
    return;
  }

  // Render Admin-uploaded episodes including Google Drive & Direct File Download
  epContainer.innerHTML = uploadedEpisodes.map((ep, idx) => `
    <div class="ep-accordion ${idx === 0 ? 'open' : ''}">
      <div class="ep-header" onclick="this.parentElement.classList.toggle('open')">
        <div>
          <span class="ep-badge">EP ${ep.epNumber}</span>
          <strong>${ep.title || 'Episode ' + ep.epNumber}</strong>
          <span style="background:#14532d; color:#86efac; font-size:0.7rem; padding:2px 8px; border-radius:99px; margin-left:8px;">✅ Available</span>
        </div>
        <span>▼</span>
      </div>
      <div class="ep-body">
        ${renderDirectFileRow(ep)}
        ${renderServerButtons('🟢 GOOGLE DRIVE DIRECT', ep.servers?.gdrive)}
        ${renderServerButtons('☁️ HUBCLOUD', ep.servers?.hubcloud)}
        ${renderServerButtons('⚡ GDFLIX / MEGA / OTHER', ep.servers?.gdflix)}
      </div>
    </div>
  `).join('');
}

function renderDirectFileRow(ep) {
  if (!ep.directFileUrl) return '';
  const fileName = ep.directFileName || `Episode_${ep.epNumber}_AnimeRush.mkv`;
  return `
    <div class="server-group">
      <div class="server-label" style="color:#4ade80;">📁 DIRECT ANIME FILE DOWNLOAD</div>
      <div class="dl-btn-row">
        <button class="dl-btn purple" onclick="triggerDirectAnimeFile('${ep.directFileUrl}', '${fileName}')">
          ⬇️ Download Anime File (${fileName})
        </button>
      </div>
    </div>
  `;
}

// REPLACE renderServerButtons IN js/app.js WITH THIS:
function renderServerButtons(serverLabel, customLinks = {}) {
  // Finds whichever single link you pasted (even if you only pasted 1080p)
  const masterLink =
    (customLinks.p1080 && !customLinks.p1080.startsWith('#') ? customLinks.p1080 : '') ||
    (customLinks.p720 && !customLinks.p720.startsWith('#') ? customLinks.p720 : '') ||
    (customLinks.p480 && !customLinks.p480.startsWith('#') ? customLinks.p480 : '');

  if (!masterLink) {
    return `
      <div class="server-group">
        <div class="server-label">${serverLabel}</div>
        <div class="dl-btn-row">
          <span style="color:#64748b; font-size:0.78rem; font-style:italic;">❌ Link Not Added for this server</span>
        </div>
      </div>
    `;
  }

  const link480 = (customLinks.p480 && !customLinks.p480.startsWith('#')) ? customLinks.p480 : `${masterLink}&quality=480p`;
  const link720 = (customLinks.p720 && !customLinks.p720.startsWith('#')) ? customLinks.p720 : `${masterLink}&quality=720p`;
  const link1080 = (customLinks.p1080 && !customLinks.p1080.startsWith('#')) ? customLinks.p1080 : `${masterLink}&quality=1080p`;

  let driveId = null;
  try {
    const parsed = new URL(masterLink);
    driveId = parsed.searchParams.get('id') || null;
    if (!driveId) {
      const pathMatch = parsed.pathname.match(/\/(?:d|folders)\/([A-Za-z0-9_-]+)/);
      if (pathMatch) driveId = pathMatch[1];
    }
  } catch (err) {}

  if (!driveId) {
    const fallbackMatch = masterLink.match(/(?:\/d\/|\/folders\/|[?&]id=)([A-Za-z0-9_-]{10,})/);
    driveId = fallbackMatch ? fallbackMatch[1] : null;
  }

  const streamBtn = driveId
    ? `<button class="dl-btn purple" onclick="openDriveQualityPlayer('${driveId}')">▶️ Watch / Switch Quality (480p-1080p)</button>`
    : '';

  return `
    <div class="server-group">
      <div class="server-label">${serverLabel}</div>
      <div class="dl-btn-row">
        <button class="dl-btn red" onclick="triggerChibiRedirect('${link480}', '480p')">📥 480p x264 — Auto DL</button>
        <button class="dl-btn blue" onclick="triggerChibiRedirect('${link720}', '720p')">📥 720p HEVC 10bit — Auto DL</button>
        <button class="dl-btn green" onclick="triggerChibiRedirect('${link1080}', '1080p')">📥 1080p Full HD — Direct DL</button>
        ${streamBtn}
      </div>
    </div>
  `;
}

function openDriveQualityPlayer(driveFileId) {
  window.open(`https://drive.google.com/file/d/${driveFileId}/preview`, '_blank');
}

// 8. NEW: Open Dedicated Jikan API Trailers Page
async function openTrailersPage(customQuery = '') {
  closeAllDropdowns();
  hideAllSubViews();
  document.getElementById('trailers-view').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const grid = document.getElementById('jikan-trailers-grid');
  grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#fde047; font-weight:700;">
    🎬 Loading Official Anime Trailers from AnimeRush(MyAnimeList)...
  </div>`;

  const trailers = await fetchJikanTrailersList(customQuery);
  if (!trailers.length) {
    grid.innerHTML = `<p style="color:#f87171;">Could not load trailers right now. Try searching another title!</p>`;
    return;
  }

  grid.innerHTML = trailers.map(item => `
    <div style="background:var(--bg-input); border:1px solid var(--border); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        ${item.embedUrl ? `
          <div style="position:relative; padding-bottom:56.25%; height:0; background:#000;">
            <iframe src="${item.embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen loading="lazy"></iframe>
          </div>
        ` : `
          <img src="${item.poster}" alt="${item.title}" style="width:100%; height:190px; object-fit:cover;" />
        `}
        <div style="padding:14px;">
          <h3 style="font-size:0.98rem; color:#fff; margin-bottom:6px;">${item.title}</h3>
          <p style="font-size:0.78rem; color:var(--text-muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${item.synopsis || 'Official Anime Trailer via AnimeRush.'}
          </p>
        </div>
      </div>
      <div style="padding:0 14px 14px; display:flex; gap:8px;">
        <button class="btn-primary" style="flex:1; background:#16a34a;" onclick="openAnimeFromTrailer(${item.id}, '${item.title.replace(/'/g, "\\'")}', '${item.poster}', '${item.embedUrl}')">
          📥 Download Page
        </button>
        <a href="${item.youtubeSearchUrl}" target="_blank" class="btn-primary" style="background:#dc2626;">▶️ YouTube</a>
      </div>
    </div>
  `).join('');
}

function searchJikanTrailersPage() {
  const q = document.getElementById('trailer-search-input').value.trim();
  openTrailersPage(q);
}

function openAnimeFromTrailer(id, title, poster, embedUrl) {
  let match = findAnimeById(id);
  if (!match || Number(match.id) !== Number(id)) {
    match = formatApiMediaToAnimeRush(id, title, poster, '', ['Action', 'Anime'], embedUrl);
    currentAnimeList.unshift(match);
  }
  openStoryPage(id);
}

function hideAllSubViews() {
  document.getElementById('home-view').style.display = 'none';
  document.getElementById('story-view')?.classList.remove('active');
  document.getElementById('vault-view')?.classList.remove('active');
  document.getElementById('trailers-view')?.classList.remove('active');
}

function showHomeView() {
  hideAllSubViews();
  document.getElementById('home-view').style.display = 'grid';
}

// 9. Redirect & File Download Helpers
function triggerDirectAnimeFile(fileUrl, fileName) {
  const modal = document.getElementById('redirect-modal');
  const msg = document.getElementById('redirect-status-text');
  if (msg) msg.textContent = `Starting Direct File Download (${fileName})...`;
  if (modal) modal.classList.add('active');

  setTimeout(() => {
    if (modal) modal.classList.remove('active');
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
    } else {
      downloadValidZipBundle(activeAnimeItem?.title || 'AnimeRush', fileName);
    }
  }, 1500);
}

function triggerChibiRedirect(url, qualityLabel, isZipDownload = false) {
  const modal = document.getElementById('redirect-modal');
  const msg = document.getElementById('redirect-status-text');
  const title = activeAnimeItem ? activeAnimeItem.title : 'AnimeRush';

  if (msg) {
    msg.textContent = isZipDownload
      ? `Packing ${title} (${qualityLabel}) Full Season .ZIP...`
      : `Redirecting to ${qualityLabel} Cloud / Google Drive...`;
  }
  if (modal) modal.classList.add('active');

  setTimeout(() => {
    if (modal) modal.classList.remove('active');
    if (isZipDownload) {
      downloadValidZipBundle(title, qualityLabel);
    } else if (url && url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      alert('Link Not Found! Please add a valid https:// link in Admin.');
    }
  }, 1600);
}

function downloadValidZipBundle(animeTitle, quality) {
  const safeName = animeTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileNameInside = `${safeName}_${quality}_AnimeRush_Links.txt`;
  const content = `ANIMERUSH BATCH DOWNLOAD PACK\r\nAnime: ${animeTitle}\r\nQuality: ${quality}\r\n`;
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeName}_${quality}_AnimeRush.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function toggleThemeMode() {
  document.body.classList.toggle('light-mode');
}