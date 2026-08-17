import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GameHeader } from '../../components/game/GameHeader';
import { ResultScreen } from '../../components/game/ResultScreen';
import { ConfettiEffect } from '../../components/ui/ConfettiEffect';
import { usePermissions } from '../../engine/PermissionContext';
import { useHandTracking } from '../../hooks/useHandTracking';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useGameLoop } from '../../hooks/useGameLoop';
import { usePoseTrackingLogic } from './poseTrackingLogic';
import { POSE_FREEZE_CONFIG } from './config';
import { calculateReward } from '../../engine/rewards';

export function PoseFreeze() {
  const navigate = useNavigate();
  const { camera, globalDemoMode } = usePermissions();
  const [gameState, setGameState] = useState('setup');
  const [targetPose, setTargetPose] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  
  // Continuous hold state
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const continuousHoldMsRef = useRef(0);
  
  const { isLoaded, handData, demoMode } = useHandTracking(
    camera.videoRef, 
    gameState !== 'setup' && gameState !== 'result' && !globalDemoMode
  );
  
  const activeDemoMode = globalDemoMode || demoMode;
  
  const { matchScore, stabilityScore, calculateMatch, calculateStability, resetTracking } = usePoseTrackingLogic(activeDemoMode ? null : handData);

  const displayMatchScore = activeDemoMode ? 95 : matchScore;
  const displayStabilityScore = activeDemoMode ? 98 : stabilityScore;

  const { timeLeft, resetTimer } = useGameTimer(
    POSE_FREEZE_CONFIG.TOTAL_TIME, 
    gameState === 'playing', 
    () => {
      // Time ran out before holding
      setFinalScore(0); // Fail
      setGameState('result');
    }
  );

  useGameLoop((deltaTime) => {
    if (gameState === 'playing') {
      const match = calculateMatch(targetPose);
      calculateStability();
      
      const isMatching = match > 80 || activeDemoMode;
      const isStable = displayStabilityScore > 80 || activeDemoMode;

      if (isMatching && isStable) {
        continuousHoldMsRef.current += deltaTime;
      } else {
        continuousHoldMsRef.current = Math.max(0, continuousHoldMsRef.current - deltaTime * 2); // Drain quickly if lost
      }
      
      const targetHoldMs = POSE_FREEZE_CONFIG.HOLD_TIME * 1000;
      const progress = Math.min(100, (continuousHoldMsRef.current / targetHoldMs) * 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        // Success!
        const final = Math.round((displayMatchScore * 0.4) + (displayStabilityScore * 0.6)) * 10;
        setFinalScore(final); // Won
        setGameState('result');
      }
    }
  }, gameState === 'playing');

  const handleStart = () => {
    const randomPose = POSE_FREEZE_CONFIG.TARGET_POSES[Math.floor(Math.random() * POSE_FREEZE_CONFIG.TARGET_POSES.length)];
    setTargetPose(randomPose);
    setGameState('loading_model');
  };

  const handleReplay = () => {
    resetTracking();
    resetTimer();
    continuousHoldMsRef.current = 0;
    setHoldProgress(0);
    const randomPose = POSE_FREEZE_CONFIG.TARGET_POSES[Math.floor(Math.random() * POSE_FREEZE_CONFIG.TARGET_POSES.length)];
    setTargetPose(randomPose);
    setGameState('loading_model');
  };

  const handleExit = () => navigate('/');

  if (gameState === 'loading_model' && (isLoaded || activeDemoMode)) {
    setGameState('playing');
  }

  const reward = gameState === 'result' ? calculateReward(finalScore, 'pose-freeze') : null;

  return (
    <div className="relative flex-1 flex flex-col h-full bg-gray-900 overflow-hidden">
      <GameHeader title="Gesture & Freeze" onExit={handleExit} />
      
      {(gameState === 'loading_model' || gameState === 'playing') && !activeDemoMode && (
        <video 
          ref={camera.videoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {gameState === 'setup' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white p-6 text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-4xl mb-4">✋</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Gesture & Freeze</h2>
          <p className="text-gray-600 mb-8 max-w-[260px]">Match the on-screen hand gesture and hold it perfectly still for {POSE_FREEZE_CONFIG.HOLD_TIME} seconds!</p>
          <button 
            className="w-full max-w-[260px] bg-rose-600 text-white font-bold text-lg py-4 rounded-full shadow-lg hover:bg-rose-700 transition-transform active:scale-95"
            onClick={handleStart}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && targetPose && (
        <div className="absolute inset-0 z-20 flex flex-col items-center pt-24 px-6 text-center text-white">
          <h3 className="text-2xl font-black uppercase tracking-widest text-rose-400 mb-2">{targetPose.name}</h3>
          <p className="text-lg font-medium mb-8">{targetPose.description}</p>
          
          <div className="text-6xl font-mono opacity-80 mb-12 whitespace-pre text-rose-200">
            {targetPose.visual}
          </div>

          <div className="w-full max-w-[280px] bg-black/50 backdrop-blur rounded-2xl p-5 border border-white/10 mt-auto mb-12 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Time Remaining</span>
              <span className="text-lg font-black text-white">{timeLeft}s</span>
            </div>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wide mb-1.5">
                  <span>Gesture Accuracy</span>
                  <span className={displayMatchScore > 80 ? 'text-green-400' : 'text-rose-400'}>{displayMatchScore}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${displayMatchScore > 80 ? 'bg-green-500' : 'bg-rose-500'}`}
                    animate={{ width: `${displayMatchScore}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wide mb-1.5">
                  <span>Stability</span>
                  <span className={displayStabilityScore > 80 ? 'text-green-400' : 'text-amber-400'}>{displayStabilityScore}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${displayStabilityScore > 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                    animate={{ width: `${displayStabilityScore}%` }}
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wide mb-1.5 text-indigo-300">
                  <span>Hold Progress</span>
                  <span>{Math.round(holdProgress)}%</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    animate={{ width: `${holdProgress}%` }}
                    transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeDemoMode && gameState === 'playing' && (
        <div className="absolute top-32 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-red-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Demo Mode Auto-Playing
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <>
          {finalScore > 0 && <ConfettiEffect fire={true} config={{ particleCount: 150 }} />}
          <ResultScreen 
            score={finalScore} 
            reward={reward} 
            onReplay={handleReplay} 
            onExit={handleExit} 
          />
        </>
      )}
    </div>
  );
}
