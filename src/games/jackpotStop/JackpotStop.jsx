import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/game/GameHeader';
import { ResultScreen } from '../../components/game/ResultScreen';
import { PermissionModal } from '../../components/game/PermissionModal';
import { ConfettiEffect } from '../../components/ui/ConfettiEffect';
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useJackpotLogic } from './jackpotLogic';
import { JACKPOT_CONFIG } from './config';
import { calculateReward } from '../../engine/rewards';

export function JackpotStop({ onExit }) {
  const [gameState, setGameState] = useState('setup'); // setup, permission, playing, round_result, result
  const [roundFeedback, setRoundFeedback] = useState(null);
  
  const { orientation, permissionState, requestPermission, isSupported } = useDeviceOrientation();
  const { 
    roundIndex, currentRound, score, markerX, 
    updatePhysics, stopAndCalculate, nextRound, resetGame, isGameOver 
  } = useJackpotLogic(orientation);

  useGameLoop((deltaTime) => {
    updatePhysics(deltaTime);
  }, gameState === 'playing');

  const handleStart = () => {
    if (permissionState === 'prompt') {
      setGameState('permission');
    } else {
      setGameState('playing');
    }
  };

  const handlePermissionGrant = async () => {
    await requestPermission();
    setGameState('playing');
  };

  const handleStop = () => {
    if (gameState !== 'playing') return;
    
    const feedback = stopAndCalculate();
    setRoundFeedback(feedback);
    setGameState('round_result');
  };

  const handleNext = () => {
    if (isGameOver) {
      setGameState('result');
    } else {
      nextRound();
      if (roundIndex + 1 >= JACKPOT_CONFIG.ROUNDS.length) {
         setGameState('result');
      } else {
         setGameState('playing');
      }
    }
  };

  const handleReplay = () => {
    resetGame();
    setGameState('playing');
  };

  const reward = gameState === 'result' ? calculateReward(score, 'jackpot-stop') : null;

  return (
    <div className="relative flex-1 flex flex-col h-full bg-emerald-50 overflow-hidden" onClick={() => { if(gameState === 'playing') handleStop() }}>
      <GameHeader title="Jackpot Stop" onExit={onExit} />
      
      {/* HUD */}
      <div className="absolute top-20 left-4 right-4 flex justify-between z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 font-bold text-emerald-900 shadow-sm">
          Round {Math.min(roundIndex + 1, 3)}/3
        </div>
        <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 font-black text-emerald-900 shadow-sm text-xl">
          {score}
        </div>
      </div>

      {/* SETUP */}
      {gameState === 'setup' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-6 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mb-4">🎯</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Jackpot Stop</h2>
          <p className="text-gray-600 mb-8 max-w-[260px]">Tilt your phone to steer the marker. Tap anywhere to STOP inside the target zone!</p>
          <button 
            className="w-full max-w-[260px] bg-emerald-600 text-white font-bold text-lg py-4 rounded-full shadow-lg hover:bg-emerald-700 transition-transform active:scale-95"
            onClick={handleStart}
          >
            Start Game
          </button>
        </div>
      )}

      {/* PERMISSION */}
      {gameState === 'permission' && (
        <PermissionModal 
          title="Motion Access"
          description="We need access to your device's motion sensors to control the marker by tilting."
          isDenied={permissionState === 'denied' || !isSupported}
          onGrant={handlePermissionGrant}
          onDeny={() => setGameState('playing')}
        />
      )}

      {/* GAMEPLAY AREA */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        {gameState !== 'setup' && gameState !== 'permission' && gameState !== 'result' && currentRound && (
          <div className="w-full max-w-[340px] relative">
            <h3 className="text-center text-emerald-800 font-bold uppercase tracking-widest mb-12">
              {gameState === 'playing' ? "Tap to Stop!" : "Stopped"}
            </h3>
            
            {/* The Track Container */}
            <div 
              className="relative h-24 bg-gray-200 rounded-2xl shadow-inner border-2 border-gray-300 overflow-hidden"
              style={{ width: JACKPOT_CONFIG.TRACK_WIDTH, margin: '0 auto' }}
            >
              {/* Center Line Indicator (Target) */}
              <div 
                className="absolute h-full bg-emerald-400/30 border-x-2 border-emerald-500 top-0 z-0"
                style={{ 
                  width: currentRound.targetWidth, 
                  left: JACKPOT_CONFIG.TRACK_WIDTH / 2 - currentRound.targetWidth / 2 
                }}
              />
              <div 
                className="absolute h-full w-0.5 bg-emerald-600 top-0 left-1/2 -translate-x-1/2 z-0 opacity-50"
              />

              {/* The Marker */}
              <motion.div 
                className="absolute top-2 bottom-2 bg-gradient-to-b from-gray-900 to-gray-700 rounded-full shadow-md z-10"
                style={{ 
                  width: JACKPOT_CONFIG.MARKER_WIDTH,
                  left: markerX - JACKPOT_CONFIG.MARKER_WIDTH / 2
                }}
                transition={{ type: 'tween', ease: 'linear', duration: 0 }}
              />
            </div>
            
            {/* Controls hint */}
             <div className="mt-8 text-center text-gray-400 text-sm font-medium">
               Tilt left / right to move
             </div>
          </div>
        )}
      </div>

      {/* ROUND FEEDBACK */}
      <AnimatePresence>
        {gameState === 'round_result' && roundFeedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <h2 className={`text-5xl font-black uppercase tracking-tighter mb-2 ${
              roundFeedback.result === 'perfect' ? 'text-emerald-500' :
              roundFeedback.result === 'close' ? 'text-amber-500' : 'text-gray-400'
            }`}>
              {roundFeedback.result}!
            </h2>
            <p className="text-2xl font-bold text-gray-900 mb-8">+{roundFeedback.earned} pts</p>
            
            <button 
              className="bg-gray-900 text-white font-bold px-8 py-3 rounded-full shadow-lg"
              onClick={handleNext}
            >
              {isGameOver ? "Finish" : "Next Round"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULT */}
      {gameState === 'result' && (
        <>
          <ConfettiEffect fire={true} config={{ particleCount: 150 }} />
          <ResultScreen 
            score={score} 
            reward={reward} 
            onReplay={handleReplay} 
            onExit={onExit} 
          />
        </>
      )}
    </div>
  );
}
