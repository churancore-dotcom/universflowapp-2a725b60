import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, LayoutGrid, List, Music2 } from 'lucide-react';
import { Song, usePlayer } from '@/contexts/PlayerContext';
import { useDownloads } from '@/contexts/DownloadContext';
import OptimizedImage from './OptimizedImage';
import LikeButton from './LikeButton';
import { triggerHaptic } from '@/hooks/useHaptics';

interface AllSongsSectionProps {
  songs: Song[];
}

// ── Apple Music-style list row ──
const SongRow = memo(({ song, index, songs }: { song: Song; index: number; songs: Song[] }) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { isDownloaded, getDownloadedUrl } = useDownloads();

  const isCurrentSong = currentSong?.id === song.id;
  const downloaded = isDownloaded(song.id);

  const handleClick = useCallback(() => {
    triggerHaptic('impactLight');
    if (isCurrentSong) {
      togglePlay();
    } else {
      const offlineUrl = getDownloadedUrl(song.id);
      playSong(song, offlineUrl, songs);
    }
  }, [isCurrentSong, togglePlay, getDownloadedUrl, song, playSong, songs]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.25 }}
      onClick={handleClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl active:scale-[0.98] transition-all cursor-pointer ${
        isCurrentSong
          ? 'bg-primary/10'
          : 'active:bg-white/5'
      }`}
    >
      {/* Rank / Playing indicator */}
      <div className="w-5 text-center flex-shrink-0">
        {isCurrentSong ? (
          <div className="flex items-center justify-center gap-[2px] h-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-[3px] bg-primary rounded-full ${
                  isPlaying ? 'animate-audio-wave' : 'h-[4px]'
                }`}
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/40 font-semibold tabular-nums">{index + 1}</span>
        )}
      </div>

      {/* Album art */}
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
        {song.cover_url ? (
          <OptimizedImage src={song.cover_url} alt={song.title} className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Music2 className="w-4 h-4 text-foreground/30" />
          </div>
        )}
        {downloaded && (
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-[13px] truncate ${isCurrentSong ? 'text-primary' : 'text-foreground'}`}>
          {song.title}
        </p>
        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{song.artist}</p>
      </div>

      {/* Duration & Like */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px] text-muted-foreground/40 w-9 text-right tabular-nums font-medium">
          {formatDuration(song.duration)}
        </span>
        <LikeButton songId={song.id} size="sm" className="w-8 h-8" />
      </div>
    </motion.div>
  );
});

SongRow.displayName = 'SongRow';

// ── Apple Music-style grid card ──
const CompactGridCard = memo(({ song, index, songs }: { song: Song; index: number; songs: Song[] }) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { isDownloaded, getDownloadedUrl } = useDownloads();

  const isCurrentSong = currentSong?.id === song.id;
  const downloaded = isDownloaded(song.id);

  const handleClick = useCallback(() => {
    triggerHaptic('impactLight');
    if (isCurrentSong) {
      togglePlay();
    } else {
      const offlineUrl = getDownloadedUrl(song.id);
      playSong(song, offlineUrl, songs);
    }
  }, [isCurrentSong, togglePlay, getDownloadedUrl, song, playSong, songs]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.025, duration: 0.25 }}
      onClick={handleClick}
      className="cursor-pointer active:scale-[0.95] transition-transform"
    >
      {/* Album art */}
      <div className={`relative aspect-square rounded-xl overflow-hidden mb-1.5 ${
        isCurrentSong ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'shadow-md'
      }`}>
        {song.cover_url ? (
          <OptimizedImage src={song.cover_url} alt={song.title} className="w-full h-full" eager={index < 9} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
            <Music2 className="w-6 h-6 text-foreground/20" />
          </div>
        )}

        {/* Play overlay on active */}
        {isCurrentSong && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--primary))', boxShadow: '0 2px 12px hsl(var(--primary) / 0.5)' }}
            >
              {isPlaying ? (
                <div className="flex items-end gap-[2px] h-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-[2px] bg-primary-foreground rounded-full animate-audio-wave"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              ) : (
                <Pause className="w-3.5 h-3.5 text-primary-foreground" />
              )}
            </div>
          </div>
        )}

        {/* Downloaded badge */}
        {downloaded && !isCurrentSong && (
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Song info */}
      <p className={`font-semibold text-[11px] truncate leading-tight ${isCurrentSong ? 'text-primary' : 'text-foreground'}`}>
        {song.title}
      </p>
      <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{song.artist}</p>
    </motion.div>
  );
});

CompactGridCard.displayName = 'CompactGridCard';

// ── Main Section ──
const AllSongsSection = memo(({ songs }: AllSongsSectionProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAll, setShowAll] = useState(false);

  const displayCount = viewMode === 'grid' ? 12 : 8;
  const displayedSongs = showAll ? songs : songs.slice(0, displayCount);

  const toggleViewMode = useCallback(() => {
    triggerHaptic('selection');
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  const toggleShowAll = useCallback(() => {
    triggerHaptic('selection');
    setShowAll(prev => !prev);
  }, []);

  return (
    <section className="mb-2">
      <div
        className="rounded-2xl p-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">All Songs</h2>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-medium">
              {songs.length} tracks
            </p>
          </div>
          <button
            onClick={toggleViewMode}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid rgba(255,255,255,0.08)',
            }}
          >
            {viewMode === 'grid' ? (
              <List className="w-3.5 h-3.5 text-foreground/60" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5 text-foreground/60" />
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-3 gap-2.5"
            >
              {displayedSongs.map((song, index) => (
                <CompactGridCard key={song.id} song={song} index={index} songs={songs} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-0.5"
            >
              {displayedSongs.map((song, index) => (
                <SongRow key={song.id} song={song} index={index} songs={songs} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show more */}
        {songs.length > displayCount && (
          <button
            onClick={toggleShowAll}
            className="w-full mt-3 py-2.5 rounded-xl text-xs font-semibold text-primary active:bg-primary/10 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.06)',
            }}
          >
            {showAll ? 'Show Less' : `Show All ${songs.length} Songs`}
          </button>
        )}
      </div>
    </section>
  );
});

AllSongsSection.displayName = 'AllSongsSection';

export default AllSongsSection;
