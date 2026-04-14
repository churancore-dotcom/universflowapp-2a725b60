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

// Allow liking ANY song — stream songs get stored by their stream ID
export const canLikeSong = (_song?: ActionableSongLike | null) => {
  return Boolean(_song?.id);
};

// Allow downloading ANY song that has an audio URL
export const canDownloadSong = (song?: ActionableSongLike | null) => {
  return Boolean(song?.audio_url);
};

export const getLikeUnavailableMessage = () => 'Unable to add this song to your library right now.';

export const getDownloadUnavailableMessage = (song?: ActionableSongLike | null) => {
  if (!song?.audio_url) {
    return 'This track has no audio URL available for download.';
  }
  return 'This track cannot be downloaded right now.';
};
