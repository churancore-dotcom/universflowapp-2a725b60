import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useLike } from '@/hooks/useLike';
import { iosBounce } from '@/lib/animations';

interface LikeButtonProps {
  songId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LikeButton = ({ songId, size = 'md', className = '' }: LikeButtonProps) => {
  const { isLiked, isLoading, toggleLike } = useLike(songId);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.button
      className={`rounded-full flex items-center justify-center transition-colors ${sizeClasses[size]} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleLike();
      }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      transition={iosBounce}
      disabled={isLoading}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={`${iconSizes[size]} transition-colors ${
            isLiked 
              ? 'text-primary fill-primary' 
              : 'text-muted-foreground hover:text-primary'
          }`}
          fill={isLiked ? 'currentColor' : 'none'}
        />
      </motion.div>
      
      {/* Heart burst animation when liked */}
      {isLiked && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [1, 0.5, 0] }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full h-full rounded-full bg-primary/20" />
        </motion.div>
      )}
    </motion.button>
  );
};

export default LikeButton;
