import { useState, useEffect, useRef } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export function useHandTracking(videoRef, isEnabled = false) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [handData, setHandData] = useState(null); // Stores normalized coordinates x,y
  const landmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // Fallback state for demo mode
  const [demoMode, setDemoMode] = useState(false);
  const [demoPosition, setDemoPosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    let active = true;

    async function initializeHandTracking() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (active) {
          landmarkerRef.current = handLandmarker;
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load HandLandmarker:", error);
        if (active) setDemoMode(true); // Fallback if loading fails
      }
    }

    if (isEnabled && !landmarkerRef.current && !demoMode) {
      initializeHandTracking();
    }

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [isEnabled, demoMode]);

  // Main prediction loop
  useEffect(() => {
    if (!isEnabled || demoMode) return;

    const smoothedDataRef = useRef({ x: 0.5, y: 0.5 });
    
    const predictWebcam = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && landmarkerRef.current) {
        let startTimeMs = performance.now();
        if (lastVideoTimeRef.current !== video.currentTime) {
          lastVideoTimeRef.current = video.currentTime;
          const results = landmarkerRef.current.detectForVideo(video, startTimeMs);
          
          if (results.landmarks && results.landmarks.length > 0) {
            const hand = results.landmarks[0];
            // Use landmark 9 (middle finger MCP) as a stable cursor point
            const targetPoint = hand[9];
            
            // Raw values (mirror X)
            const rawX = 1 - targetPoint.x;
            const rawY = targetPoint.y;
            
            // Exponential Moving Average (EMA) for smooth "perfect" tracking
            const SMOOTHING_FACTOR = 0.4; // Lower = smoother but more delay
            smoothedDataRef.current.x = smoothedDataRef.current.x + (rawX - smoothedDataRef.current.x) * SMOOTHING_FACTOR;
            smoothedDataRef.current.y = smoothedDataRef.current.y + (rawY - smoothedDataRef.current.y) * SMOOTHING_FACTOR;
            
            setHandData({
              x: smoothedDataRef.current.x, 
              y: smoothedDataRef.current.y,
              landmarks: hand
            });
          }
        }
      }
      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    if (isLoaded) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isEnabled, isLoaded, videoRef, demoMode]);

  // Mouse fallback handling
  useEffect(() => {
    if (!isEnabled || !demoMode) return;

    const handleMouseMove = (e) => {
      setDemoPosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    
    // For touch devices fallback
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        setDemoPosition({
          x: e.touches[0].clientX / window.innerWidth,
          y: e.touches[0].clientY / window.innerHeight
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isEnabled, demoMode]);

  return { 
    isLoaded, 
    handData: demoMode ? { x: demoPosition.x, y: demoPosition.y, landmarks: null } : handData,
    demoMode,
    enableDemoMode: () => setDemoMode(true)
  };
}
