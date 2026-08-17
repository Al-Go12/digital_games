import { useState, useRef, useCallback } from 'react';
import { CATCH_DIAMOND_CONFIG } from './config';
import { checkCircleCollision, checkRectCollision } from '../../engine/collision';

export function useCatchDiamondLogic(handData) {
  const [score, setScore] = useState(0);
  const [objects, setObjects] = useState([]);
  const [floatingScores, setFloatingScores] = useState([]);
  
  const lastSpawnTimeRef = useRef(0);
  const objectsRef = useRef([]);
  const scoreRef = useRef(0);

  const GAME_WIDTH = typeof window !== 'undefined' ? window.innerWidth > 448 ? 448 : window.innerWidth : 400;
  const GAME_HEIGHT = typeof window !== 'undefined' ? window.innerHeight - 200 : 600;

  // Hand data is normalized 0-1
  const cursorX = handData ? handData.x * GAME_WIDTH : GAME_WIDTH / 2;
  const cursorY = handData ? handData.y * GAME_HEIGHT : GAME_HEIGHT / 2;

  const updatePhysics = useCallback((deltaTime, timeElapsed) => {
    const now = performance.now();
    const difficultyMultiplier = 1 + (timeElapsed / 30); 

    // Spawn objects (floating up or falling down? let's make them fall like snowflakes)
    if (now - lastSpawnTimeRef.current > CATCH_DIAMOND_CONFIG.SPAWN_RATE_MS / difficultyMultiplier) {
      lastSpawnTimeRef.current = now;
      
      const rand = Math.random();
      let cumulative = 0;
      let selectedType = CATCH_DIAMOND_CONFIG.OBJECT_TYPES[0];
      
      for (const type of CATCH_DIAMOND_CONFIG.OBJECT_TYPES) {
        cumulative += type.prob;
        if (rand <= cumulative) {
          selectedType = type;
          break;
        }
      }

      objectsRef.current.push({
        ...selectedType,
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: Math.random() * (GAME_WIDTH - CATCH_DIAMOND_CONFIG.OBJECT_SIZE),
        y: -50,
      });
    }

    let toRemove = new Set();
    let scoreGained = 0;
    const newFloating = [];
    
    // Hand cursor logic (approximate circle)
    const cursorObj = { x: cursorX, y: cursorY, radius: CATCH_DIAMOND_CONFIG.CURSOR_RADIUS };

    for (let i = 0; i < objectsRef.current.length; i++) {
      const obj = objectsRef.current[i];
      const speed = (150 * difficultyMultiplier * deltaTime) / 1000;
      obj.y += speed;
      
      // Add slight horizontal drift
      obj.x += Math.sin(now / 1000 + i) * 1.5;

      const objCircle = { x: obj.x + CATCH_DIAMOND_CONFIG.OBJECT_SIZE/2, y: obj.y + CATCH_DIAMOND_CONFIG.OBJECT_SIZE/2, radius: CATCH_DIAMOND_CONFIG.OBJECT_SIZE / 2 };
      
      if (handData && checkCircleCollision(cursorObj, objCircle)) {
        scoreGained += obj.score;
        toRemove.add(obj.id);
        
        newFloating.push({
          id: Date.now() + Math.random(),
          x: obj.x,
          y: obj.y,
          score: obj.score
        });
      }
      
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

    setObjects([...objectsRef.current]);
  }, [cursorX, cursorY, handData, GAME_WIDTH, GAME_HEIGHT]);

  const resetGame = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setObjects([]);
    objectsRef.current = [];
    setFloatingScores([]);
    lastSpawnTimeRef.current = 0;
  }, []);

  return { cursorX, cursorY, objects, score, updatePhysics, resetGame, floatingScores, GAME_WIDTH, GAME_HEIGHT };
}
