import React, { memo, useCallback, useMemo, useState } from 'react';
import { Play, Pause, ListPlus } from 'lucide-react';
import { usePlayer, Song } from '@/contexts/PlayerContext';
import { useDownloads } from '@/contexts/DownloadContext';
import { useNavigate } from 'react-router-dom';
import DownloadButton from './DownloadButton';
import LikeButton from './LikeButton';
import AddToPlaylistModal from './AddToPlaylistModal';
import CreatePlaylistModal from './CreatePlaylistModal';
import OptimizedImage from './OptimizedImage';

interface SongCardProps {
  song: Song;
  index?: number;
}

// Simple CSS-only audio wave - no framer-motion for performance
const AudioWave = memo(({ isPlaying }: { isPlaying: boolean }) => (
  <div className="flex items-end gap-[3px] h-4">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={`w-[3px] bg-white rounded-full transition-all duration-300 ${
          isPlaying ? 'animate-audio-wave' : 'h-[5px]'
        }`}
        style={{ animationDelay: `${i * 0.12}s` }}
      />
    ))}
  </div>
));

AudioWave.displayName = 'AudioWave';

const SongCard = memo(({ song, index = 0 }: SongCardProps) => {
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
      navigate(`/artist/${song.artist_id}`);
    }
  }, [song.artist_id, navigate]);

  const handleClick = useCallback(() => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      const offlineUrl = getDownloadedUrl(song.id);
      playSong(song, offlineUrl);
    }
  }, [isCurrentSong, togglePlay, getDownloadedUrl, song, playSong]);

  const handleAddToPlaylist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddToPlaylist(true);
  }, []);

  return (
    <div
      className="group relative flex-shrink-0 w-[140px] min-[375px]:w-[150px] sm:w-[160px] md:w-[170px] snap-start active:scale-[0.97] transition-transform duration-150 will-change-transform"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Card Container - iOS 18 style */}
      <div
        className="relative aspect-square rounded-[16px] min-[375px]:rounded-[18px] sm:rounded-[20px] overflow-hidden bg-muted/30 cursor-pointer shadow-lg"
        onClick={handleClick}
      >
        {/* Cover Image - Lazy loaded */}
        {song.cover_url ? (
          <OptimizedImage
            src={song.cover_url}
            alt={song.title}
            className="w-full h-full"
            eager={index < 4} // Eager load first 4 items
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-500/20 to-accent/30 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            </div>
          </div>
        )}
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
        
        {/* Action buttons - always visible on mobile, smaller touch targets */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 flex flex-col gap-1">
          <LikeButton songId={song.id} size="sm" className="bg-black/50 backdrop-blur-md rounded-full w-7 h-7 sm:w-8 sm:h-8" />
          <DownloadButton song={song} size="sm" />
          <button
            onClick={handleAddToPlaylist}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-primary transition-colors"
          >
            <ListPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
        
        {/* Downloaded badge */}
        {downloaded && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Center play button - visible on hover (desktop) */}
        <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 flex items-center justify-center shadow-xl active:scale-90 transition-transform">
            {isCurrentSong && isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="black" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-black ml-0.5" fill="black" />
            )}
          </div>
        </div>

        {/* Now Playing indicator */}
        {isCurrentSong && (
          <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <AudioWave isPlaying={isPlaying} />
            </div>
          </div>
        )}
      </div>
      
      {/* Song Info - responsive typography */}
      <div className="mt-2 sm:mt-2.5 px-0.5">
        <p className={`font-semibold text-[13px] sm:text-[14px] truncate leading-tight ${isCurrentSong ? 'text-primary' : 'text-foreground'}`}>
          {song.title}
        </p>
        <div 
          className="flex items-center gap-1 sm:gap-1.5 mt-0.5 cursor-pointer group/artist"
          onClick={handleArtistClick}
        >
          {song.artist_photo_url && (
            <img 
              src={song.artist_photo_url} 
              alt={song.artist}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover"
              loading="lazy"
            />
          )}
          <p className={`text-[11px] sm:text-[12px] text-muted-foreground/80 truncate font-medium ${song.artist_id ? 'group-hover/artist:text-primary transition-colors' : ''}`}>
            {song.artist}
          </p>
        </div>
      </div>

      {/* Add to Playlist Modal - Lazy mounted */}
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

      {/* Create Playlist Modal - Lazy mounted */}
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
