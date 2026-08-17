import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/game/GameHeader';
import { ResultScreen } from '../../components/game/ResultScreen';
import { PermissionModal } from '../../components/game/PermissionModal';
import { ConfettiEffect } from '../../components/ui/ConfettiEffect';
import { useCamera } from '../../hooks/useCamera';
import { usePoseTracking } from '../../hooks/usePoseTracking';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useGameLoop } from '../../hooks/useGameLoop';
import { usePoseTrackingLogic } from './poseTrackingLogic';
import { POSE_FREEZE_CONFIG } from './config';
import { calculateReward } from '../../engine/rewards';

export function PoseFreeze({ onExit }) {
  const [gameState, setGameState] = useState('setup'); // setup, permission, loading_model, matching, freezing, result
  const [targetPose, setTargetPose] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  
  const { permissionState, requestPermission, videoRef, stopCamera } = useCamera();
  const { isLoaded, poseData, demoMode, enableDemoMode } = usePoseTracking(videoRef, gameState !== 'setup' && gameState !== 'result');
  
  const { matchScore, stabilityScore, calculateMatch, calculateStability, resetTracking } = usePoseTrackingLogic(demoMode ? null : poseData);

  // Demo mode overrides
  const displayMatchScore = demoMode ? 95 : matchScore;
  const displayStabilityScore = demoMode ? 98 : stabilityScore;

  // Matching timer (10s)
  const { timeLeft: matchTimeLeft, resetTimer: resetMatchTimer } = useGameTimer(
    POSE_FREEZE_CONFIG.PREPARATION_TIME, 
    gameState === 'matching', 
    () => setGameState('result') // Time out if didn't match in time
  );

  // Freezing timer (5s)
  const { timeLeft: freezeTimeLeft, resetTimer: resetFreezeTimer } = useGameTimer(
    POSE_FREEZE_CONFIG.FREEZE_TIME, 
    gameState === 'freezing', 
    () => {
      // Calculate final score
      const final = Math.round((displayMatchScore * 0.4) + (displayStabilityScore * 0.6)) * 10;
      setFinalScore(final);
      setGameState('result');
      stopCamera();
    }
  );

  // Game Loop for updating tracking bars continuously
  useGameLoop(() => {
    if (gameState === 'matching') {
      const match = calculateMatch(targetPose);
      if (match > 80 || demoMode) {
        // High enough match, transition to freezing
        setTimeout(() => setGameState('freezing'), 1500); // give them 1.5s warning
      }
    } else if (gameState === 'freezing') {
      calculateStability();
    }
  }, gameState === 'matching' || gameState === 'freezing');

  const handleStart = () => {
    // Pick random pose
    const randomPose = POSE_FREEZE_CONFIG.TARGET_POSES[Math.floor(Math.random() * POSE_FREEZE_CONFIG.TARGET_POSES.length)];
    setTargetPose(randomPose);
    
    if (permissionState === 'prompt') {
      setGameState('permission');
    } else {
      setGameState('loading_model');
    }
  };

  const handlePermissionGrant = async () => {
    await requestPermission();
    setGameState('loading_model');
  };

  const handleReplay = () => {
    resetTracking();
    resetMatchTimer();
    resetFreezeTimer();
    const randomPose = POSE_FREEZE_CONFIG.TARGET_POSES[Math.floor(Math.random() * POSE_FREEZE_CONFIG.TARGET_POSES.length)];
    setTargetPose(randomPose);
    setGameState('loading_model');
  };

  // Wait for model
  if (gameState === 'loading_model' && (isLoaded || demoMode)) {
    setGameState('matching');
  }

  const reward = gameState === 'result' ? calculateReward(finalScore, 'pose-freeze') : null;

  return (
    <div className="relative flex-1 flex flex-col h-full bg-gray-900 overflow-hidden">
      <GameHeader title="Pose & Freeze" onExit={() => { stopCamera(); onExit(); }} />
      
      {/* Video Background */}
      {(gameState === 'loading_model' || gameState === 'matching' || gameState === 'freezing') && !demoMode && (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {/* SETUP */}
      {gameState === 'setup' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white p-6 text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-4xl mb-4">🧍‍♂️</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Pose & Freeze</h2>
          <p className="text-gray-600 mb-8 max-w-[260px]">Match the on-screen pose and freeze! Can you hold it perfectly still?</p>
          <button 
            className="w-full max-w-[260px] bg-rose-600 text-white font-bold text-lg py-4 rounded-full shadow-lg hover:bg-rose-700 transition-transform active:scale-95"
            onClick={handleStart}
          >
            Start Game
          </button>
        </div>
      )}

      {/* PERMISSION */}
      {gameState === 'permission' && (
        <PermissionModal 
          title="Camera Access"
          description="This game requires camera access to track your body pose. All processing is local."
          isDenied={permissionState === 'denied'}
          onGrant={handlePermissionGrant}
          onDeny={() => {
            enableDemoMode();
            setGameState('loading_model');
          }}
        />
      )}

      {/* MATCHING PHASE */}
      {gameState === 'matching' && targetPose && (
        <div className="absolute inset-0 z-20 flex flex-col items-center pt-24 px-6 text-center text-white">
          <h3 className="text-2xl font-black uppercase tracking-widest text-rose-400 mb-2">{targetPose.name}</h3>
          <p className="text-lg font-medium mb-8">{targetPose.description}</p>
          
          <div className="text-6xl font-mono opacity-80 mb-12 whitespace-pre text-rose-200">
            {targetPose.visual}
          </div>

          <div className="w-full max-w-[280px] bg-black/40 backdrop-blur rounded-2xl p-4 border border-white/10 mt-auto mb-12">
            <div className="flex justify-between text-sm font-bold uppercase tracking-wide mb-2">
              <span>Pose Match</span>
              <span className={displayMatchScore > 80 ? 'text-green-400' : 'text-white'}>{displayMatchScore}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${displayMatchScore > 80 ? 'bg-green-500' : 'bg-rose-500'}`}
                animate={{ width: `${displayMatchScore}%` }}
              />
            </div>
            <div className="mt-4 text-xs text-gray-400">Time to match: {matchTimeLeft}s</div>
          </div>
        </div>
      )}

      {/* FREEZE PHASE */}
      {gameState === 'freezing' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center text-white">
          <motion.h2 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-black uppercase tracking-tighter text-amber-400 mb-2"
          >
            FREEZE!
          </motion.h2>
          <p className="text-2xl font-bold mb-12">{freezeTimeLeft}s remaining</p>
          
          <div className="w-full max-w-[280px] bg-black/40 backdrop-blur rounded-2xl p-4 border border-white/10 mt-auto mb-12">
            <div className="flex justify-between text-sm font-bold uppercase tracking-wide mb-2">
              <span>Stability</span>
              <span className={displayStabilityScore > 80 ? 'text-green-400' : 'text-amber-400'}>{displayStabilityScore}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${displayStabilityScore > 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                animate={{ width: `${displayStabilityScore}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* DEMO MODE OVERLAY */}
      {demoMode && (gameState === 'matching' || gameState === 'freezing') && (
        <div className="absolute top-32 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-red-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Demo Mode Auto-Playing
          </div>
        </div>
      )}

      {/* RESULT */}
      {gameState === 'result' && (
        <>
          <ConfettiEffect fire={true} config={{ particleCount: 150 }} />
          <ResultScreen 
            score={finalScore} 
            reward={reward} 
            onReplay={handleReplay} 
            onExit={onExit} 
          />
        </>
      )}
    </div>
  );
}
