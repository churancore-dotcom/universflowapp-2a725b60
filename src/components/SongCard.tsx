import React, { memo, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, ListPlus } from 'lucide-react';
import { usePlayer, Song } from '@/contexts/PlayerContext';
import { useDownloads } from '@/contexts/DownloadContext';
import { useNavigate } from 'react-router-dom';
import LikeButton from './LikeButton';
import AddToPlaylistModal from './AddToPlaylistModal';
import CreatePlaylistModal from './CreatePlaylistModal';
import OptimizedImage from './OptimizedImage';
import { triggerHaptic } from '@/hooks/useHaptics';

interface SongCardProps {
  song: Song;
  index?: number;
  sectionSongs?: Song[];
}

const SongCard = memo(({ song, index = 0, sectionSongs }: SongCardProps) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { isDownloaded, getDownloadedUrl } = useDownloads();
  const navigate = useNavigate();

  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);

  const isCurrentSong = useMemo(() => currentSong?.id === song.id, [currentSong?.id, song.id]);
  const downloaded = useMemo(() => isDownloaded(song.id), [isDownloaded, song.id]);

  const handleArtistClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (song.artist_id) {
      triggerHaptic('selection');
      navigate(`/artist/${song.artist_id}`);
    }
  }, [song.artist_id, navigate]);

  const handleClick = useCallback(() => {
    triggerHaptic('impactLight');
    if (isCurrentSong) {
      togglePlay();
    } else {
      const offlineUrl = getDownloadedUrl(song.id);
      playSong(song, offlineUrl, sectionSongs);
    }
  }, [isCurrentSong, togglePlay, getDownloadedUrl, song, playSong, sectionSongs]);

  const handleAddToPlaylist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    setShowAddToPlaylist(true);
  }, []);

  return (
    <div
      className="group relative flex-shrink-0 w-[160px] snap-start"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Album Art Container */}
      <motion.div
        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
        onClick={handleClick}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {/* Cover Image */}
        {song.cover_url ? (
          <OptimizedImage
            src={song.cover_url}
            alt={song.title}
            className="w-full h-full"
            eager={index < 4}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 flex items-center justify-center">
            <Play className="w-8 h-8 text-foreground/30" />
          </div>
        )}

        {/* Bottom gradient for readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Play/Pause overlay on active song */}
        {isCurrentSong && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'hsl(var(--primary))',
                boxShadow: '0 4px 20px hsl(var(--primary) / 0.5)',
              }}
            >
              {isPlaying ? (
                <div className="flex items-end gap-[3px] h-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-[3px] bg-primary-foreground rounded-full animate-audio-wave"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              ) : (
                <Pause className="w-4.5 h-4.5 text-primary-foreground" />
              )}
            </div>
          </div>
        )}

        {/* Quick actions — top right */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
          <LikeButton
            songId={song.id}
            size="sm"
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm"
          />
          <button
            onClick={handleAddToPlaylist}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-foreground/80 active:bg-black/60 transition-colors"
          >
            <ListPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Downloaded indicator */}
        {downloaded && (
          <div className="absolute top-2 left-2 z-10">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </motion.div>

      {/* Song Meta */}
      <div className="mt-2 px-0.5">
        <p className={`font-semibold text-[13px] truncate leading-tight ${isCurrentSong ? 'text-primary' : 'text-foreground'}`}>
          {song.title}
        </p>
        <button
          className="flex items-center gap-1.5 mt-0.5 min-h-[32px]"
          onClick={handleArtistClick}
        >
          {song.artist_photo_url && (
            <img
              src={song.artist_photo_url}
              alt={song.artist}
              className="w-4 h-4 rounded-full object-cover ring-1 ring-white/10"
              loading="lazy"
            />
          )}
          <p className={`text-xs text-muted-foreground/70 truncate ${song.artist_id ? 'active:text-primary transition-colors' : ''}`}>
            {song.artist}
          </p>
        </button>
      </div>

      {/* Modals */}
      {showAddToPlaylist && (
        <AddToPlaylistModal
          isOpen={showAddToPlaylist}
          onClose={() => setShowAddToPlaylist(false)}
          song={song}
          onCreateNew={() => {
            setShowAddToPlaylist(false);
            setShowCreatePlaylist(true);
          }}
        />
      )}
      {showCreatePlaylist && (
        <CreatePlaylistModal
          isOpen={showCreatePlaylist}
          onClose={() => setShowCreatePlaylist(false)}
          onCreated={() => {
            setShowCreatePlaylist(false);
            setShowAddToPlaylist(true);
          }}
        />
      )}
    </div>
  );
});

SongCard.displayName = 'SongCard';

export default SongCard;
