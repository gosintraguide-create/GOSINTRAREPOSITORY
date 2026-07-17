import { useEffect, useRef } from 'react';

/**
 * Hook to maintain active connections and sync data even when tab is in background
 * Prevents the browser from throttling timers and suspending the app
 */
export function useBackgroundSync(callback: () => void, interval: number = 30000) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<number>();
  const isVisibleRef = useRef(true);

  // Update callback ref when it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      
      if (isVisibleRef.current) {
        console.log('📱 App visible - maintaining active sync');
        // Immediately sync when coming back to foreground
        savedCallback.current();
      } else {
        console.log('📱 App backgrounded - continuing background sync');
        // Keep syncing in background at same interval
      }
    };

    // Start the interval timer
    const tick = () => {
      savedCallback.current();
    };

    intervalRef.current = window.setInterval(tick, interval);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent page from being suspended on mobile
    // Use a no-op audio element to keep the page active
    let audioElement: HTMLAudioElement | null = null;
    
    if ('Audio' in window) {
      // Create a silent audio element that loops
      // This prevents mobile browsers from suspending the page
      audioElement = new Audio();
      audioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      audioElement.loop = true;
      audioElement.volume = 0;
      
      // Play silently to keep app active
      audioElement.play().catch((err) => {
        console.log('Silent audio not needed:', err.message);
      });
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (audioElement) {
        audioElement.pause();
        audioElement = null;
      }
    };
  }, [interval]);

  return {
    isVisible: isVisibleRef.current,
  };
}
