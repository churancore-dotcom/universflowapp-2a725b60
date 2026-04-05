/**
 * YouTube Music search & stream resolver via Piped instances.
 * No API key needed — fully open-source pipeline.
 */

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
  'https://api.piped.projectsegfau.lt',
];

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
];

export interface YTMusicResult {
  id: string;          // prefixed "ytm-{videoId}"
  videoId: string;
  title: string;
  artist: string;
  cover_url?: string;
  duration?: number;   // seconds
}

/** Clean up typical YouTube title junk */
function cleanTitle(raw: string): { title: string; artist: string } {
  // Remove common suffixes
  let t = raw
    .replace(/\s*\(Official\s*(Music\s*)?Video\)/gi, '')
    .replace(/\s*\[Official\s*(Music\s*)?Video\]/gi, '')
    .replace(/\s*\(Official\s*Audio\)/gi, '')
    .replace(/\s*\[Official\s*Audio\]/gi, '')
    .replace(/\s*\(Lyrics?\)/gi, '')
    .replace(/\s*\[Lyrics?\]/gi, '')
    .replace(/\s*\(Visuali[sz]er\)/gi, '')
    .replace(/\s*\[Visuali[sz]er\]/gi, '')
    .replace(/\s*\|\s*.*$/, '')
    .replace(/\s*\/\/\s*.*$/, '')
    .trim();

  // Try to split "Artist - Title"
  const dashMatch = t.match(/^(.+?)\s*[-–—]\s+(.+)$/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), title: dashMatch[2].trim() };
  }
  return { title: t, artist: '' };
}

/** Search via Piped API (music filter) */
async function searchPiped(query: string, instance: string): Promise<YTMusicResult[]> {
  const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Piped ${res.status}`);
  const json = await res.json();
  const items = json.items || json.content || [];
  return items.slice(0, 15).map((item: any) => {
    const videoId = (item.url || '').replace('/watch?v=', '');
    const { title, artist: parsedArtist } = cleanTitle(item.title || '');
    return {
      id: `ytm-${videoId}`,
      videoId,
      title,
      artist: parsedArtist || item.uploaderName || item.uploader || 'Unknown Artist',
      cover_url: item.thumbnail || item.thumbnailUrl || undefined,
      duration: item.duration || undefined,
    };
  }).filter((r: YTMusicResult) => r.videoId);
}

/** Search via Invidious API */
async function searchInvidious(query: string, instance: string): Promise<YTMusicResult[]> {
  const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Invidious ${res.status}`);
  const items: any[] = await res.json();
  return items.slice(0, 15).map((item: any) => {
    const { title, artist: parsedArtist } = cleanTitle(item.title || '');
    const thumb = item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url
      || item.videoThumbnails?.[0]?.url;
    return {
      id: `ytm-${item.videoId}`,
      videoId: item.videoId,
      title,
      artist: parsedArtist || item.author || 'Unknown Artist',
      cover_url: thumb,
      duration: item.lengthSeconds || undefined,
    };
  }).filter((r: YTMusicResult) => r.videoId);
}

/** Main search — rotates through instances until one works */
export async function searchYTMusic(query: string): Promise<YTMusicResult[]> {
  // Try Piped first
  for (const inst of PIPED_INSTANCES) {
    try {
      const results = await searchPiped(query, inst);
      if (results.length > 0) return results;
    } catch { /* next */ }
  }
  // Fallback to Invidious
  for (const inst of INVIDIOUS_INSTANCES) {
    try {
      const results = await searchInvidious(query, inst);
      if (results.length > 0) return results;
    } catch { /* next */ }
  }
  return [];
}

/** Resolve a direct audio stream URL for a video ID */
export async function resolveStreamUrl(videoId: string): Promise<string | null> {
  // Try Piped streams endpoint
  for (const inst of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${inst}/streams/${videoId}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      // Pick best audio stream
      const audioStreams = data.audioStreams || [];
      // Prefer m4a/mp4, then webm
      const m4a = audioStreams.find((s: any) =>
        s.mimeType?.includes('audio/mp4') || s.mimeType?.includes('audio/m4a')
      );
      const best = m4a || audioStreams[0];
      if (best?.url) return best.url;
    } catch { /* next */ }
  }
  return null;
}

/** Convert a YTMusicResult to a Song-compatible object with resolved stream */
export function ytResultToSong(r: YTMusicResult, streamUrl: string) {
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    cover_url: r.cover_url,
    audio_url: streamUrl,
    duration: r.duration,
  };
}
