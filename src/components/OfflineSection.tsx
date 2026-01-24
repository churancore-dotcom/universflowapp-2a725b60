import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff, Music, Play, Trash2, WifiOff, Download, Sparkles } from 'lucide-react';
import { usePlayer, Song } from '@/contexts/PlayerContext';
import { useDownloads } from '@/contexts/DownloadContext';
import { iosSpring, iosBounce } from '@/lib/animations';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

interface OfflineSectionProps {
  isOffline: boolean;
}

const OfflineSection = memo(function OfflineSection({ isOffline }: OfflineSectionProps) {
  const { playSong, currentSong, isPlaying, setQueue } = usePlayer();
  const { downloads, removeSong, getDownloadedUrl, totalStorageUsed, clearAllDownloads } = useDownloads();

  const handlePlaySong = (song: Song) => {
    const offlineUrl = getDownloadedUrl(song.id);
    playSong(song, offlineUrl);
  };

  const handlePlayAll = () => {
    if (downloads.length === 0) return;
    const songs = downloads as Song[];
    setQueue(songs);
    const offlineUrl = getDownloadedUrl(songs[0].id);
    playSong(songs[0], offlineUrl);
  };

  if (!isOffline && downloads.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={iosSpring}
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isOffline 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
              }}
              animate={isOffline ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-white" />
              ) : (
                <CloudOff className="w-5 h-5 text-white" />
              )}
            </motion.div>
            <div>
              <h2 className="text-lg font-bold">
                {isOffline ? 'You\'re Offline' : 'Downloaded Music'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {downloads.length} songs • {formatBytes(totalStorageUsed)}
              </p>
            </div>
          </div>
          
          {downloads.length > 0 && (
            <motion.button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-4 h-4" fill="currentColor" />
              Play All
            </motion.button>
          )}
        </div>

        {/* Offline Banner when offline */}
        {isOffline && (
          <motion.div
            className="p-4 mb-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-400">No Internet Connection</p>
                <p className="text-xs text-muted-foreground">
                  Your downloaded songs are available offline
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Downloads List */}
        {downloads.length === 0 ? (
          <motion.div 
            className="text-center py-12 rounded-2xl"
            style={{
              background: 'rgba(28, 28, 30, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={iosSpring}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(118, 118, 128, 0.12)' }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...iosBounce, delay: 0.1 }}
            >
              <Download className="w-8 h-8 text-muted-foreground/50" />
            </motion.div>
            <p className="text-muted-foreground font-medium">No downloaded songs</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Download songs to listen offline
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {downloads.map((song, index) => {
              const isActive = currentSong?.id === song.id;
              return (
                <motion.div
                  key={song.id}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.1))'
                      : 'rgba(28, 28, 30, 0.6)',
                    border: isActive 
                      ? '1px solid rgba(139, 92, 246, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...iosSpring, delay: index * 0.03 }}
                >
                  <motion.button
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                    onClick={() => handlePlaySong(song)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                      {song.cover_url ? (
                        <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-muted-foreground" />
                      )}
                      {/* Offline badge */}
                      <div className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-lg bg-green-500 flex items-center justify-center">
                        <CloudOff className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-[15px] truncate ${isActive ? 'text-primary' : ''}`}>
                        {song.title}
                      </p>
                      <p className="text-[13px] text-muted-foreground truncate">{song.artist}</p>
                      <p className="text-[11px] text-muted-foreground/60">{formatBytes(song.size)}</p>
                    </div>
                  </motion.button>
                  
                  {isActive && isPlaying ? (
                    <div className="flex items-end gap-[3px] h-4 mr-2">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-[3px] bg-primary rounded-full"
                          animate={{ height: [5, 14, 5] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  ) : (
                    <motion.button
                      className="p-2 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeSong(song.id)}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
            
            {/* Clear All Button */}
            {downloads.length > 1 && (
              <motion.button
                className="w-full mt-4 py-3 rounded-xl text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                onClick={clearAllDownloads}
                whileTap={{ scale: 0.98 }}
              >
                Clear All Downloads
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

export default OfflineSection;
