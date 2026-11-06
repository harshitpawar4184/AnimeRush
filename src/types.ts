// ==========================================================
// AnimeRush - TYPESCRIPT INTERFACES (src/types.ts)
// ==========================================================

export type LanguageCode = 'HI' | 'EN' | 'JP' | 'TAM' | 'TEL';
export type QualityCode = '480p' | '720p' | '1080p' | 'BluRay';

export interface ServerQualityLinks {
  p480: string;
  p720: string;
  p1080: string;
}

export interface EpisodeItem {
  epNumber: string;
  title: string;
  servers?: {
    hubcloud?: ServerQualityLinks;
    filepress?: ServerQualityLinks;
    gdflix?: ServerQualityLinks;
    mega?: ServerQualityLinks;
  };
}

export interface AnimeRushItem {
  id: number;
  title: string;
  poster: string;
  langs: LanguageCode[];
  qualities: QualityCode[];
  genres: string[];
  synopsis: string;
  seoHighlights: string;
  isGlobalApi?: boolean;
  episodes: EpisodeItem[];
}
