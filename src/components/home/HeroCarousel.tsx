import { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';
import { usePlayer, type Song } from '@/contexts/PlayerContext';
import { detectCountry, getTrendingForCountry, prefetchPipedStream, resolvePipedStream, type PipedTrack } from '@/lib/pipedTrending';
import { flagFor } from '@/lib/geoLocation';
import { triggerHaptic } from '@/hooks/useHaptics';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * "For You" hero — auto-rotating cover-story cards from the real Piped
 * trending feed for the user's country. Swipeable, stale-while-revalidate.
 */
function HeroCarouselComponent() {
  const [slides, setSlides] = useState<PipedTrack[]>([]);
  const [active, setActive] = useState(0);
  const [country, setCountry] = useState('');
  const [resolving, setResolving] = useState(false);
  const { playSong } = usePlayer();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await detectCountry();
      if (cancelled) return;
      setCountry(c.cc);
      try {
        const fresh = await getTrendingForCountry(c.cc, {
          onCached: (cached) => { if (!cancelled && cached.length) setSlides(cached.slice(0, 5)); },
        });
        if (!cancelled) setSlides(fresh.slice(0, 5));
      } catch {/*ignore*/}
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-rotate every 5s
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  // Prefetch next slide stream
  useEffect(() => {
    if (!slides.length) return;
    const next = slides[(active + 1) % slides.length];
    if (next) prefetchPipedStream(next.videoId);
  }, [active, slides]);

  const handlePlay = useCallback(async (track: PipedTrack) => {
    triggerHaptic('selection');
    setResolving(true);
    const url = await resolvePipedStream(track.videoId);
    setResolving(false);
    if (!url) return;
    const queue: Song[] = slides.map((t) => ({
      id: t.id, title: t.title, artist: t.artist,
      cover_url: t.cover_url,
      audio_url: t.id === track.id ? url : 'resolving',
      duration: t.duration,
    }));
    const song = queue.find((s) => s.id === track.id)!;
    playSong(song, undefined, queue);
  }, [slides, playSong]);

  if (slides.length === 0) {
    return <Skeleton className="h-[200px] rounded-2xl bg-white/5" />;
  }

  const flag = flagFor(country);

  return (
    <section className="relative">
      <motion.div
        className="relative h-[200px] rounded-2xl overflow-hidden touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50) setActive((i) => (i + 1) % slides.length);
          else if (info.offset.x > 50) setActive((i) => (i - 1 + slides.length) % slides.length);
        }}
      >
        <AnimatePresence mode="wait">
          {slides.map((s, i) => i === active && (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => handlePlay(s)}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 text-left"
            >
              {s.cover_url ? (
                <img src={s.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" referrerPolicy="no-referrer" draggable={false} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40" />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.15) 100%)' }} />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="text-base leading-none">{flag || '🌍'}</span>
                <span className="text-[10px] font-bold tracking-[0.18em] text-white/90 uppercase">For You</span>
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white">
                #{s.rank} VIRAL
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 max-w-[58%] text-right">
                <p className="text-white text-[26px] font-extrabold leading-[1.05] line-clamp-2 drop-shadow-lg">{s.title}</p>
                <p className="mt-1 text-white/80 text-[12px] font-semibold truncate">{s.artist}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold shadow-lg">
                  {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" fill="currentColor" />}
                  PLAY NOW
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      <div className="flex justify-center gap-1.5 mt-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === active ? 18 : 6,
              background: i === active ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.25)',
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

const HeroCarousel = memo(HeroCarouselComponent);
HeroCarousel.displayName = 'HeroCarousel';
export default HeroCarousel;
