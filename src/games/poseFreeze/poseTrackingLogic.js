import { useState, useCallback, useRef } from 'react';

export function usePoseTrackingLogic(handData) {
  const [matchScore, setMatchScore] = useState(0);
  const [stabilityScore, setStabilityScore] = useState(100);
  
  const previousPoseRef = useRef(null);

  const calculateMatch = useCallback((targetPose) => {
    if (!handData || !handData.landmarks) return 0;
    
    // Evaluate based on config function
    const match = targetPose.check(handData.landmarks);
    setMatchScore(Math.round(match));
    return match;
  }, [handData]);

  const calculateStability = useCallback(() => {
    if (!handData || !handData.landmarks) return 100;
    
    let stability = stabilityScore;
    
    if (previousPoseRef.current) {
      // Calculate jitter/movement across key hand landmarks (wrist, tips)
      let totalMovement = 0;
      const keyLandmarks = [0, 4, 8, 12, 16, 20]; 
      
      keyLandmarks.forEach(idx => {
        if (handData.landmarks[idx] && previousPoseRef.current[idx]) {
          const dx = handData.landmarks[idx].x - previousPoseRef.current[idx].x;
          const dy = handData.landmarks[idx].y - previousPoseRef.current[idx].y;
          totalMovement += Math.sqrt(dx*dx + dy*dy);
        }
      });

      // If movement is high, drop stability
      if (totalMovement > 0.05) {
        stability -= (totalMovement * 200);
      } else {
        stability += 2; // recover quickly if still
      }
    }
    
    previousPoseRef.current = handData.landmarks;
    
    const finalStability = Math.max(0, Math.min(100, Math.round(stability)));
    setStabilityScore(finalStability);
    return finalStability;
  }, [handData, stabilityScore]);

  const resetTracking = useCallback(() => {
    setMatchScore(0);
    setStabilityScore(100);
    previousPoseRef.current = null;
  }, []);

  return { matchScore, stabilityScore, calculateMatch, calculateStability, resetTracking };
}
