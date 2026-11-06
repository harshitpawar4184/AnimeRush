// ==========================================================
// AnimeRush - LIVE CLOUD DATABASE & SVG POSTER GENERATOR
// ==========================================================

// 👇JSONBIN.IO ID AND MASTER KEY HERE:
const CLOUD_BIN_ID = "6aedee6dffd5d16053ac6297";
const CLOUD_API_KEY = "$2a$10$agsnYNOaVWlScQwWLcRN6.mQmldE4H5W/qITWnbVxE6PwjdIBgQpq";

const STORAGE_KEY = 'AnimeRush_custom_db_v1';
const ADMIN_LEGACY_KEY = 'AnimeRush_db';

// Global memory store synced directly from the Cloud
let CLOUD_ANIME_CACHE = [];

function createSvgPoster(title, accentHex, subText) {
  const safeTitle = String(title || 'AnimeRush').replace(/[<>&"']/g, '');
  const shortTitle = safeTitle.length > 26 ? safeTitle.slice(0, 26) + '...' : safeTitle;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="55%" stop-color="${accentHex || '#1e3a8a'}"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#bg)"/>
    <circle cx="320" cy="90" r="110" fill="rgba(255,255,255,0.06)"/>
    <circle cx="70" cy="480" r="140" fill="rgba(0,210,255,0.08)"/>
    <rect x="24" y="24" width="120" height="32" rx="6" fill="rgba(0,0,0,0.65)"/>
    <text x="84" y="45" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">ANIMERUSH</text>
    <text x="200" y="290" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="800" text-anchor="middle">${shortTitle}</text>
    <text x="200" y="325" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="middle">${subText || 'MULTI AUDIO [HI-EN-JP]'}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const DEFAULT_ANIME_DB = [
  {
    id: 171018,
    title: "Blue Box Season 2",
    searchQuery: "Ao no Hako",
    poster: "",
    langs: ["HI", "EN", "JP"],
    qualities: ["480p", "720p", "1080p"],
    genres: ["Romance", "Sports"],
    synopsis: "Taiki Inomata continues his badminton training while growing closer to Chinatsu Kano.",
    fullZipUrl: "",
    episodes: []
  },
  {
    id: 163134,
    title: "Re:ZERO -Starting Life in Another World- Season 3",
    searchQuery: "Re:Zero kara Hajimeru Isekai Seikatsu 3rd Season",
    poster: "",
    langs: ["HI", "EN", "JP"],
    qualities: ["480p", "720p", "1080p"],
    genres: ["Action", "Dark Fantasy", "Isekai"],
    synopsis: "Subaru Natsuki faces the Sin Archbishops of the Witch Cult in the Watergate City of Priestella.",
    fullZipUrl: "",
    episodes: []
  },
  {
    id: 151807,
    title: "Solo Leveling",
    searchQuery: "Ore dake Level Up na Ken",
    poster: "",
    langs: ["HI", "EN", "JP"],
    qualities: ["480p", "720p", "1080p"],
    genres: ["Action", "Fantasy", "Adventure"],
    synopsis: "E-rank hunter Sung Jinwoo awakens a secret leveling system after surviving a deadly double dungeon.",
    fullZipUrl: "",
    episodes: []
  }
];

const GENRE_LIST = [
  "Action", "Adventure", "Comedy", "Cyberpunk", "Dark Fantasy",
  "Demons", "Drama", "Fantasy", "Gaming", "Harem",
  "Historical", "Horror", "Isekai", "Magic", "Martial Arts",
  "Mecha", "Mystery", "Psychological", "Romance", "Samurai",
  "School", "Sci-Fi", "Seinen", "Shonen", "Slice of Life",
  "Sports", "Super Power", "Supernatural", "Suspense", "Thriller"
];

const SIDEBAR_CATEGORIES = [
  "1080p Anime Download", "720p Anime Download", "480p Anime Download",
  "Hindi Dubbed Anime", "Dual Audio Anime", "English Dub Anime",
  "Tamil Dub Anime", "Telugu Dub Anime", "Action", "Isekai",
  "Romance", "Fantasy", "Dark Fantasy", "Sports", "Shonen"
];

// 1. Read Admin-saved anime (from Cloud Cache or Local Backup)
function getAdminSavedAnime() {
  if (CLOUD_ANIME_CACHE.length > 0) return CLOUD_ANIME_CACHE;
  try {
    const list1 = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const list2 = JSON.parse(localStorage.getItem(ADMIN_LEGACY_KEY) || '[]');
    const combined = [...list1, ...list2];
    const uniqueMap = new Map();
    combined.forEach(item => {
      if (item && item.id) uniqueMap.set(Number(item.id), item);
    });
    return Array.from(uniqueMap.values());
  } catch (e) {
    return [];
  }
}

function getFullAnimeList() {
  const custom = getAdminSavedAnime();
  const customIds = new Set(custom.map(item => Number(item.id)));
  return [...custom, ...DEFAULT_ANIME_DB.filter(item => !customIds.has(Number(item.id)))];
}

// 2. PULL LATEST EPISODES FROM CLOUD ON EVERY DEVICE
async function syncAnimeFromCloud() {
  if (!CLOUD_BIN_ID || CLOUD_BIN_ID.includes("PASTE_YOUR")) return;

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${CLOUD_BIN_ID}/latest`, {
      method: "GET",
      headers: {
        "X-Master-Key": CLOUD_API_KEY,
        "X-Bin-Meta": "false"
      }
    });
    if (!res.ok) return;

    const data = await res.json();
    const cloudList = Array.isArray(data) ? data : (data.animeList || []);

    CLOUD_ANIME_CACHE = cloudList;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudList));
    localStorage.setItem(ADMIN_LEGACY_KEY, JSON.stringify(cloudList));

    // Automatically refresh UI on index.html
    if (typeof renderAnimeGrid === "function") {
      currentAnimeList = getFullAnimeList();
      renderAnimeGrid(currentAnimeList);
      renderSidebarWidgets();
      if (typeof hydrateDefaultPosters === "function") hydrateDefaultPosters();
    }

    // Automatically refresh list on admin.html
    if (typeof renderAdminList === "function") {
      renderAdminList();
    }
  } catch (err) {
    console.warn("Cloud fetch offline, using cached data:", err);
  }
}

// 3. SAVE NEW / UPDATED / DELETED EPISODES TO THE CLOUD
async function saveAdminDatabase(newList) {
  CLOUD_ANIME_CACHE = newList;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  localStorage.setItem(ADMIN_LEGACY_KEY, JSON.stringify(newList));

  if (!CLOUD_BIN_ID || CLOUD_BIN_ID.includes("PASTE_YOUR")) {
    alert("⚠️ Saved locally only! Paste your CLOUD_BIN_ID and CLOUD_API_KEY in js/data.js to sync across all devices.");
    return false;
  }

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${CLOUD_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": CLOUD_API_KEY
      },
      body: JSON.stringify({ animeList: newList })
    });
    return res.ok;
  } catch (err) {
    console.error("Cloud save failed:", err);
    return false;
  }
}

// Automatically pull from cloud as soon as any device opens index.html or admin.html
document.addEventListener("DOMContentLoaded", syncAnimeFromCloud);