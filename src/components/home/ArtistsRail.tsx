import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, Plus, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { triggerHaptic } from '@/hooks/useHaptics';
import {
  followArtist,
  getUserArtistPrefs,
  unfollowArtist,
  type UserArtistPref,
} from '@/lib/userArtistPrefs';
import { getFeaturedIndexedArtists } from '@/lib/indexedArtists';

interface DisplayArtist {
  key: string;
  name: string;
  image: string | null;
  followed: boolean;
}

const ArtistTile = memo(function ArtistTile({
  artist,
  index,
  onOpen,
  onToggleFollow,
}: {
  artist: DisplayArtist;
  index: number;
  onOpen: () => void;
  onToggleFollow: () => void;
}) {
  return (
    <motion.div
      className="flex-shrink-0 w-[88px] snap-start text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.25 }}
    >
      <button
        type="button"
        onClick={() => { triggerHaptic('selection'); onOpen(); }}
        className="relative block w-full"
      >
        {/* Rose glow ring */}
        <div
          className="relative w-[84px] h-[84px] mx-auto rounded-full p-[2px]"
          style={{
            background: 'linear-gradient(135deg, #FF2D55 0%, #FF6A8B 50%, #FF2D55 100%)',
            boxShadow: '0 0 18px rgba(255,45,85,0.45), 0 8px 22px rgba(0,0,0,0.55)',
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-black">
            {artist.image ? (
              <img
                src={artist.image}
                alt={artist.name}
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 to-accent/20">
                <User className="w-7 h-7 text-white/60" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); triggerHaptic('impactLight'); onToggleFollow(); }}
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: artist.followed ? '#FF2D55' : 'rgba(0,0,0,0.9)',
              border: '2px solid #000',
            }}
            aria-label={artist.followed ? 'Unfollow' : 'Follow'}
          >
            {artist.followed ? (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            ) : (
              <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
          </button>
        </div>
        <p className="mt-2.5 truncate text-[13px] font-bold leading-tight text-white px-1">
          {artist.name}
        </p>
        <p className="text-[10px] text-white/45 mt-0.5">
          {artist.followed ? 'Following' : 'Artist'}
        </p>
      </button>
    </motion.div>
  );
});

const ArtistsRail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followedPrefs, setFollowedPrefs] = useState<UserArtistPref[]>([]);
  const [discover, setDiscover] = useState<DisplayArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prefs, indexed] = await Promise.all([
          user ? getUserArtistPrefs(user.id) : Promise.resolve([] as UserArtistPref[]),
          getFeaturedIndexedArtists(20),
        ]);
        if (cancelled) return;
        setFollowedPrefs(prefs);
        const followedSet = new Set(prefs.map((p) => p.artist_name.toLowerCase()));
        const disc = indexed
          .filter((a) => !followedSet.has(a.name.toLowerCase()))
          .map((a) => ({ key: a.id, name: a.name, image: a.image_url || null, followed: false }));
        setDiscover(disc);
      } catch (e) {
        console.error('ArtistsRail load failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleToggleFollow = async (name: string, image: string | null, currentlyFollowed: boolean) => {
    if (!user) { navigate('/auth'); return; }
    if (currentlyFollowed) {
      await unfollowArtist(user.id, name);
      setFollowedPrefs((prev) => prev.filter((p) => p.artist_name.toLowerCase() !== name.toLowerCase()));
      setDiscover((prev) => [{ key: name, name, image, followed: false }, ...prev]);
    } else {
      await followArtist(user.id, name, { image, source: 'lastfm' });
      setFollowedPrefs((prev) => [
        { id: name, artist_name: name, artist_image: image, artist_source: 'lastfm', created_at: new Date().toISOString() },
        ...prev,
      ]);
      setDiscover((prev) => prev.filter((a) => a.name.toLowerCase() !== name.toLowerCase()));
    }
  };

  const followedDisplay: DisplayArtist[] = followedPrefs.map((p) => ({
    key: p.id,
    name: p.artist_name,
    image: p.artist_image,
    followed: true,
  }));

  // Followed first, then discover, deduped
  const combined: DisplayArtist[] = [...followedDisplay, ...discover];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,45,85,0.18)',
              border: '0.5px solid rgba(255,45,85,0.35)',
            }}
          >
            <Sparkles className="w-4 h-4 text-rose-500" fill="currentColor" />
          </div>
          <h2 className="text-[18px] font-extrabold tracking-tight text-white">Featured Artists</h2>
        </div>
        <button
          onClick={() => { triggerHaptic('selection'); navigate('/artists'); }}
          className="flex items-center gap-0.5 text-[13px] font-bold text-rose-500 active:opacity-60"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[88px] flex-shrink-0">
              <div className="w-[84px] h-[84px] rounded-full bg-white/5 animate-pulse mx-auto" />
              <div className="h-3 mt-2 mx-2 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          {combined.map((a, i) => (
            <ArtistTile
              key={a.key}
              artist={a}
              index={i}
              onOpen={() => navigate(`/artists?focus=${encodeURIComponent(a.name)}`)}
              onToggleFollow={() => handleToggleFollow(a.name, a.image, a.followed)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ArtistsRail);
