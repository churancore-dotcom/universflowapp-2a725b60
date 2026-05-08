import { useEffect, useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Play, Pause, Loader2 } from 'lucide-react';
import { usePlayer, type Song } from '@/contexts/PlayerContext';
import { detectCountry, getTrendingForCountry, prefetchPipedStream, resolvePipedStream, type PipedTrack } from '@/lib/pipedTrending';
import { flagFor } from '@/lib/geoLocation';
import { Skeleton } from '@/components/ui/skeleton';

function ViralByCountrySectionComponent() {
  const [geo, setGeo] = useState<{ cc: string; name: string } | null>(null);
  const [tracks, setTracks] = useState<PipedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  // Parallel: country + trending fire concurrently with stale-while-revalidate.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const country = await detectCountry();
      if (cancelled) return;
      setGeo({ cc: country.cc, name: country.name });
      try {
        const fresh = await getTrendingForCountry(country.cc, {
          onCached: (cached) => {
            if (!cancelled && cached.length) { setTracks(cached); setLoading(false); }
          },
        });
        if (!cancelled) { setTracks(fresh); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Background refresh every 5 min (silent SWR)
  useEffect(() => {
    if (!geo) return;
    const id = setInterval(async () => {
      try {
        const fresh = await getTrendingForCountry(geo.cc, { force: true });
        if (fresh.length) setTracks(fresh);
      } catch { /* ignore */ }
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [geo]);

  // Prefetch streams for top 3 → instant tap-to-play
  useEffect(() => {
    tracks.slice(0, 3).forEach((t) => prefetchPipedStream(t.videoId));
  }, [tracks]);

  const handlePlay = useCallback(async (track: PipedTrack) => {
    if (currentSong?.id === track.id) { togglePlay(); return; }
    setResolvingId(track.id);
    const url = await resolvePipedStream(track.videoId);
    setResolvingId(null);
    if (!url) return;
    const queue: Song[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      cover_url: t.cover_url,
      audio_url: t.id === track.id ? url : 'resolving',
      duration: t.duration,
    }));
    const song = queue.find((s) => s.id === track.id)!;
    playSong(song, undefined, queue);
  }, [tracks, currentSong, togglePlay, playSong]);

  const flag = flagFor(geo?.cc || '');
  const heading = geo?.name ? `Viral in ${geo.name}` : 'Viral right now';

  return (
    <section className="mb-2">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-[20px] leading-none">{flag}</span>
        <h2 className="text-[20px] font-bold tracking-tight">{heading}</h2>
        <Flame className="w-4 h-4 text-primary" />
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-1 -mx-1 px-1">
        {loading && tracks.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[148px]">
                <Skeleton className="w-[148px] h-[148px] rounded-md bg-white/5" />
                <Skeleton className="mt-2 w-3/4 h-3 bg-white/5" />
                <Skeleton className="mt-1 w-1/2 h-2.5 bg-white/5" />
              </div>
            ))
          : tracks.map((track, i) => {
              const isActive = currentSong?.id === track.id;
              const isResolving = resolvingId === track.id;
              return (
                <motion.button
                  key={track.id}
                  onClick={() => handlePlay(track)}
                  whileTap={{ scale: 0.95 }}
                  className="snap-start flex-shrink-0 w-[148px] text-left"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.2) }}
                >
                  <div className="relative w-[148px] h-[148px] rounded-md overflow-hidden bg-muted shadow-lg">
                    {track.cover_url_low ? (
                      <img src={track.cover_url_low} alt={track.title} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
                    )}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-sm text-white">
                      #{track.rank}
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-xl">
                      {isResolving ? (
                        <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                      ) : isActive && isPlaying ? (
                        <Pause className="w-4 h-4 text-primary-foreground" fill="currentColor" />
                      ) : (
                        <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
                      )}
                    </div>
                  </div>
                  <p className={`mt-2 font-semibold text-[13px] truncate ${isActive ? 'text-primary' : ''}`}>
                    {track.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 truncate">{track.artist}</p>
                </motion.button>
              );
            })}
      </div>
    </section>
  );
}

const ViralByCountrySection = memo(ViralByCountrySectionComponent);
ViralByCountrySection.displayName = 'ViralByCountrySection';
export default ViralByCountrySection;
