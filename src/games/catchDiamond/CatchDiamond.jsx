import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GameHeader } from '../../components/game/GameHeader';
import { Countdown } from '../../components/game/Countdown';
import { ResultScreen } from '../../components/game/ResultScreen';
import { ConfettiEffect } from '../../components/ui/ConfettiEffect';
import { usePermissions } from '../../engine/PermissionContext';
import { useHandTracking } from '../../hooks/useHandTracking';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useCatchDiamondLogic } from './catchDiamondLogic';
import { CATCH_DIAMOND_CONFIG } from './config';
import { calculateReward } from '../../engine/rewards';

export function CatchDiamond() {
  const navigate = useNavigate();
  const { camera, globalDemoMode } = usePermissions();
  const [gameState, setGameState] = useState('setup');
  
  const { isLoaded, handData, demoMode } = useHandTracking(
    camera.videoRef, 
    gameState !== 'setup' && gameState !== 'result' && !globalDemoMode
  );
  
  const activeDemoMode = globalDemoMode || demoMode;
  
  const { cursorX, cursorY, objects, score, updatePhysics, resetGame, floatingScores, GAME_WIDTH, GAME_HEIGHT } = useCatchDiamondLogic(handData);
  
  const { timeLeft, resetTimer } = useGameTimer(CATCH_DIAMOND_CONFIG.GAME_DURATION, gameState === 'playing', () => {
    setGameState('result');
  });

  useGameLoop((deltaTime) => {
    const timeElapsed = CATCH_DIAMOND_CONFIG.GAME_DURATION - timeLeft;
    updatePhysics(deltaTime, timeElapsed);
  }, gameState === 'playing');

  const handleStart = () => {
    setGameState('loading_model');
  };

  const handleReplay = () => {
    resetGame();
    resetTimer();
    setGameState('loading_model');
  };
  
  const handleExit = () => navigate('/');

  if (gameState === 'loading_model' && (isLoaded || activeDemoMode)) {
    setGameState('countdown');
  }

  const reward = gameState === 'result' ? calculateReward(score, 'catch-diamond') : null;

  return (
    <div className="relative flex-1 flex flex-col h-full bg-gray-900 overflow-hidden">
      <GameHeader title="Catch the Diamond" onExit={handleExit} />
      
      {/* Video Background */}
      {(gameState === 'loading_model' || gameState === 'countdown' || gameState === 'playing') && !activeDemoMode && (
        <video 
          ref={camera.bindVideoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-50 mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}
      
      {/* HUD */}
      <div className="absolute top-20 left-4 right-4 flex justify-between z-20">
        <div className="bg-black/40 backdrop-blur rounded-xl px-4 py-2 font-bold text-white shadow-sm border border-white/10">
          {timeLeft}s
        </div>
        <div className="bg-black/40 backdrop-blur rounded-xl px-4 py-2 font-black text-purple-400 shadow-sm border border-white/10 text-xl">
          {score}
        </div>
      </div>
      
      {activeDemoMode && (
        <div className="absolute top-32 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-red-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Demo Mode Active (Mouse/Touch)
          </div>
        </div>
      )}

      {/* SETUP */}
      {gameState === 'setup' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white p-6 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-4xl mb-4">💎</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Catch the Diamond</h2>
          <p className="text-gray-600 mb-8 max-w-[260px]">Move your hand in front of the camera to catch falling diamonds. Avoid the bombs!</p>
          <button 
            className="w-full max-w-[260px] bg-purple-600 text-white font-bold text-lg py-4 rounded-full shadow-lg hover:bg-purple-700 transition-transform active:scale-95"
            onClick={handleStart}
          >
            Start Game
          </button>
        </div>
      )}

      {/* LOADING MODEL */}
      {gameState === 'loading_model' && !isLoaded && !activeDemoMode && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg font-medium">Loading Vision Models...</p>
        </div>
      )}

      {/* COUNTDOWN */}
      {gameState === 'countdown' && (
        <Countdown onComplete={() => setGameState('playing')} />
      )}

      {/* GAMEPLAY AREA */}
      <div className="flex-1 relative z-10" style={{ maxWidth: GAME_WIDTH, margin: '0 auto', width: '100%' }}>
        {/* Hand Cursor */}
        {(handData || activeDemoMode) && (
          <motion.div
            className="absolute rounded-full border-2 border-purple-400 bg-purple-500/30 flex items-center justify-center pointer-events-none shadow-[0_0_15px_rgba(168,85,247,0.5)] z-20"
            style={{ 
              width: CATCH_DIAMOND_CONFIG.CURSOR_RADIUS * 2, 
              height: CATCH_DIAMOND_CONFIG.CURSOR_RADIUS * 2,
              x: cursorX - CATCH_DIAMOND_CONFIG.CURSOR_RADIUS,
              y: cursorY - CATCH_DIAMOND_CONFIG.CURSOR_RADIUS
            }}
            transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
          >
            <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
          </motion.div>
        )}

        {/* Falling Objects */}
        {objects.map(obj => (
          <div
            key={obj.id}
            className="absolute flex items-center justify-center pointer-events-none"
            style={{ 
              width: CATCH_DIAMOND_CONFIG.OBJECT_SIZE, 
              height: CATCH_DIAMOND_CONFIG.OBJECT_SIZE,
              transform: `translate(${obj.x}px, ${obj.y}px)`,
              fontSize: '32px',
              willChange: 'transform'
            }}
          >
            {obj.emoji}
          </div>
        ))}

        {/* Floating Scores */}
        <AnimatePresence>
          {floatingScores.map(fs => (
            <motion.div
              key={fs.id}
              initial={{ opacity: 1, y: fs.y }}
              animate={{ opacity: 0, y: fs.y - 40 }}
              exit={{ opacity: 0 }}
              className={`absolute font-black text-2xl z-30 ${fs.score > 0 ? 'text-green-400' : 'text-red-400'}`}
              style={{ left: fs.x }}
            >
              {fs.score > 0 ? '+' : ''}{fs.score}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* RESULT */}
      {gameState === 'result' && (
        <>
          <ConfettiEffect fire={true} config={{ particleCount: 150 }} />
          <ResultScreen 
            score={score} 
            reward={reward} 
            onReplay={handleReplay} 
            onExit={handleExit} 
          />
        </>
      )}
    </div>
  );
}
