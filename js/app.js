// ==========================================================
// SMART DOWNLOAD VAULT & MOBILE DIRECT DOWNLOAD HANDLER
// ==========================================================

// 1. Checks if a specific link is actually added and valid
function isLinkValid(url) {
  if (!url) return false;
  const clean = String(url).trim();
  return (
    clean !== '' &&
    clean !== '#' &&
    clean !== 'https://drive.google.com/' &&
    !clean.startsWith('localfile://')
  );
}

// 2. Renders an ACTIVE glowing button if a link exists, or a disabled badge if empty
function renderQualityBtn(url, qualityLabel, activeBgHex) {
  if (isLinkValid(url)) {
    const safeUrl = String(url).replace(/'/g, "\\'");
    return `
      <button onclick="triggerChibiRedirect('${safeUrl}', '${qualityLabel}')" 
        style="background:${activeBgHex}; color:#fff; border:1px solid rgba(255,255,255,0.28); padding:9px 14px; border-radius:8px; font-weight:700; font-size:0.82rem; cursor:pointer; display:inline-flex; align-items:center; gap:7px; box-shadow:0 4px 12px rgba(0,0,0,0.35);">
        <span>✅ ${qualityLabel}</span>
        <span style="background:rgba(0,0,0,0.4); padding:2px 6px; border-radius:4px; font-size:0.68rem; color:#86efac; letter-spacing:0.5px;">ACTIVE</span>
      </button>
    `;
  } else {
    return `
      <button disabled 
        style="background:rgba(30,41,59,0.45); color:#64748b; border:1px dashed #334155; padding:9px 14px; border-radius:8px; font-weight:600; font-size:0.8rem; cursor:not-allowed; display:inline-flex; align-items:center; gap:6px; opacity:0.55;">
        <span>🚫 ${qualityLabel} (Not Added)</span>
      </button>
    `;
  }
}

// 3. Direct Mobile & PC Download Trigger (Bypasses Android Drive App Hijack)
function triggerChibiRedirect(url, label) {
  if (!isLinkValid(url)) {
    alert('Link not added for this quality yet!');
    return;
  }

  let finalUrl = String(url).trim();

  // Convert standard Google Drive file links to direct browser download links
  const driveMatch = finalUrl.match(/(?:\/d\/|[?&]id=)([a-zA-Z0-9_-]{15,})/);
  if (driveMatch && driveMatch[1] && !finalUrl.includes('/folders/')) {
    finalUrl = `https://drive.usercontent.google.com/download?id=${driveMatch[1]}&export=download&confirm=t`;
  }

  // Open download cleanly on both mobile Chrome and desktop
  window.open(finalUrl, '_blank', 'noopener,noreferrer');
}

// 4. Complete Smart Links Vault View
function openLinksVault(animeId) {
  closeAllDropdowns();
  hideAllSubViews();

  const allAnime = typeof getFullAnimeList === 'function' ? getFullAnimeList() : [];
  const anime =
    allAnime.find(a => Number(a.id) === Number(animeId)) ||
    (typeof currentAnimeList !== 'undefined' ? currentAnimeList.find(a => Number(a.id) === Number(animeId)) : null) ||
    window.lastSelectedAnime;

  const vaultView = document.getElementById('links-vault-view');
  if (!vaultView) return;
  vaultView.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const container = document.getElementById('links-vault-content') || vaultView;
  if (!anime) {
    container.innerHTML = `<p style="color:#f87171; padding:20px;">Anime not found.</p>`;
    return;
  }

  const episodes = Array.isArray(anime.episodes) ? anime.episodes : [];
  const hasBatchZip = isLinkValid(anime.fullZipUrl);
  const tgUrl = typeof TELEGRAM_CHANNEL_URL !== 'undefined' && TELEGRAM_CHANNEL_URL ? TELEGRAM_CHANNEL_URL : 'https://t.me/';

  // Top Full Season Batch Box — only displays active buttons for valid links
  const batchZipSection = hasBatchZip ? `
    <div style="border:1px dashed #16a34a; background:rgba(22,163,74,0.08); border-radius:12px; padding:16px; margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <strong style="color:#4ade80; font-size:0.9rem;">📦 FULL SEASON .ZIP & GOOGLE DRIVE BATCH DOWNLOAD</strong>
        <span style="color:#4ade80; font-size:0.78rem; font-weight:800;">● ACTIVE</span>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:10px;">
        ${renderQualityBtn(anime.fullZipUrl, 'Direct Full Season .ZIP', '#15803d')}
      </div>
    </div>
  ` : '';

  // Episode Cards
  const episodesHtml = episodes.length === 0 ? `
    <div style="background:var(--bg-input); border:1px solid var(--border); border-radius:12px; padding:28px; text-align:center;">
      <h3 style="color:#f87171; margin-bottom:8px;">⚠️ No Episodes Uploaded Yet</h3>
      <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:16px;">
        Links for <strong>${anime.title}</strong> are being encoded and will be uploaded soon!
      </p>
      <a href="${tgUrl}" target="_blank" class="btn-primary" style="display:inline-block; background:#0284c7; text-decoration:none; padding:10px 18px; border-radius:8px; color:#fff; font-weight:700;">
        ✈️ Request Anime on Telegram
      </a>
    </div>
  ` : episodes.map(ep => {
    const gd = ep.servers?.gdrive || {};
    const hc = ep.servers?.hubcloud || {};
    const gf = ep.servers?.gdflix || {};

    const hasDirect = isLinkValid(ep.directFileUrl);
    const hasGdrive = isLinkValid(gd.p480) || isLinkValid(gd.p720) || isLinkValid(gd.p1080);
    const hasHubcloud = isLinkValid(hc.p480) || isLinkValid(hc.p720) || isLinkValid(hc.p1080);
    const hasGdflix = isLinkValid(gf.p480) || isLinkValid(gf.p720) || isLinkValid(gf.p1080);

    return `
      <div style="background:var(--bg-input); border:1px solid var(--border); border-radius:12px; padding:18px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; margin-bottom:14px; border-bottom:1px solid var(--border);">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="background:#1e293b; color:#93c5fd; font-weight:800; font-size:0.78rem; padding:4px 10px; border-radius:6px;">
              EP ${ep.epNumber}
            </span>
            <strong style="color:#fff; font-size:1rem;">${ep.title || `Episode ${ep.epNumber}`}</strong>
            <span style="background:rgba(22,163,74,0.2); color:#4ade80; font-size:0.72rem; font-weight:700; padding:3px 8px; border-radius:20px; border:1px solid rgba(74,222,128,0.3);">
              ✅ Available
            </span>
          </div>
        </div>

        <!-- 1. PERSONAL / DIRECT FILE LINK (Only shown if valid link added) -->
        ${hasDirect ? `
          <div style="margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid var(--border);">
            <div style="font-size:0.78rem; font-weight:800; color:#4ade80; margin-bottom:10px;">
              📁 PERSONAL / DIRECT ANIME FILE DOWNLOAD <span style="color:#86efac;">● ACTIVE</span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
              ${renderQualityBtn(ep.directFileUrl, `Download Anime File (${ep.directFileName || 'HD Video'})`, '#6d28d9')}
            </div>
          </div>
        ` : ''}

        <!-- 2. GOOGLE DRIVE DIRECT -->
        <div style="margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid var(--border);">
          <div style="font-size:0.78rem; font-weight:800; color:#cbd5e1; margin-bottom:10px;">
            🟢 GOOGLE DRIVE DIRECT
            ${hasGdrive
              ? `<span style="color:#4ade80; margin-left:6px;">● ACTIVE</span>`
              : `<span style="color:#64748b; margin-left:6px;">(Not Added)</span>`}
          </div>
          ${hasGdrive ? `
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
              ${renderQualityBtn(gd.p480, '480p x264', '#9a3412')}
              ${renderQualityBtn(gd.p720, '720p HEVC 10bit', '#0369a1')}
              ${renderQualityBtn(gd.p1080, '1080p Full HD', '#15803d')}
            </div>
          ` : `<div style="font-size:0.8rem; color:#64748b; font-style:italic;">❌ Link Not Added for this server</div>`}
        </div>

        <!-- 3. HUBCLOUD -->
        <div style="margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid var(--border);">
          <div style="font-size:0.78rem; font-weight:800; color:#cbd5e1; margin-bottom:10px;">
            ☁️ HUBCLOUD
            ${hasHubcloud
              ? `<span style="color:#4ade80; margin-left:6px;">● ACTIVE</span>`
              : `<span style="color:#64748b; margin-left:6px;">(Not Added)</span>`}
          </div>
          ${hasHubcloud ? `
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
              ${renderQualityBtn(hc.p480, '480p x264', '#9a3412')}
              ${renderQualityBtn(hc.p720, '720p HEVC 10bit', '#0369a1')}
              ${renderQualityBtn(hc.p1080, '1080p Full HD', '#15803d')}
            </div>
          ` : `<div style="font-size:0.8rem; color:#64748b; font-style:italic;">❌ Link Not Added for this server</div>`}
        </div>

        <!-- 4. GDFLIX / MEGA / OTHER -->
        <div>
          <div style="font-size:0.78rem; font-weight:800; color:#cbd5e1; margin-bottom:10px;">
            ⚡ GDFLIX / MEGA / OTHER
            ${hasGdflix
              ? `<span style="color:#4ade80; margin-left:6px;">● ACTIVE</span>`
              : `<span style="color:#64748b; margin-left:6px;">(Not Added)</span>`}
          </div>
          ${hasGdflix ? `
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
              ${renderQualityBtn(gf.p480, '480p x264', '#9a3412')}
              ${renderQualityBtn(gf.p720, '720p HEVC 10bit', '#0369a1')}
              ${renderQualityBtn(gf.p1080, '1080p Full HD', '#15803d')}
            </div>
          ` : `<div style="font-size:0.8rem; color:#64748b; font-style:italic;">❌ Link Not Added for this server</div>`}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:16px; padding:22px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
        <button onclick="openAnimeDetail(${anime.id})" style="background:var(--bg-input); color:#38bdf8; border:1px solid var(--border); padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:600;">
          ← Back to Story & Trailer
        </button>
        <button onclick="goHome()" style="background:var(--bg-input); color:#38bdf8; border:1px solid var(--border); padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:600;">
          🏠 AnimeRush Home
        </button>
      </div>

      <h1 style="font-size:1.55rem; color:#fff; margin-bottom:4px;">${anime.title} – Download</h1>
      <p style="font-size:0.82rem; color:#38bdf8; margin-bottom:20px;">
        By AnimeRush Admin • Official AniList #${anime.id}
      </p>

      ${batchZipSection}
      ${episodesHtml}
    </div>
  `;
}