// ==========================================================
// AnimeRush - GLOBAL ANIME & JIKAN TRAILER API (js/api.js)
// ==========================================================

// 1. Hydrate real HD posters from AniList in the background
async function hydrateDefaultPosters() {
  const cards = getFullAnimeList();
  for (const item of cards) {
    if (item.poster && item.poster.startsWith('http') && !item.poster.includes('...')) continue;
    try {
      const media = await fetchSingleAnimeFromApi(item.searchQuery || item.title || item.id);
      if (media && media.poster) {
        item.poster = media.poster;
        const imgEl = document.querySelector(`img[data-anime-id="${item.id}"]`);
        if (imgEl) imgEl.src = media.poster;
      }
    } catch (err) {}
  }
}

// 2. Fetch Single Anime by ID or Search Term + Trailer
async function fetchSingleAnimeFromApi(idOrSearch) {
  const isNumeric = /^\d+$/.test(String(idOrSearch).trim());
  const query = `
    query ($id: Int, $search: String) {
      Media(id: $id, search: $search, type: ANIME) {
        id
        title { english romaji }
        coverImage { extraLarge large }
        description(asHtml: false)
        genres
        trailer { id site }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        query,
        variables: isNumeric ? { id: Number(idOrSearch) } : { search: String(idOrSearch) }
      })
    });
    const json = await res.json();
    const m = json?.data?.Media;
    if (m) {
      const title = m.title.english || m.title.romaji;
      let trailerEmbedUrl = (m.trailer && m.trailer.site === 'youtube' && m.trailer.id)
        ? `https://www.youtube.com/embed/${m.trailer.id}`
        : '';

      // If AniList has no trailer, check Jikan API
      if (!trailerEmbedUrl) {
        const jikanInfo = await fetchJikanTrailerForAnime(title);
        if (jikanInfo?.embedUrl) trailerEmbedUrl = jikanInfo.embedUrl;
      }

      return {
        id: m.id,
        title,
        poster: m.coverImage.extraLarge || m.coverImage.large,
        synopsis: (m.description || '').replace(/<[^>]*>?/gm, ''),
        genres: m.genres || ['Action', 'Fantasy'],
        trailerEmbedUrl
      };
    }
  } catch (err) {
    console.warn('AniList single fetch fallback to Jikan:', err);
  }

  // Fallback to Jikan REST API
  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(idOrSearch)}&limit=1`;
    const res = await fetch(url);
    const json = await res.json();
    const m = json?.data?.[0];
    if (m) {
      return {
        id: m.mal_id,
        title: m.title_english || m.title,
        poster: m.images?.jpg?.large_image_url || m.images?.jpg?.image_url,
        synopsis: m.synopsis || '',
        genres: (m.genres || []).map(g => g.name),
        trailerEmbedUrl: m.trailer?.embed_url || ''
      };
    }
  } catch (err) {}
  return null;
}

// 3. Fetch Official Trailer for any Anime Title from Jikan API
async function fetchJikanTrailerForAnime(animeTitle) {
  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeTitle)}&limit=1`;
    const res = await fetch(url);
    const json = await res.json();
    const item = json?.data?.[0];
    if (!item) return null;

    const ytId = item.trailer?.youtube_id;
    const rawEmbed = item.trailer?.embed_url || '';
    const embedUrl = ytId
      ? `https://www.youtube.com/embed/${ytId}`
      : rawEmbed.replace('autoplay=1', 'autoplay=0');

    return {
      malId: item.mal_id,
      title: item.title_english || item.title,
      embedUrl: embedUrl || '',
      watchUrl: item.trailer?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(animeTitle + ' official anime trailer')}`
    };
  } catch (err) {
    return null;
  }
}

// 4. Fetch Page of Anime with Trailers from Jikan API (for Trailers Page)
async function fetchJikanTrailersList(searchQuery = '') {
  try {
    const endpoint = searchQuery
      ? `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&limit=6`
      : `https://api.jikan.moe/v4/top/anime?filter=airing&limit=6`;

    const res = await fetch(endpoint);
    const json = await res.json();
    const list = json?.data || [];

    return list.map(item => {
      const title = item.title_english || item.title;
      const ytId = item.trailer?.youtube_id;
      const rawEmbed = item.trailer?.embed_url || '';
      const embedUrl = ytId
        ? `https://www.youtube.com/embed/${ytId}`
        : rawEmbed.replace('autoplay=1', 'autoplay=0');

      return {
        id: item.mal_id,
        title,
        poster: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        synopsis: item.synopsis || '',
        embedUrl,
        youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`
      };
    });
  } catch (err) {
    console.warn('Jkn Trailers list error:', err);
    return [];
  }
}

// 5. Global Search across AniList + Jikan Fallback
async function searchGlobalAnimeApi(searchText) {
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 12) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { english romaji }
          coverImage { extraLarge large }
          description(asHtml: false)
          genres
          trailer { id site }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { search: searchText } })
    });
    const json = await res.json();
    const list = json?.data?.Page?.media || [];
    if (list.length > 0) {
      return list.map(m => {
        const trailerEmbed = (m.trailer && m.trailer.site === 'youtube' && m.trailer.id)
          ? `https://www.youtube.com/embed/${m.trailer.id}`
          : '';
        return formatApiMediaToAnimeRush(
          m.id,
          m.title.english || m.title.romaji,
          m.coverImage.extraLarge || m.coverImage.large,
          (m.description || '').replace(/<[^>]*>?/gm, ''),
          m.genres,
          trailerEmbed
        );
      });
    }
  } catch (e) {}

  // Jikan API Fallback
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchText)}&limit=12`);
    const json = await res.json();
    return (json?.data || []).map(m => formatApiMediaToAnimeRush(
      m.mal_id,
      m.title_english || m.title,
      m.images?.jpg?.large_image_url || m.images?.jpg?.image_url,
      m.synopsis || '',
      (m.genres || []).map(g => g.name),
      m.trailer?.embed_url ? m.trailer.embed_url.replace('autoplay=1', 'autoplay=0') : ''
    ));
  } catch (err) {
    return [];
  }
}

function formatApiMediaToAnimeRush(id, title, posterUrl, synopsis, genres, trailerEmbedUrl = '') {
  const adminSaved = typeof getAdminSavedAnime === 'function'
    ? getAdminSavedAnime().find(a => Number(a.id) === Number(id))
    : null;

  return {
    id: id,
    title: title,
    langs: adminSaved?.langs || ["HI", "EN", "JP"],
    qualities: ["480p", "720p", "1080p"],
    genres: genres && genres.length ? genres : ["Action", "Anime"],
    poster: posterUrl || createSvgPoster(title, "#0284c7", "GLOBAL API"),
    synopsis: synopsis || `Watch and download ${title} in Hindi Dubbed Dual Audio 480p, 720p & 1080p 10bit HEVC.`,
    seoHighlights: adminSaved?.seo || `Jab aap ${title} Hindi Download karte hain, toh aapko AnimeRush par milta hai fast Google Drive, HubCloud, GDFlix, FilePress aur MEGA servers.`,
    trailerEmbedUrl: adminSaved?.trailerEmbedUrl || trailerEmbedUrl,
    isGlobalApi: true,
    fullZipUrl: adminSaved?.fullZipUrl || "",
    episodes: adminSaved?.episodes || []
  };
}