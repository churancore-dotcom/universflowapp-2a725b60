export interface ActionableSongLike {
  id?: string | null;
  source?: string | null;
  audio_url?: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isCatalogSongId = (songId?: string | null) => Boolean(songId && UUID_PATTERN.test(songId));

export const isIndexedSong = (song?: ActionableSongLike | null) => {
  const id = song?.id ?? '';
  return song?.source === 'indexed' || id.startsWith('lfm-');
};

export const isAudiusSong = (song?: ActionableSongLike | null) => {
  const id = song?.id ?? '';
  return song?.source === 'audius' || id.startsWith('audius-');
};

export const canLikeSong = (song?: ActionableSongLike | null) => {
  if (!song?.id) return false;
  return isCatalogSongId(song.id) && !isIndexedSong(song) && !isAudiusSong(song);
};

export const canDownloadSong = (song?: ActionableSongLike | null) => {
  if (!song?.audio_url) return false;
  return !isIndexedSong(song);
};

export const getLikeUnavailableMessage = () => 'Only Univers Flow catalog songs can be added to your library.';

export const getDownloadUnavailableMessage = (song?: ActionableSongLike | null) => {
  if (isIndexedSong(song)) {
    return 'Web stream tracks are playback-only and cannot be downloaded.';
  }

  return 'This track cannot be downloaded right now.';
};