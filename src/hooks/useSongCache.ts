import { useCallback, useEffect, useRef, useState } from 'react';
import { Song } from '@/contexts/PlayerContext';

const CACHE_KEY = 'song_metadata_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  songs: Song[];
  timestamp: number;
}

// Get cached songs from localStorage
export const getCachedSongs = (): Song[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data.songs;
  } catch {
    return null;
  }
};

// Save songs to cache
export const cacheSongs = (songs: Song[]): void => {
  try {
    const data: CachedData = {
      songs,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or other error
  }
};

// Clear cache
export const clearSongCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
};

// Hook for managing song cache
export const useSongCache = () => {
  const [cachedSongs, setCachedSongs] = useState<Song[] | null>(null);

  useEffect(() => {
    const songs = getCachedSongs();
    if (songs) {
      setCachedSongs(songs);
    }
  }, []);

  const updateCache = useCallback((songs: Song[]) => {
    setCachedSongs(songs);
    cacheSongs(songs);
  }, []);

  return { cachedSongs, updateCache, clearCache: clearSongCache };
};

// Virtualized list hook for rendering only visible items
export const useVirtualizedList = <T>(
  items: T[],
  containerRef: React.RefObject<HTMLElement>,
  itemHeight: number,
  overscan = 3
) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleRange = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;
      
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.min(
        items.length,
        Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
      );
      
      setVisibleRange({ start, end });
    };

    updateVisibleRange();
    container.addEventListener('scroll', updateVisibleRange, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', updateVisibleRange);
    };
  }, [items.length, containerRef, itemHeight, overscan]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return { visibleItems, totalHeight, offsetY, visibleRange };
};
