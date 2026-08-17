import { useEffect, useRef } from 'react';

/**
 * A custom hook to run a game loop using requestAnimationFrame.
 * 
 * @param {Function} callback - The function to call on every frame. Receives deltaTime in ms.
 * @param {boolean} isRunning - Whether the loop should be running.
 */
export function useGameLoop(callback, isRunning = true) {
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);
  
  // Keep the latest callback in a ref so we don't need to restart the loop on every render
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = time => {
      if (previousTimeRef.current != null) {
        const deltaTime = time - previousTimeRef.current;
        callbackRef.current(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      previousTimeRef.current = null;
      if (requestRef.current != null) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current != null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning]);
}
