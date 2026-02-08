import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Heart, LayoutGrid, List, Music2 } from 'lucide-react';
import { Song, usePlayer } from '@/contexts/PlayerContext';
import { useDownloads } from '@/contexts/DownloadContext';
import OptimizedImage from './OptimizedImage';
import LikeButton from './LikeButton';
import { triggerHaptic } from '@/hooks/useHaptics';

interface AllSongsSectionProps {
  songs: Song[];
}

// Compact song row for list view
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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onClick={handleClick}
      className={`flex items-center gap-3 p-2.5 rounded-xl active:scale-[0.98] transition-all cursor-pointer ${
        isCurrentSong 
          ? 'bg-primary/15 border border-primary/30' 
          : 'bg-white/5 hover:bg-white/10 border border-transparent'
      }`}
    >
      {/* Track number / Playing indicator */}
      <div className="w-6 text-center flex-shrink-0">
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
          <span className="text-xs text-muted-foreground/60 font-medium">{index + 1}</span>
        )}
      </div>

      {/* Album art */}
      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
        {song.cover_url ? (
          <OptimizedImage
            src={song.cover_url}
            alt={song.title}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <Music2 className="w-4 h-4 text-white/50" />
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
        <p className={`font-medium text-sm truncate ${isCurrentSong ? 'text-primary' : 'text-foreground'}`}>
          {song.title}
        </p>
        <p className="text-xs text-muted-foreground/70 truncate">{song.artist}</p>
      </div>

      {/* Duration & Like */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground/50 w-10 text-right">
          {formatDuration(song.duration)}
        </span>
        <LikeButton songId={song.id} size="sm" className="w-8 h-8" />
      </div>
    </motion.div>
  );
});

SongRow.displayName = 'SongRow';

// Compact grid card
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onClick={handleClick}
      className="group cursor-pointer active:scale-[0.96] transition-transform"
    >
      {/* Album art */}
      <div className={`relative aspect-square rounded-xl overflow-hidden shadow-lg mb-2 ${
        isCurrentSong ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : ''
      }`}>
        {song.cover_url ? (
          <OptimizedImage
            src={song.cover_url}
            alt={song.title}
            className="w-full h-full"
            eager={index < 8}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-500/20 to-accent/30 flex items-center justify-center">
            <Music2 className="w-6 h-6 text-white/50" />
          </div>
        )}
        
        {/* Overlay on hover/active */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center">
          {isCurrentSong && isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Now playing indicator */}
        {isCurrentSong && (
          <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <div className="flex items-center justify-center gap-[2px] h-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-[2px] bg-white rounded-full ${
                    isPlaying ? 'animate-audio-wave' : 'h-[3px]'
                  }`}
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Downloaded badge */}
        {downloaded && !isCurrentSong && (
          <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Song info */}
      <p className={`font-semibold text-xs truncate ${isCurrentSong ? 'text-primary' : 'text-foreground'}`}>
        {song.title}
      </p>
      <p className="text-[10px] text-muted-foreground/70 truncate">{song.artist}</p>
    </motion.div>
  );
});

CompactGridCard.displayName = 'CompactGridCard';

const AllSongsSection = memo(({ songs }: AllSongsSectionProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAll, setShowAll] = useState(false);
  
  // Show first 12 in grid, 8 in list by default
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
    <section className="mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            All Songs
          </h2>
          <p className="text-xs text-muted-foreground/70 mt-0.5 font-medium">
            {songs.length} tracks in your library
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <button
            onClick={toggleViewMode}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            {viewMode === 'grid' ? (
              <List className="w-4 h-4 text-white/80" />
            ) : (
              <LayoutGrid className="w-4 h-4 text-white/80" />
            )}
          </button>
        </div>
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
            className="grid grid-cols-3 gap-3"
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
            className="space-y-2"
          >
            {displayedSongs.map((song, index) => (
              <SongRow key={song.id} song={song} index={index} songs={songs} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show more/less button */}
      {songs.length > displayCount && (
        <button
          onClick={toggleShowAll}
          className="w-full mt-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/80 active:bg-white/10 transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${songs.length} Songs`}
        </button>
      )}
    </section>
  );
});

AllSongsSection.displayName = 'AllSongsSection';

export default AllSongsSection;
