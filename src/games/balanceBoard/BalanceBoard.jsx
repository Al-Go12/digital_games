import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  const { 
    ballX, 
    score, 
    isFallen, 
    tiltAngle, 
    plankWidth,
    windState,
    items,
    scorePopups,
    updatePhysics, 
    resetGame 
  } = useBalanceLogic(orientation.orientation);

  useGameLoop((deltaTime) => {
    updatePhysics(deltaTime);
  }, gameState === 'playing');

  // Watch for game over
  useEffect(() => {
    if (isFallen && gameState === 'playing') {
      setTimeout(() => setGameState('result'), 600);
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
    <div className="relative flex-1 flex flex-col h-full bg-emerald-950 overflow-hidden">
      <GameHeader title="Balance Board" onExit={handleExit} />
      
      {/* HUD Bar */}
      <div className="absolute top-20 left-4 right-4 flex justify-between z-10">
        <div className="bg-white/90 backdrop-blur rounded-2xl px-5 py-2 font-bold text-emerald-950 shadow-lg flex flex-col items-center">
          <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Score</span>
          <span className="text-2xl font-black">{score}</span>
        </div>

        {/* Dynamic Plank Status Pill */}
        <div className="bg-emerald-900/80 border border-emerald-500/30 backdrop-blur rounded-2xl px-4 py-2 font-bold text-white shadow-lg flex items-center gap-2">
          <span className="text-xs text-emerald-300 font-medium">Plank:</span>
          <span className="text-sm font-black text-amber-400">{Math.round(plankWidth)}px</span>
        </div>
      </div>

      {/* Wind Warning Banner */}
      <AnimatePresence>
        {windState.active && gameState === 'playing' && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-36 left-0 right-0 z-20 flex justify-center pointer-events-none"
          >
            <div className={`px-5 py-2 rounded-full font-black text-sm uppercase tracking-wider shadow-2xl flex items-center gap-2 text-white border ${
              windState.direction > 0 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-indigo-400'
            }`}>
              {windState.direction < 0 && <span className="text-xl animate-bounce">⬅️</span>}
              <span>💨 Strong Wind Gust!</span>
              {windState.direction > 0 && <span className="text-xl animate-bounce">➡️</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {globalDemoMode && (
        <div className="absolute top-36 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-emerald-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            Use Left/Right Arrow Keys
          </div>
        </div>
      )}

      {/* SETUP SCREEN */}
      {gameState === 'setup' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-emerald-950/95 backdrop-blur-md p-6 text-center text-white">
          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-400/30 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-inner">
            ⚖️
          </div>
          <h2 className="text-3xl font-black mb-2 text-emerald-400">Balance Board</h2>
          <p className="text-emerald-200/80 mb-6 max-w-[280px] text-sm leading-relaxed">
            Tilt your phone to keep the ball balanced. Watch out for sudden <strong className="text-cyan-300">Wind Gusts</strong> & heavy <strong className="text-amber-400">Anvil drops</strong>! Collect <strong className="text-emerald-300">Gems 💎</strong> for bonus points.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-[280px]">
            <div className="bg-emerald-900/60 border border-emerald-700/40 rounded-xl p-2 flex flex-col items-center">
              <span className="text-xl">💨</span>
              <span className="text-[10px] font-bold uppercase text-emerald-300 mt-1">Wind</span>
            </div>
            <div className="bg-emerald-900/60 border border-emerald-700/40 rounded-xl p-2 flex flex-col items-center">
              <span className="text-xl">⚓</span>
              <span className="text-[10px] font-bold uppercase text-amber-300 mt-1">Anvils</span>
            </div>
            <div className="bg-emerald-900/60 border border-emerald-700/40 rounded-xl p-2 flex flex-col items-center">
              <span className="text-xl">💎</span>
              <span className="text-[10px] font-bold uppercase text-cyan-300 mt-1">+50 Pts</span>
            </div>
          </div>

          <button 
            className="w-full max-w-[280px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-lg py-4 rounded-full shadow-xl hover:from-emerald-600 hover:to-teal-600 transition-transform active:scale-95 border border-emerald-300/30"
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

      {/* GAMEPLAY STAGE */}
      <div className="flex-1 relative bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 flex items-center justify-center overflow-hidden">
        
        {/* Animated Wind Particle Overlay */}
        {windState.active && (
          <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
            <motion.div 
              className="w-[200%] h-full flex items-center justify-around text-4xl text-cyan-200"
              animate={{ x: windState.direction > 0 ? ['-50%', '0%'] : ['0%', '-50%'] }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
            >
              <span>~~~</span>
              <span>~~~</span>
              <span>~~~</span>
            </motion.div>
          </div>
        )}

        {/* Seesaw Pivot & Plank Container */}
        <div className="relative flex flex-col items-center justify-center h-72 w-full mt-16">
          
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
              className={`absolute rounded-full shadow-[inset_-3px_-4px_10px_rgba(0,0,0,0.4)] z-20 
                ${isFallen ? 'bg-red-500' : 'bg-gradient-to-tr from-amber-600 to-yellow-400 border border-amber-200/50'}`}
              style={{
                width: BALANCE_CONFIG.BALL_RADIUS * 2,
                height: BALANCE_CONFIG.BALL_RADIUS * 2,
                bottom: BALANCE_CONFIG.PLANK_HEIGHT,
                x: ballX,
              }}
              animate={isFallen ? { y: 300, opacity: 0 } : { y: 0, opacity: 1 }}
              transition={{ duration: isFallen ? 0.5 : 0 }}
            />

            {/* Spawned Items on Plank (Gems & Anvils) */}
            {items.map(item => (
              <motion.div
                key={item.id}
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute z-10 flex items-center justify-center"
                style={{
                  bottom: BALANCE_CONFIG.PLANK_HEIGHT,
                  x: item.x,
                }}
              >
                {item.type === 'gem' ? (
                  <span className="text-2xl drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse">💎</span>
                ) : (
                  <span className="text-2xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">⚓</span>
                )}
              </motion.div>
            ))}

            {/* Floating Score Popups (+50!) */}
            <AnimatePresence>
              {scorePopups.map(popup => (
                <motion.div
                  key={popup.id}
                  initial={{ y: -10, opacity: 1, scale: 0.8 }}
                  animate={{ y: -50, opacity: 0, scale: 1.3 }}
                  exit={{ opacity: 0 }}
                  className="absolute z-30 font-black text-amber-300 text-lg drop-shadow-md pointer-events-none"
                  style={{
                    bottom: BALANCE_CONFIG.PLANK_HEIGHT + 20,
                    x: popup.x,
                  }}
                >
                  {popup.text}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* The Plank */}
            <div 
              className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-2xl rounded-md border-t-2 border-amber-500/60 z-0 transition-all"
              style={{
                width: plankWidth,
                height: BALANCE_CONFIG.PLANK_HEIGHT,
              }}
            />
          </motion.div>

          {/* The Fulcrum / Drum Base */}
          <div className="w-16 h-16 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full mt-[-8px] shadow-2xl border-4 border-gray-950 z-10 flex items-center justify-center">
             <div className="w-4 h-4 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>

          {/* Stand Base */}
          <div className="w-24 h-12 bg-gray-950 rounded-t-2xl border-t-2 border-gray-800 -mt-2 z-0" />

        </div>

      </div>

      {/* RESULT SCREEN */}
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
