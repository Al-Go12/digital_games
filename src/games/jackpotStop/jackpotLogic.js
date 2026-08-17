import { useState, useRef, useCallback } from 'react';
import { JACKPOT_CONFIG } from './config';

export function useJackpotLogic(orientation) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [markerX, setMarkerX] = useState(JACKPOT_CONFIG.TRACK_WIDTH / 2); // Start in middle
  
  // Physics refs
  const velocityRef = useRef(0);
  const positionRef = useRef(JACKPOT_CONFIG.TRACK_WIDTH / 2);

  const currentRound = JACKPOT_CONFIG.ROUNDS[roundIndex];

  const updatePhysics = useCallback((deltaTime) => {
    if (!currentRound) return;

    // Use gamma tilt (-45 to 45) for acceleration
    let tilt = orientation.gamma || 0;
    if (tilt < -45) tilt = -45;
    if (tilt > 45) tilt = 45;

    // Acceleration based on tilt
    const acceleration = (tilt / 45) * 1500 * currentRound.speedMultiplier; // pixels per second squared
    
    // Apply acceleration to velocity
    velocityRef.current += (acceleration * deltaTime) / 1000;
    
    // Apply friction
    velocityRef.current *= 0.95; // dampening

    // Apply velocity to position
    positionRef.current += (velocityRef.current * deltaTime) / 1000;

    // Bounce off edges
    if (positionRef.current < 0) {
      positionRef.current = 0;
      velocityRef.current *= -0.5;
    } else if (positionRef.current > JACKPOT_CONFIG.TRACK_WIDTH) {
      positionRef.current = JACKPOT_CONFIG.TRACK_WIDTH;
      velocityRef.current *= -0.5;
    }

    setMarkerX(positionRef.current);
  }, [orientation, currentRound]);

  const stopAndCalculate = useCallback(() => {
    if (!currentRound) return null;

    const center = JACKPOT_CONFIG.TRACK_WIDTH / 2;
    const distanceToCenter = Math.abs(positionRef.current - center);
    
    let result = 'miss';
    let earned = 0;

    if (distanceToCenter <= currentRound.targetWidth / 2) {
      result = 'perfect';
      earned = currentRound.scorePerfect;
    } else if (distanceToCenter <= currentRound.targetWidth) {
      result = 'close';
      earned = currentRound.scoreClose;
    }

    setScore(prev => prev + earned);
    
    return { result, earned };
  }, [currentRound]);

  const nextRound = useCallback(() => {
    setRoundIndex(prev => prev + 1);
    positionRef.current = JACKPOT_CONFIG.TRACK_WIDTH / 2; // Reset position
    velocityRef.current = 0;
    setMarkerX(JACKPOT_CONFIG.TRACK_WIDTH / 2);
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setRoundIndex(0);
    positionRef.current = JACKPOT_CONFIG.TRACK_WIDTH / 2;
    velocityRef.current = 0;
    setMarkerX(JACKPOT_CONFIG.TRACK_WIDTH / 2);
  }, []);

  return {
    roundIndex,
    currentRound,
    score,
    markerX,
    updatePhysics,
    stopAndCalculate,
    nextRound,
    resetGame,
    isGameOver: roundIndex >= JACKPOT_CONFIG.ROUNDS.length
  };
}
