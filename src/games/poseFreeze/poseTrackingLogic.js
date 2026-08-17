import { useState, useCallback, useRef } from 'react';
import { POSE_FREEZE_CONFIG } from './config';

export function usePoseTrackingLogic(poseData) {
  const [matchScore, setMatchScore] = useState(0);
  const [stabilityScore, setStabilityScore] = useState(100);
  
  const previousPoseRef = useRef(null);

  const calculateMatch = useCallback((targetPose) => {
    if (!poseData) return 0;
    
    // Evaluate based on config function
    const match = targetPose.check(poseData);
    setMatchScore(Math.round(match));
    return match;
  }, [poseData]);

  const calculateStability = useCallback(() => {
    if (!poseData) return 100;
    
    let stability = stabilityScore;
    
    if (previousPoseRef.current) {
      // Calculate jitter/movement across key landmarks
      let totalMovement = 0;
      const keyLandmarks = [11, 12, 13, 14, 15, 16]; // Shoulders, elbows, wrists
      
      keyLandmarks.forEach(idx => {
        if (poseData[idx] && previousPoseRef.current[idx]) {
          const dx = poseData[idx].x - previousPoseRef.current[idx].x;
          const dy = poseData[idx].y - previousPoseRef.current[idx].y;
          totalMovement += Math.sqrt(dx*dx + dy*dy);
        }
      });

      // If movement is high, drop stability
      if (totalMovement > 0.1) {
        stability -= (totalMovement * 50);
      } else {
        stability += 1; // recover slightly if still
      }
    }
    
    previousPoseRef.current = poseData;
    
    const finalStability = Math.max(0, Math.min(100, Math.round(stability)));
    setStabilityScore(finalStability);
    return finalStability;
  }, [poseData, stabilityScore]);

  const resetTracking = useCallback(() => {
    setMatchScore(0);
    setStabilityScore(100);
    previousPoseRef.current = null;
  }, []);

  return { matchScore, stabilityScore, calculateMatch, calculateStability, resetTracking };
}
