import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to access device orientation (tilt) with fallbacks for keyboard.
 * Manages iOS permission requests.
 */
export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState({ gamma: 0, beta: 0, alpha: 0 });
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [isSupported, setIsSupported] = useState(true);

  // Initialize checks
  useEffect(() => {
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        setPermissionState('prompt');
      } else {
        // Automatically granted on non-iOS devices or older iOS
        setPermissionState('granted');
      }
    } else {
      setIsSupported(false);
      setPermissionState('denied');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setPermissionState('granted');
          return true;
        } else {
          setPermissionState('denied');
          return false;
        }
      } catch (error) {
        console.error("Error requesting device orientation permission:", error);
        setPermissionState('denied');
        return false;
      }
    } else {
      setPermissionState('granted');
      return true;
    }
  }, []);

  useEffect(() => {
    if (permissionState !== 'granted') return;

    const handleOrientation = (event) => {
      // event.gamma: left-to-right tilt in degrees, where right is positive (-90 to 90)
      // event.beta: front-to-back tilt in degrees, where front is positive (-180 to 180)
      // event.alpha: compass direction (0 to 360)
      setOrientation({
        gamma: event.gamma || 0,
        beta: event.beta || 0,
        alpha: event.alpha || 0,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permissionState]);

  // Keyboard fallback for desktop (left/right arrows mapped to gamma tilt)
  useEffect(() => {
    if (permissionState === 'granted' && isSupported) return; // Don't use fallback if actual motion is working

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setOrientation(prev => ({ ...prev, gamma: Math.max(prev.gamma - 10, -45) }));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setOrientation(prev => ({ ...prev, gamma: Math.min(prev.gamma + 10, 45) }));
      }
    };
    
    const handleKeyUp = (e) => {
      // Auto-center when keys are released
      if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) {
         setOrientation(prev => ({ ...prev, gamma: 0 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [permissionState, isSupported]);

  return { orientation, permissionState, requestPermission, isSupported };
}
