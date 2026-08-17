import { useState, useCallback, useRef } from 'react';
import { BALANCE_CONFIG } from './config';

export function useBalanceLogic(orientationData) {
  const [ballX, setBallX] = useState(0); // Center is 0
  const [score, setScore] = useState(0);
  const [isFallen, setIsFallen] = useState(false);
  const [plankWidth, setPlankWidth] = useState(BALANCE_CONFIG.INITIAL_PLANK_WIDTH);
  
  // Wind state for UI rendering
  const [windState, setWindState] = useState({ active: false, direction: 0 }); // direction: -1 (left), 1 (right)
  
  // Active spawned items (gems, anvils) for UI rendering
  const [items, setItems] = useState([]);
  
  // Floating score popups (+50!)
  const [scorePopups, setScorePopups] = useState([]);

  const velocityRef = useRef(0);
  const positionRef = useRef(0);
  const scoreAccumulatorRef = useRef(0);
  const currentPlankWidthRef = useRef(BALANCE_CONFIG.INITIAL_PLANK_WIDTH);

  // Timers and counters
  const timeElapsedMsRef = useRef(0);
  const nextWindTimeMsRef = useRef(BALANCE_CONFIG.WIND_INTERVAL_MS);
  const windEndTimeMsRef = useRef(0);
  const windDirectionRef = useRef(0);

  const nextSpawnTimeMsRef = useRef(BALANCE_CONFIG.SPAWN_INTERVAL_MS);
  const itemsRef = useRef([]);

  // Map gamma (-90 to 90) to tilt angle
  const getTiltAngle = () => {
    let gamma = orientationData?.gamma || 0;
    if (gamma > BALANCE_CONFIG.MAX_TILT_ANGLE) gamma = BALANCE_CONFIG.MAX_TILT_ANGLE;
    if (gamma < -BALANCE_CONFIG.MAX_TILT_ANGLE) gamma = -BALANCE_CONFIG.MAX_TILT_ANGLE;
    return gamma;
  };

  const updatePhysics = useCallback((deltaTime) => {
    if (isFallen) return;

    const dt = deltaTime / 1000;
    timeElapsedMsRef.current += deltaTime;

    // 1. Dynamic Plank Shrinking
    if (currentPlankWidthRef.current > BALANCE_CONFIG.MIN_PLANK_WIDTH) {
      currentPlankWidthRef.current = Math.max(
        BALANCE_CONFIG.MIN_PLANK_WIDTH,
        currentPlankWidthRef.current - BALANCE_CONFIG.PLANK_SHRINK_RATE * dt
      );
      setPlankWidth(currentPlankWidthRef.current);
    }

    // 2. Wind System Logic
    if (!windDirectionRef.current && timeElapsedMsRef.current >= nextWindTimeMsRef.current) {
      // Trigger new wind gust
      const dir = Math.random() < 0.5 ? -1 : 1;
      windDirectionRef.current = dir;
      windEndTimeMsRef.current = timeElapsedMsRef.current + BALANCE_CONFIG.WIND_DURATION_MS;
      nextWindTimeMsRef.current = timeElapsedMsRef.current + BALANCE_CONFIG.WIND_INTERVAL_MS;
      setWindState({ active: true, direction: dir });
    }

    if (windDirectionRef.current && timeElapsedMsRef.current >= windEndTimeMsRef.current) {
      // End current wind gust
      windDirectionRef.current = 0;
      setWindState({ active: false, direction: 0 });
    }

    // 3. Item Spawner (Gems & Anvils)
    if (timeElapsedMsRef.current >= nextSpawnTimeMsRef.current) {
      nextSpawnTimeMsRef.current = timeElapsedMsRef.current + BALANCE_CONFIG.SPAWN_INTERVAL_MS;
      
      const halfWidth = (currentPlankWidthRef.current / 2) - 30;
      const spawnX = (Math.random() * 2 - 1) * halfWidth; // random position on plank
      const isAnvil = Math.random() < 0.35; // 35% chance for Anvil hazard, 65% for Gem bonus

      const newItem = {
        id: Date.now() + Math.random(),
        type: isAnvil ? 'anvil' : 'gem',
        x: spawnX,
        collected: false
      };

      itemsRef.current.push(newItem);
      setItems([...itemsRef.current]);
    }

    // 4. Calculate Physics Forces
    const angle = getTiltAngle();
    const angleRad = angle * (Math.PI / 180);

    // Gravity force along incline: a = g * sin(theta)
    let acceleration = BALANCE_CONFIG.GRAVITY * Math.sin(angleRad);

    // Add Wind Force vector
    if (windDirectionRef.current !== 0) {
      acceleration += windDirectionRef.current * BALANCE_CONFIG.WIND_FORCE;
    }

    // Check Anvils sitting on plank that apply extra weight force
    itemsRef.current.forEach(item => {
      if (item.type === 'anvil' && !item.collected) {
        // If anvil is on left (negative X), pushes board down left (adds negative acceleration)
        // If anvil is on right (positive X), pushes board down right (adds positive acceleration)
        const sideSign = item.x > 0 ? 1 : -1;
        acceleration += sideSign * BALANCE_CONFIG.ANVIL_TORQUE_FORCE * (Math.abs(item.x) / (currentPlankWidthRef.current / 2));
      }
    });

    // Update velocity & apply friction
    velocityRef.current += acceleration * dt;
    velocityRef.current *= BALANCE_CONFIG.FRICTION;

    // Update position
    positionRef.current += velocityRef.current * dt;

    // 5. Gem Collisions (Pickup)
    itemsRef.current.forEach(item => {
      if (item.type === 'gem' && !item.collected) {
        const dist = Math.abs(positionRef.current - item.x);
        if (dist < BALANCE_CONFIG.BALL_RADIUS + 15) {
          item.collected = true;
          scoreAccumulatorRef.current += BALANCE_CONFIG.GEM_SCORE_BONUS;
          
          // Spawn floating score popup
          const popup = { id: Date.now(), text: `+${BALANCE_CONFIG.GEM_SCORE_BONUS}`, x: item.x };
          setScorePopups(prev => [...prev, popup]);
          setTimeout(() => {
            setScorePopups(prev => prev.filter(p => p.id !== popup.id));
          }, 1000);
        }
      }
    });

    // Clean up collected gems or items pushed off plank bounds
    const curBound = currentPlankWidthRef.current / 2;
    itemsRef.current = itemsRef.current.filter(item => {
      if (item.collected) return false;
      if (Math.abs(item.x) > curBound + 20) return false;
      return true;
    });
    setItems([...itemsRef.current]);

    // 6. Check Ball Fall Bound
    const maxBound = (currentPlankWidthRef.current / 2) + BALANCE_CONFIG.BALL_RADIUS;
    if (Math.abs(positionRef.current) > maxBound) {
      setIsFallen(true);
    } else {
      setBallX(positionRef.current);
      
      // Update passive survival score
      scoreAccumulatorRef.current += BALANCE_CONFIG.SCORE_PER_SECOND * dt;
      setScore(Math.floor(scoreAccumulatorRef.current));
    }
  }, [orientationData, isFallen]);

  const resetGame = useCallback(() => {
    setBallX(0);
    setScore(0);
    setIsFallen(false);
    setPlankWidth(BALANCE_CONFIG.INITIAL_PLANK_WIDTH);
    setWindState({ active: false, direction: 0 });
    setItems([]);
    setScorePopups([]);

    velocityRef.current = 0;
    positionRef.current = 0;
    scoreAccumulatorRef.current = 0;
    currentPlankWidthRef.current = BALANCE_CONFIG.INITIAL_PLANK_WIDTH;
    timeElapsedMsRef.current = 0;
    nextWindTimeMsRef.current = BALANCE_CONFIG.WIND_INTERVAL_MS;
    windEndTimeMsRef.current = 0;
    windDirectionRef.current = 0;
    nextSpawnTimeMsRef.current = BALANCE_CONFIG.SPAWN_INTERVAL_MS;
    itemsRef.current = [];
  }, []);

  return {
    ballX,
    score,
    isFallen,
    tiltAngle: getTiltAngle(),
    plankWidth,
    windState,
    items,
    scorePopups,
    updatePhysics,
    resetGame
  };
}
