import { useState, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Repeat1, ChevronDown, ListMusic, Share2, Waves } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';
import { iosSpring, iosBounce } from '@/lib/animations';
import DownloadButton from './DownloadButton';
import LikeButton from './LikeButton';
import ShareSongModal from './ShareSongModal';
import AddToPlaylistModal from './AddToPlaylistModal';
import CreatePlaylistModal from './CreatePlaylistModal';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Ultra-premium spring config
const ultraSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

const magneticSpring = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

// Custom haptic volume slider component
const HapticVolumeSlider = ({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (value: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const glowIntensity = useMemo(() => Math.min(value * 1.5, 1), [value]);
  
  return (
    <motion.div 
      className="relative w-full h-1.5 rounded-full bg-white/10 cursor-pointer overflow-visible"
      animate={{
        boxShadow: isDragging 
          ? `0 0 ${20 * glowIntensity}px ${8 * glowIntensity}px rgba(var(--primary-rgb), ${0.3 + glowIntensity * 0.4})`
          : `0 0 ${10 * glowIntensity}px ${4 * glowIntensity}px rgba(var(--primary-rgb), ${0.1 + glowIntensity * 0.2})`,
      }}
      transition={{ duration: 0.2 }}
    >
      <Slider
        value={[value * 100]}
        max={100}
        step={1}
        onValueChange={([v]) => {
          onChange(v / 100);
          setIsDragging(true);
        }}
        onValueCommit={() => setIsDragging(false)}
        className="cursor-pointer [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg"
      />
      {/* Glow pulse animation */}
      <motion.div 
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={isDragging ? {
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{
          background: `linear-gradient(90deg, transparent, rgba(var(--primary-rgb), ${glowIntensity * 0.5}), transparent)`,
        }}
      />
    </motion.div>
  );
};

const FullscreenPlayer = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    shuffle,
    repeat,
    isExpanded,
    crossfade,
    togglePlay,
    nextSong,
    prevSong,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    setExpanded,
    toggleCrossfade
  } = usePlayer();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const navigate = useNavigate();

  // Play button rotation for smooth icon transition
  const playRotation = useMotionValue(0);
  const smoothRotation = useSpring(playRotation, { stiffness: 300, damping: 20 });

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      setExpanded(false);
    }
  };

  const handlePlayToggle = () => {
    // Trigger rotation animation on toggle
    playRotation.set(playRotation.get() + 360);
    togglePlay();
  };

  if (!currentSong || !isExpanded) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #1c1c1e 0%, #000000 100%)',
          }}
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={handleDragEnd}
        >
          {/* Ultra Mesh Background - responds to album art */}
          <div className="absolute inset-0 overflow-hidden">
            {currentSong.cover_url && (
              <motion.img
                src={currentSong.cover_url}
                alt=""
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[80%] object-cover blur-[100px]"
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ 
                  opacity: 0.15, 
                  scale: isPlaying ? 1.6 : 1.5,
                  filter: `blur(100px) saturate(${isPlaying ? 2.1 : 1.5})`,
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            )}
            {/* Glassmorphism overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"
              style={{
                backdropFilter: 'blur(50px) saturate(210%)',
              }}
            />
          </div>

          <div className="relative flex flex-col h-full px-8 py-6 md:px-16 lg:px-32 safe-area-pt safe-area-pb">
            {/* iOS-style drag indicator */}
            <motion.div 
              className="w-9 h-1 rounded-full bg-white/30 mx-auto mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <motion.button
                className="p-2 -ml-2 rounded-full"
                onClick={() => setExpanded(false)}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.85 }}
                transition={iosBounce}
              >
                <ChevronDown className="w-7 h-7" />
              </motion.button>
              
              <motion.p 
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Now Playing
              </motion.p>
              
              <motion.button
                className="p-2 -mr-2 rounded-full"
                onClick={() => setShowPlaylistModal(true)}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.85 }}
                transition={iosBounce}
              >
                <ListMusic className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Album Art - Ultra Premium with breathing effect */}
            <div className="flex-1 flex items-center justify-center py-4">
              <motion.div
                className="relative w-72 h-72 md:w-80 md:h-80 lg:w-[360px] lg:h-[360px]"
                layoutId="album-art"
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ 
                  scale: isPlaying ? 1.0 : 0.92, 
                  opacity: isPlaying ? 1 : 0.75, 
                  y: 0,
                  filter: isPlaying ? 'blur(0px)' : 'blur(2px)',
                }}
                transition={{ ...ultraSpring, delay: 0.1 }}
              >
                {/* Outer glow ring */}
                <motion.div
                  className="absolute -inset-4 rounded-3xl"
                  animate={{
                    boxShadow: isPlaying 
                      ? '0 0 60px 15px rgba(var(--primary-rgb), 0.3), 0 30px 60px -12px rgba(0, 0, 0, 0.8)'
                      : '0 0 30px 5px rgba(var(--primary-rgb), 0.1), 0 20px 40px -12px rgba(0, 0, 0, 0.6)',
                    scale: isPlaying ? [1, 1.02, 1] : 1,
                  }}
                  transition={isPlaying ? { 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  } : { duration: 0.5 }}
                />
                
                <motion.div 
                  className="w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {currentSong.cover_url ? (
                    <img
                      src={currentSong.cover_url}
                      alt={currentSong.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center">
                      <div className="flex items-end gap-1.5 h-28">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`w-3.5 rounded-full bg-gradient-to-t from-white/50 to-white ${
                              isPlaying ? 'animate-equalizer' : ''
                            }`}
                            style={{
                              animationDelay: `${i * 0.12}s`,
                              height: isPlaying ? undefined : '24px',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* Song Info */}
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...iosSpring, delay: 0.15 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <motion.h2
                    className="text-2xl md:text-3xl font-bold truncate"
                    layoutId="song-title"
                  >
                    {currentSong.title}
                  </motion.h2>
                  <motion.div
                    className={`mt-1 flex items-center gap-2 ${currentSong.artist_id ? 'cursor-pointer' : ''}`}
                    layoutId="song-artist"
                    onClick={() => {
                      if (currentSong.artist_id) {
                        setExpanded(false);
                        navigate(`/artist/${currentSong.artist_id}`);
                      }
                    }}
                    whileHover={currentSong.artist_id ? { scale: 1.02 } : {}}
                    whileTap={currentSong.artist_id ? { scale: 0.98 } : {}}
                  >
                    {currentSong.artist_photo_url && (
                      <img 
                        src={currentSong.artist_photo_url} 
                        alt={currentSong.artist}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    )}
                    <span className="text-xl text-primary font-medium hover:underline">
                      {currentSong.artist}
                    </span>
                  </motion.div>
                </div>
                <div className="flex items-center gap-2">
                  <DownloadButton song={currentSong} size="md" />
                  <motion.button
                    className="p-2 rounded-full"
                    onClick={() => setShowShareModal(true)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    transition={iosBounce}
                  >
                    <Share2 className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                  </motion.button>
                  <LikeButton songId={currentSong.id} size="md" />
                </div>
              </div>
            </motion.div>

            {/* Progress - iOS style */}
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Slider
                value={[progress]}
                max={duration || 100}
                step={0.1}
                onValueChange={([value]) => seek(value)}
                className="cursor-pointer [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:bg-white"
              />
              <div className="flex justify-between mt-2 text-[11px] font-medium text-muted-foreground tracking-wide">
                <span>{formatTime(progress)}</span>
                <span>-{formatTime(Math.max(0, duration - progress))}</span>
              </div>
            </motion.div>

            {/* Main Controls - Ultra Premium with physics */}
            <motion.div 
              className="flex items-center justify-center gap-10 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...iosSpring, delay: 0.25 }}
            >
              <motion.button
                className="p-3"
                onClick={prevSong}
                whileHover={{ scale: 1.15, x: -3 }}
                whileTap={{ scale: 0.8, x: -8 }}
                transition={ultraSpring}
              >
                <SkipBack className="w-8 h-8" fill="currentColor" />
              </motion.button>
              
              {/* Ultra Premium Play/Pause Button */}
              <motion.button
                className="w-[76px] h-[76px] rounded-full bg-white flex items-center justify-center text-black relative overflow-hidden"
                onClick={handlePlayToggle}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.08 }}
                transition={ultraSpring}
                style={{
                  boxShadow: isPlaying 
                    ? '0 8px 40px rgba(255,255,255,0.4), 0 0 60px rgba(var(--primary-rgb), 0.3)'
                    : '0 8px 30px rgba(0,0,0,0.3)',
                  rotate: smoothRotation,
                }}
              >
                {/* Inner glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    background: isPlaying 
                      ? 'radial-gradient(circle at center, rgba(var(--primary-rgb), 0.1) 0%, transparent 70%)'
                      : 'transparent',
                  }}
                />
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div
                      key="pause"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={ultraSpring}
                    >
                      <Pause className="w-9 h-9" fill="black" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ scale: 0, rotate: 90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: -90 }}
                      transition={ultraSpring}
                    >
                      <Play className="w-9 h-9 ml-1" fill="black" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              
              <motion.button
                className="p-3"
                onClick={nextSong}
                whileHover={{ scale: 1.15, x: 3 }}
                whileTap={{ scale: 0.8, x: 8 }}
                transition={ultraSpring}
              >
                <SkipForward className="w-8 h-8" fill="currentColor" />
              </motion.button>
            </motion.div>

            {/* Secondary Controls with Kinetic Toggles */}
            <motion.div 
              className="flex items-center justify-between mt-8 px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Shuffle with magnetic pull effect */}
              <motion.button
                className={`p-2.5 rounded-full transition-colors relative ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={toggleShuffle}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                transition={magneticSpring}
              >
                {shuffle && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    layoutId="shuffle-glow"
                    style={{
                      boxShadow: '0 0 20px 5px rgba(var(--primary-rgb), 0.3)',
                    }}
                  />
                )}
                <Shuffle className="w-5 h-5 relative z-10" />
              </motion.button>

              {/* Crossfade toggle with glow */}
              <motion.button
                className={`p-2.5 rounded-full transition-colors relative ${crossfade ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={toggleCrossfade}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                transition={magneticSpring}
                title={crossfade ? 'Crossfade On' : 'Crossfade Off'}
              >
                {crossfade && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      boxShadow: '0 0 20px 5px rgba(var(--primary-rgb), 0.3)',
                    }}
                  />
                )}
                <Waves className="w-5 h-5 relative z-10" />
              </motion.button>
              
              {/* Haptic Volume Slider */}
              <div className="flex items-center gap-3 w-32">
                <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <HapticVolumeSlider value={volume} onChange={setVolume} />
              </div>
              
              {/* Repeat with magnetic pull effect */}
              <motion.button
                className={`p-2.5 rounded-full transition-colors relative ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={toggleRepeat}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                transition={magneticSpring}
              >
                {repeat !== 'off' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      boxShadow: '0 0 20px 5px rgba(var(--primary-rgb), 0.3)',
                    }}
                  />
                )}
                {repeat === 'one' ? (
                  <Repeat1 className="w-5 h-5 relative z-10" />
                ) : (
                  <Repeat className="w-5 h-5 relative z-10" />
                )}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <ShareSongModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        song={currentSong} 
      />
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        song={currentSong}
        onCreateNew={() => setShowCreatePlaylist(true)}
      />
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onCreated={() => {}}
      />
    </>
  );
};

export default FullscreenPlayer;
