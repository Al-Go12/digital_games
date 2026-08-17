import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GameHeader } from '../../components/game/GameHeader';
import { Countdown } from '../../components/game/Countdown';
import { ResultScreen } from '../../components/game/ResultScreen';
import { ConfettiEffect } from '../../components/ui/ConfettiEffect';
import { usePermissions } from '../../engine/PermissionContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useBalanceLogic } from './balanceLogic';
import { BALANCE_CONFIG } from './config';
import { calculateReward } from '../../engine/rewards';

export function BalanceBoard() {
  const navigate = useNavigate();
  const { orientation, globalDemoMode } = usePermissions();
  const [gameState, setGameState] = useState('setup'); // setup, countdown, playing, result
  
  const { ballX, score, isFallen, tiltAngle, updatePhysics, resetGame } = useBalanceLogic(orientation.orientation);

  useGameLoop((deltaTime) => {
    updatePhysics(deltaTime);
  }, gameState === 'playing');

  // Watch for failure
  useEffect(() => {
    if (isFallen && gameState === 'playing') {
      setTimeout(() => setGameState('result'), 500); // short delay before showing result
    }
  }, [isFallen, gameState]);

  const handleStart = () => setGameState('countdown');

  const handleReplay = () => {
    resetGame();
    setGameState('countdown');
  };

  const handleExit = () => navigate('/');

  const reward = gameState === 'result' ? calculateReward(score, 'balance-board') : null;

  return (
    <div className="relative flex-1 flex flex-col h-full bg-emerald-50 overflow-hidden">
      <GameHeader title="Balance Board" onExit={handleExit} />
      
      {/* HUD */}
      <div className="absolute top-20 left-4 right-4 flex justify-between z-10">
        <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 font-bold text-emerald-900 shadow-sm flex flex-col items-center">
          <span className="text-xs uppercase text-emerald-600">Score</span>
          <span className="text-2xl font-black">{score}</span>
        </div>
      </div>

      {globalDemoMode && (
        <div className="absolute top-32 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-emerald-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            Use Left/Right Arrows
          </div>
        </div>
      )}

      {/* SETUP */}
      {gameState === 'setup' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm p-6 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl mb-4">⚖️</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Balance Board</h2>
          <p className="text-gray-600 mb-8 max-w-[260px]">Tilt your phone to keep the ball balanced on the seesaw. How long can you survive?</p>
          <button 
            className="w-full max-w-[260px] bg-emerald-600 text-white font-bold text-lg py-4 rounded-full shadow-lg hover:bg-emerald-700 transition-transform active:scale-95"
            onClick={handleStart}
          >
            Start Game
          </button>
        </div>
      )}

      {/* COUNTDOWN */}
      {gameState === 'countdown' && (
        <Countdown onComplete={() => setGameState('playing')} />
      )}

      {/* GAMEPLAY AREA */}
      <div className="flex-1 relative bg-gradient-to-b from-emerald-100 to-emerald-50 flex items-center justify-center">
        
        {/* Environment - The Seesaw System */}
        <div className="relative flex flex-col items-center justify-center h-64 w-full mt-20">
          
          {/* Rotating Plank System */}
          <motion.div 
            className="relative flex justify-center items-center"
            style={{ 
              rotate: tiltAngle,
              transformOrigin: 'center center'
            }}
            transition={{ type: 'tween', ease: 'linear', duration: 0 }}
          >
            {/* The Ball */}
            <motion.div
              className={`absolute rounded-full shadow-[inset_-2px_-4px_8px_rgba(0,0,0,0.3)] z-10 
                ${isFallen ? 'bg-red-500' : 'bg-orange-500'}`}
              style={{
                width: BALANCE_CONFIG.BALL_RADIUS * 2,
                height: BALANCE_CONFIG.BALL_RADIUS * 2,
                bottom: BALANCE_CONFIG.PLANK_HEIGHT, // sits on top of plank
                x: ballX,
              }}
              animate={isFallen ? { y: 200, opacity: 0 } : { y: 0, opacity: 1 }}
              transition={{ duration: isFallen ? 0.5 : 0 }}
            />
            
            {/* The Plank */}
            <div 
              className="bg-[#8b5a2b] shadow-xl rounded-sm border-t-2 border-[#a67b45] z-0"
              style={{
                width: BALANCE_CONFIG.PLANK_WIDTH,
                height: BALANCE_CONFIG.PLANK_HEIGHT,
              }}
            />
          </motion.div>

          {/* The Fulcrum / Drum */}
          <div 
            className="w-16 h-16 bg-gray-800 rounded-full mt-[-8px] shadow-2xl border-4 border-gray-900 z-10 flex items-center justify-center"
          >
             <div className="w-4 h-4 rounded-full bg-gray-600" />
          </div>

        </div>

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
