import { useState, useRef, useCallback } from 'react';
import { TILT_BASKET_CONFIG } from './config';
import { checkRectCollision } from '../../engine/collision';

export function useTiltBasketLogic(orientation) {
  const [score, setScore] = useState(0);
  const [objects, setObjects] = useState([]);
  const [floatingScores, setFloatingScores] = useState([]);
  
  const lastSpawnTimeRef = useRef(0);
  const objectsRef = useRef([]);
  const scoreRef = useRef(0); // keep sync with state for loop

  // Screen constraints
  const GAME_WIDTH = typeof window !== 'undefined' ? window.innerWidth > 448 ? 448 : window.innerWidth : 400;
  const GAME_HEIGHT = typeof window !== 'undefined' ? window.innerHeight - 200 : 600;
  
  // Calculate basket position (0 to GAME_WIDTH) based on gamma (-45 to 45)
  // map gamma -45(left) to 45(right) -> 0 to GAME_WIDTH
  let normalizedGamma = orientation.gamma || 0;
  if (normalizedGamma < -45) normalizedGamma = -45;
  if (normalizedGamma > 45) normalizedGamma = 45;
  
  // Center is GAME_WIDTH / 2
  const basketX = (GAME_WIDTH / 2) + (normalizedGamma / 45) * (GAME_WIDTH / 2 - TILT_BASKET_CONFIG.BASKET_WIDTH / 2);
  const basketY = GAME_HEIGHT - TILT_BASKET_CONFIG.BASKET_HEIGHT - 20;

  const updatePhysics = useCallback((deltaTime, timeElapsed) => {
    const now = performance.now();
    
    // Difficulty curve based on timeElapsed (0 to 30)
    const difficultyMultiplier = 1 + (timeElapsed / 30); // up to 2x speed/spawn

    // Spawn objects
    if (now - lastSpawnTimeRef.current > TILT_BASKET_CONFIG.SPAWN_RATE_MS / difficultyMultiplier) {
      lastSpawnTimeRef.current = now;
      
      const rand = Math.random();
      let cumulative = 0;
      let selectedType = TILT_BASKET_CONFIG.OBJECT_TYPES[0];
      
      for (const type of TILT_BASKET_CONFIG.OBJECT_TYPES) {
        cumulative += type.prob;
        if (rand <= cumulative) {
          selectedType = type;
          break;
        }
      }

      const newObj = {
        id: Math.random().toString(36).substr(2, 9),
        ...selectedType,
        x: Math.random() * (GAME_WIDTH - TILT_BASKET_CONFIG.OBJECT_SIZE),
        y: -50,
      };
      
      objectsRef.current.push(newObj);
    }

    // Move objects & Check Collisions
    const basketRect = { x: basketX, y: basketY, width: TILT_BASKET_CONFIG.BASKET_WIDTH, height: TILT_BASKET_CONFIG.BASKET_HEIGHT };
    
    let toRemove = new Set();
    let scoreGained = 0;
    const newFloating = [];

    for (let i = 0; i < objectsRef.current.length; i++) {
      const obj = objectsRef.current[i];
      // Fall down
      const speed = (200 * difficultyMultiplier * obj.speedMultiplier * deltaTime) / 1000;
      obj.y += speed;

      // Collision
      const objRect = { x: obj.x, y: obj.y, width: TILT_BASKET_CONFIG.OBJECT_SIZE, height: TILT_BASKET_CONFIG.OBJECT_SIZE };
      if (checkRectCollision(basketRect, objRect)) {
        scoreGained += obj.score;
        toRemove.add(obj.id);
        
        newFloating.push({
          id: Date.now() + Math.random(),
          x: obj.x,
          y: obj.y,
          score: obj.score
        });
      }
      
      // Out of bounds
      if (obj.y > GAME_HEIGHT) {
        toRemove.add(obj.id);
      }
    }

    if (toRemove.size > 0) {
      objectsRef.current = objectsRef.current.filter(o => !toRemove.has(o.id));
    }

    if (scoreGained !== 0) {
      scoreRef.current += scoreGained;
      setScore(scoreRef.current);
    }
    
    if (newFloating.length > 0) {
      setFloatingScores(prev => [...prev, ...newFloating]);
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(f => !newFloating.find(n => n.id === f.id)));
      }, 800);
    }

    // Always update objects state so React renders them at new positions
    setObjects([...objectsRef.current]);
  }, [basketX, basketY, GAME_WIDTH, GAME_HEIGHT]);

  const resetGame = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setObjects([]);
    objectsRef.current = [];
    setFloatingScores([]);
    lastSpawnTimeRef.current = 0;
  }, []);

  return { basketX, basketY, objects, score, updatePhysics, resetGame, floatingScores, GAME_WIDTH, GAME_HEIGHT };
}
