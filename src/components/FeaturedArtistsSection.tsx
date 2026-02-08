import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Music, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { triggerHaptic } from '@/hooks/useHaptics';

interface Artist {
  id: string;
  name: string;
  photo_url: string | null;
  genre: string | null;
  song_count: number;
}

interface ArtistCardProps {
  artist: Artist;
  index: number;
}

const ArtistCard = memo(({ artist, index }: ArtistCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    triggerHaptic('selection');
    navigate(`/artist/${artist.id}`);
  };

  return (
    <motion.button
      className="flex-shrink-0 w-20 snap-start text-center"
      onClick={handleClick}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      whileTap={{ scale: 0.92 }}
    >
      {/* Avatar with gradient border */}
      <div className="relative w-16 h-16 mx-auto mb-2">
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(330 100% 60%))',
            padding: '2px',
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-black">
            {artist.photo_url ? (
              <img 
                src={artist.photo_url} 
                alt={artist.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <User className="w-6 h-6 text-white/50" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-xs font-semibold truncate text-foreground">
        {artist.name}
      </p>
      <p className="text-[10px] text-muted-foreground/70">
        {artist.song_count} {artist.song_count === 1 ? 'song' : 'songs'}
      </p>
    </motion.button>
  );
});

ArtistCard.displayName = 'ArtistCard';

const FeaturedArtistsSection = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data: artistsData } = await supabase
        .from('artists')
        .select('id, name, photo_url, genre');

      if (artistsData) {
        const artistsWithCounts = await Promise.all(
          artistsData.map(async (artist) => {
            const { count } = await supabase
              .from('songs')
              .select('*', { count: 'exact', head: true })
              .eq('artist_id', artist.id)
              .eq('is_visible', true);

            return { ...artist, song_count: count || 0 };
          })
        );

        const sorted = artistsWithCounts
          .filter(a => a.song_count > 0)
          .sort((a, b) => b.song_count - a.song_count)
          .slice(0, 12);

        setArtists(sorted);
      }
      setLoading(false);
    };

    fetchArtists();
  }, []);

  if (loading || artists.length === 0) return null;

  return (
    <section className="mb-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-bold tracking-tight text-foreground">Artists</h2>
      </div>
      
      {/* Horizontal scroll */}
      <div 
        className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory -mx-3 px-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {artists.map((artist, i) => (
          <ArtistCard key={artist.id} artist={artist} index={i} />
        ))}
      </div>
    </section>
  );
};

export default memo(FeaturedArtistsSection);
