import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/hooks/useHaptics';
import { MUSIC_COLLECTIONS } from '@/lib/collections';

function CuratedCollectionsComponent() {
  const navigate = useNavigate();

  return (
    <section className="space-y-2.5">
      <h2 className="text-[20px] font-extrabold tracking-tight px-1">Curated Collections</h2>
      <div className="flex gap-2.5 overflow-x-auto hide-scrollbar -mx-3 px-3 pb-1 snap-x">
        {MUSIC_COLLECTIONS.map((c) => (
          <motion.button
            key={c.slug}
            onClick={() => { triggerHaptic('selection'); navigate(`/collection/${c.slug}`); }}
            whileTap={{ scale: 0.94 }}
            className="snap-start flex-shrink-0 w-[150px] h-[64px] rounded-xl px-3 flex items-center justify-between text-left text-white shadow-md"
            style={{
              background: c.gradient,
              border: '0.5px solid rgba(255,255,255,0.18)',
            }}
          >
            <p className="text-[12.5px] font-extrabold leading-[1.1] whitespace-pre-line drop-shadow-sm">
              {c.label}
            </p>
            <span className="text-[20px] leading-none drop-shadow-sm">{c.emoji}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

const CuratedCollections = memo(CuratedCollectionsComponent);
CuratedCollections.displayName = 'CuratedCollections';
export default CuratedCollections;
