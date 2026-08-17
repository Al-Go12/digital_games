import { useState, useEffect, useRef } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export function usePoseTracking(videoRef, isEnabled = false) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [poseData, setPoseData] = useState(null); 
  const landmarkerRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let active = true;

    async function initializePoseTracking() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });

        if (active) {
          landmarkerRef.current = poseLandmarker;
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load PoseLandmarker:", error);
        if (active) setDemoMode(true);
      }
    }

    if (isEnabled && !landmarkerRef.current && !demoMode) {
      initializePoseTracking();
    }

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [isEnabled, demoMode]);

  const smoothedPoseRef = useRef(new Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0 }));

  // Main prediction loop
  useEffect(() => {
    if (!isEnabled || demoMode) return;

    let isFirstFrame = true;

    const predictWebcam = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && landmarkerRef.current) {
        let startTimeMs = performance.now();
        if (lastVideoTimeRef.current !== video.currentTime) {
          lastVideoTimeRef.current = video.currentTime;
          const results = landmarkerRef.current.detectForVideo(video, startTimeMs);
          
          if (results.landmarks && results.landmarks.length > 0) {
            const rawLandmarks = results.landmarks[0];
            
            if (isFirstFrame) {
              // Initialize smoothing array directly with first frame
              smoothedPoseRef.current = rawLandmarks.map(lm => ({...lm}));
              isFirstFrame = false;
            } else {
              // Apply EMA smoothing to every landmark
              const SMOOTHING_FACTOR = 0.3; // Very heavy smoothing for body pose stability
              smoothedPoseRef.current = rawLandmarks.map((lm, idx) => {
                const prev = smoothedPoseRef.current[idx];
                return {
                  x: prev.x + (lm.x - prev.x) * SMOOTHING_FACTOR,
                  y: prev.y + (lm.y - prev.y) * SMOOTHING_FACTOR,
                  z: prev.z + (lm.z - prev.z) * SMOOTHING_FACTOR,
                  visibility: lm.visibility // don't smooth visibility
                };
              });
            }
            
            setPoseData([...smoothedPoseRef.current]);
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

  return { 
    isLoaded, 
    poseData,
    demoMode,
    enableDemoMode: () => setDemoMode(true)
  };
}
