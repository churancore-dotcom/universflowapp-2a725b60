import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(340 100% 50% / 0.25), transparent 60%)',
          filter: 'blur(100px)',
        }}
        initial={{ x: '-30%', y: '-40%', scale: 0.6, opacity: 0 }}
        animate={{ x: '-20%', y: '-30%', scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(260 100% 60% / 0.2), transparent 60%)',
          filter: 'blur(100px)',
        }}
        initial={{ x: '30%', y: '40%', scale: 0.6, opacity: 0 }}
        animate={{ x: '20%', y: '30%', scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut', delay: 0.2 }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(210 100% 60% / 0.15), transparent 60%)',
          filter: 'blur(80px)',
        }}
        initial={{ x: '0%', y: '0%', scale: 0.5, opacity: 0 }}
        animate={{ x: '10%', y: '-10%', scale: 1.2, opacity: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut', delay: 0.4 }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* Glassmorphism logo container */}
        <motion.div
          className="relative"
          initial={{ scale: 0.3, opacity: 0, rotateY: -90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            mass: 1,
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute -inset-4 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, hsl(340 100% 50% / 0.4), hsl(260 100% 60% / 0.3), hsl(210 100% 60% / 0.3), hsl(340 100% 50% / 0.4))',
              filter: 'blur(20px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Glass card */}
          <div
            className="w-32 h-32 rounded-[28px] flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Inner shine */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 55%, transparent 60%)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, delay: 0.8, ease: 'easeInOut' }}
            />

            {/* "U" Logo */}
            <svg width="60" height="60" viewBox="0 0 64 64">
              <defs>
                <linearGradient id="uGradSplash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF2D55" />
                  <stop offset="50%" stopColor="#BF5AF2" />
                  <stop offset="100%" stopColor="#5E5CE6" />
                </linearGradient>
              </defs>
              <path
                d="M18 16 L18 38 C18 49 25 55 32 55 C39 55 46 49 46 38 L46 16"
                stroke="url(#uGradSplash)"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <motion.circle
                cx="32"
                cy="12"
                r="2.5"
                fill="#FF2D55"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 400 }}
              />
            </svg>
          </div>
        </motion.div>

        {/* Waveform loading animation */}
        <motion.div
          className="flex items-end justify-center gap-[3px] mt-10 h-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                background: 'linear-gradient(to top, #FF2D55, #BF5AF2)',
              }}
              animate={{
                height: [6, 16 + Math.random() * 16, 8, 20 + Math.random() * 12, 6],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>

        {/* Brand name with stagger */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-4xl font-bold tracking-tight">
            <span
              style={{
                background: 'linear-gradient(135deg, #FF2D55, #BF5AF2, #5E5CE6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Univers
            </span>
            <span className="text-white ml-1.5 font-light">Flow</span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-3 text-[13px] tracking-[0.2em] uppercase font-medium"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.2em' }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          Premium Music Experience
        </motion.p>

        {/* Developer credit - glassmorphism pill */}
        <motion.div
          className="mt-8 px-5 py-2 rounded-full flex items-center gap-2"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#FF2D55', boxShadow: '0 0 8px #FF2D55' }}
          />
          <p className="text-[11px] text-white/40 tracking-wider">
            Crafted by{' '}
            <span className="text-white/70 font-semibold">SHASHANK YADAV</span>
          </p>
        </motion.div>

        {/* Skip button */}
        <motion.button
          onClick={onComplete}
          className="mt-6 px-6 py-2.5 rounded-full text-white/50 text-xs font-medium tracking-wider uppercase active:scale-95 transition-all"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          whileTap={{ scale: 0.92 }}
        >
          Skip →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
