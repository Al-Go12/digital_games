import { useState, useRef, useEffect, useCallback } from 'react';
import { GESTURE_MEMORY_CONFIG, GESTURE_CATALOG, generateRandomSequence } from './config';
import { classifyGesture, GestureSmoother } from './gestureClassifier';

export function useGestureMemoryLogic(handLandmarks, isDemoMode = false) {
  const [gamePhase, setGamePhase] = useState('instructions'); // instructions, camera_setup, round_intro, memorizing, performing, gesture_result, round_complete, game_over
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentSequence, setCurrentSequence] = useState([]);
  const [currentIndexInSeq, setCurrentIndexInSeq] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(GESTURE_MEMORY_CONFIG.MAX_ATTEMPTS_PER_GESTURE);
  
  const [score, setScore] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [retriesCount, setRetriesCount] = useState(0);
  const [memorizeCountdown, setMemorizeCountdown] = useState(3);
  
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: string, expectedKey?: string, detectedKey?: string }
  const [detectedGesture, setDetectedGesture] = useState(null);

  const smootherRef = useRef(new GestureSmoother(4, 3));
  const gestureStartTimeRef = useRef(0);
  const cooldownRef = useRef(false);

  const currentRoundConfig = GESTURE_MEMORY_CONFIG.ROUNDS[currentRoundIndex] || GESTURE_MEMORY_CONFIG.ROUNDS[0];

  // 1. Initialize round
  const setupRound = useCallback((roundIdx) => {
    const rConfig = GESTURE_MEMORY_CONFIG.ROUNDS[roundIdx];
    const seq = rConfig.presetSequence || generateRandomSequence(rConfig.gesturesCount);
    setCurrentRoundIndex(roundIdx);
    setCurrentSequence(seq);
    setCurrentIndexInSeq(0);
    setAttemptsLeft(GESTURE_MEMORY_CONFIG.MAX_ATTEMPTS_PER_GESTURE);
    setMemorizeCountdown(rConfig.memorizeTimeSeconds);
    setFeedback(null);
    setGamePhase('memorizing');
  }, []);

  // Start initial game
  const startGame = useCallback(() => {
    setScore(0);
    setCompletedCount(0);
    setRetriesCount(0);
    setupRound(0);
  }, [setupRound]);

  // Start memorization phase countdown
  const startMemorization = useCallback(() => {
    setGamePhase('memorizing');
    setMemorizeCountdown(currentRoundConfig.memorizeTimeSeconds);
  }, [currentRoundConfig.memorizeTimeSeconds]);

  // Memorization countdown effect
  useEffect(() => {
    if (gamePhase !== 'memorizing') return;

    if (memorizeCountdown <= 0) {
      // Transition to performing phase!
      setGamePhase('performing');
      gestureStartTimeRef.current = performance.now();
      smootherRef.current.reset();
      return;
    }

    const timer = setTimeout(() => {
      setMemorizeCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gamePhase, memorizeCountdown]);

  // Handle gesture evaluation (called by camera classifier or demo mode)
  const submitGesture = useCallback((gestureKey) => {
    if (gamePhase !== 'performing' || cooldownRef.current) return;

    const expectedKey = currentSequence[currentIndexInSeq];
    if (!expectedKey) return;

    const expectedInfo = GESTURE_CATALOG[expectedKey];
    const detectedInfo = GESTURE_CATALOG[gestureKey];

    if (gestureKey === expectedKey) {
      // Correct!
      cooldownRef.current = true;
      const responseTime = performance.now() - gestureStartTimeRef.current;
      
      let bonus = 0;
      if (attemptsLeft === GESTURE_MEMORY_CONFIG.MAX_ATTEMPTS_PER_GESTURE) {
        bonus += GESTURE_MEMORY_CONFIG.SCORING.NO_RETRY_BONUS;
      }
      if (responseTime < 2000) {
        bonus += GESTURE_MEMORY_CONFIG.SCORING.SPEED_BONUS;
      }

      const gainedScore = GESTURE_MEMORY_CONFIG.SCORING.CORRECT_GESTURE + bonus;
      setScore(prev => prev + gainedScore);
      setCompletedCount(prev => prev + 1);

      setFeedback({
        type: 'success',
        text: `✓ CORRECT! (+${gainedScore} pts)`,
        expectedKey,
        detectedKey: gestureKey
      });

      setTimeout(() => {
        setFeedback(null);
        cooldownRef.current = false;

        const nextIndex = currentIndexInSeq + 1;
        if (nextIndex >= currentSequence.length) {
          // Round completed!
          setScore(prev => prev + GESTURE_MEMORY_CONFIG.SCORING.ROUND_COMPLETION_BONUS);
          
          if (currentRoundIndex + 1 < GESTURE_MEMORY_CONFIG.ROUNDS.length) {
            setGamePhase('round_complete');
          } else {
            // Completed ALL rounds!
            setGamePhase('game_over');
          }
        } else {
          // Move to next gesture in sequence
          setCurrentIndexInSeq(nextIndex);
          setAttemptsLeft(GESTURE_MEMORY_CONFIG.MAX_ATTEMPTS_PER_GESTURE);
          gestureStartTimeRef.current = performance.now();
          smootherRef.current.reset();
        }
      }, 900);

    } else {
      // Wrong gesture!
      cooldownRef.current = true;
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);
      setRetriesCount(prev => prev + 1);

      if (newAttempts > 0) {
        setFeedback({
          type: 'error',
          text: `✕ WRONG GESTURE`,
          expectedKey,
          detectedKey: gestureKey,
          subtext: `Expected ${expectedInfo.visual} ${expectedInfo.name}, Detected ${detectedInfo ? detectedInfo.visual : '❓'}. Try Again (${newAttempts}/${GESTURE_MEMORY_CONFIG.MAX_ATTEMPTS_PER_GESTURE})`
        });

        setTimeout(() => {
          setFeedback(null);
          cooldownRef.current = false;
          gestureStartTimeRef.current = performance.now();
          smootherRef.current.reset();
        }, 1400);

      } else {
        // All attempts failed!
        setFeedback({
          type: 'error',
          text: `ROUND FAILED`,
          expectedKey,
          detectedKey: gestureKey,
          subtext: `Out of attempts for this gesture.`
        });

        setTimeout(() => {
          setFeedback(null);
          cooldownRef.current = false;
          setGamePhase('game_over');
        }, 1500);
      }
    }
  }, [gamePhase, currentSequence, currentIndexInSeq, attemptsLeft, currentRoundIndex]);

  // Camera tracking frame effect
  useEffect(() => {
    if (isDemoMode || !handLandmarks) {
      if (!handLandmarks) setDetectedGesture(null);
      return;
    }

    const rawGesture = classifyGesture(handLandmarks);
    const stableGesture = smootherRef.current.addFrame(rawGesture);
    setDetectedGesture(stableGesture);

    if (gamePhase === 'performing' && stableGesture && !cooldownRef.current) {
      submitGesture(stableGesture);
    }
  }, [handLandmarks, gamePhase, isDemoMode, submitGesture]);

  const advanceNextRound = useCallback(() => {
    setupRound(currentRoundIndex + 1);
  }, [currentRoundIndex, setupRound]);

  return {
    gamePhase,
    setGamePhase,
    currentRoundIndex,
    currentRoundConfig,
    currentSequence,
    currentIndexInSeq,
    attemptsLeft,
    score,
    completedCount,
    retriesCount,
    memorizeCountdown,
    feedback,
    detectedGesture,
    startGame,
    startMemorization,
    submitGesture,
    advanceNextRound
  };
}
