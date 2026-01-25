import { useEffect, useRef, useState } from 'react';

// Image cache using IndexedDB for persistence
const DB_NAME = 'image-cache';
const STORE_NAME = 'images';
const CACHE_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, CACHE_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });
  
  return dbPromise;
};

const getCachedImage = async (url: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(url);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.blob) {
          resolve(URL.createObjectURL(result.blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const cacheImage = async (url: string, blob: Blob): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ url, blob, timestamp: Date.now() });
  } catch {
    // Silent fail
  }
};

// In-memory cache for fast access
const memoryCache = new Map<string, string>();

export const useImageCache = (url: string | undefined) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    // Check memory cache first
    if (memoryCache.has(url)) {
      setCachedUrl(memoryCache.get(url)!);
      setIsLoading(false);
      return;
    }

    let objectUrl: string | null = null;

    const loadImage = async () => {
      // Check IndexedDB cache
      const cached = await getCachedImage(url);
      if (cached && mountedRef.current) {
        memoryCache.set(url, cached);
        setCachedUrl(cached);
        setIsLoading(false);
        return;
      }

      // Fetch and cache
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        
        if (mountedRef.current) {
          memoryCache.set(url, objectUrl);
          setCachedUrl(objectUrl);
          setIsLoading(false);
          
          // Cache in IndexedDB asynchronously
          cacheImage(url, blob);
        }
      } catch {
        // Fallback to original URL
        if (mountedRef.current) {
          setCachedUrl(url);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      // Don't revoke if it's in memory cache (shared)
      if (objectUrl && !memoryCache.has(url)) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  return { cachedUrl: cachedUrl || url, isLoading };
};

// Hook for lazy loading images with intersection observer
export const useLazyImage = (url: string | undefined, options?: IntersectionObserverInit) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [options]);

  const { cachedUrl, isLoading } = useImageCache(shouldLoad ? url : undefined);

  return { 
    elementRef, 
    cachedUrl: shouldLoad ? cachedUrl : undefined, 
    isLoading: shouldLoad ? isLoading : true,
    isVisible 
  };
};

// Preload images for better UX
export const preloadImages = (urls: string[]) => {
  urls.forEach((url) => {
    if (!memoryCache.has(url)) {
      const img = new Image();
      img.src = url;
    }
  });
};
