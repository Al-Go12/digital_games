import { useState, useCallback, useRef } from 'react';
import { BALANCE_CONFIG } from './config';

export function useBalanceLogic(orientationData) {
  const [ballX, setBallX] = useState(0); // Center is 0
  const [score, setScore] = useState(0);
  const [isFallen, setIsFallen] = useState(false);
  
  const velocityRef = useRef(0);
  const positionRef = useRef(0);
  const scoreAccumulatorRef = useRef(0);

  // We map gamma (-90 to 90) to the board rotation
  const getTiltAngle = () => {
    let gamma = orientationData?.gamma || 0;
    // Clamp gamma to max tilt
    if (gamma > BALANCE_CONFIG.MAX_TILT_ANGLE) gamma = BALANCE_CONFIG.MAX_TILT_ANGLE;
    if (gamma < -BALANCE_CONFIG.MAX_TILT_ANGLE) gamma = -BALANCE_CONFIG.MAX_TILT_ANGLE;
    return gamma;
  };

  const updatePhysics = useCallback((deltaTime) => {
    if (isFallen) return;

    // deltaTime is in ms, convert to seconds
    const dt = deltaTime / 1000;
    const angle = getTiltAngle();
    
    // Convert angle to radians for physics
    const angleRad = angle * (Math.PI / 180);

    // Acceleration along the incline: a = g * sin(theta)
    const acceleration = BALANCE_CONFIG.GRAVITY * Math.sin(angleRad);

    // Update velocity and apply friction
    velocityRef.current += acceleration * dt;
    velocityRef.current *= BALANCE_CONFIG.FRICTION; // simple dampening

    // Update position
    positionRef.current += velocityRef.current * dt;

    // Check bounds
    const maxBound = (BALANCE_CONFIG.PLANK_WIDTH / 2) + BALANCE_CONFIG.BALL_RADIUS;
    if (Math.abs(positionRef.current) > maxBound) {
      setIsFallen(true);
    } else {
      setBallX(positionRef.current);
      
      // Update score
      scoreAccumulatorRef.current += BALANCE_CONFIG.SCORE_PER_SECOND * dt;
      setScore(Math.floor(scoreAccumulatorRef.current));
    }
  }, [orientationData, isFallen]);

  const resetGame = useCallback(() => {
    setBallX(0);
    setScore(0);
    setIsFallen(false);
    velocityRef.current = 0;
    positionRef.current = 0;
    scoreAccumulatorRef.current = 0;
  }, []);

  return {
    ballX,
    score,
    isFallen,
    tiltAngle: getTiltAngle(),
    updatePhysics,
    resetGame
  };
}
