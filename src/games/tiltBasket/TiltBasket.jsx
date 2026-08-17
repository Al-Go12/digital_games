import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '../../components/game/GameHeader';
import { Countdown } from '../../components/game/Countdown';
import { ResultScreen } from '../../components/game/ResultScreen';
import { PermissionModal } from '../../components/game/PermissionModal';
import { ConfettiEffect } from '../../components/ui/ConfettiEffect';
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation';
import { useGameTimer } from '../../hooks/useGameTimer';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useTiltBasketLogic } from './tiltBasketLogic';
import { TILT_BASKET_CONFIG } from './config';
import { calculateReward } from '../../engine/rewards';

export function TiltBasket({ onExit }) {
  const [gameState, setGameState] = useState('setup'); // setup, permission, countdown, playing, result
  
  const { orientation, permissionState, requestPermission, isSupported } = useDeviceOrientation();
  const { basketX, basketY, objects, score, updatePhysics, resetGame, floatingScores, GAME_WIDTH, GAME_HEIGHT } = useTiltBasketLogic(orientation);
  
  const { timeLeft, resetTimer } = useGameTimer(TILT_BASKET_CONFIG.GAME_DURATION, gameState === 'playing', () => {
    setGameState('result');
  });

  useGameLoop((deltaTime) => {
    const timeElapsed = TILT_BASKET_CONFIG.GAME_DURATION - timeLeft;
    updatePhysics(deltaTime, timeElapsed);
  }, gameState === 'playing');

  const handleStart = () => {
    if (permissionState === 'prompt') {
      setGameState('permission');
    } else {
      setGameState('countdown');
    }
  };

  const handlePermissionGrant = async () => {
    await requestPermission();
    setGameState('countdown');
  };

  const handleReplay = () => {
    resetGame();
    resetTimer();
    setGameState('countdown');
  };

  const reward = gameState === 'result' ? calculateReward(score, 'tilt-basket') : null;

  return (
    <div className="relative flex-1 flex flex-col h-full bg-blue-50 overflow-hidden">
      <GameHeader title="Tilt Basket" onExit={onExit} />
      
      {/* HUD */}
      <div className="absolute top-20 left-4 right-4 flex justify-between z-10">
        <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 font-bold text-blue-900 shadow-sm">
          {timeLeft}s
        </div>
        <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 font-black text-blue-900 shadow-sm text-xl">
          {score}
        </div>
      </div>

      {/* SETUP */}
      {gameState === 'setup' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm p-6 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl mb-4">🧺</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Tilt Basket</h2>
          <p className="text-gray-600 mb-8 max-w-[260px]">Tilt your phone left and right to move the basket and catch valuable objects. Avoid bombs!</p>
          <button 
            className="w-full max-w-[260px] bg-blue-600 text-white font-bold text-lg py-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
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
          description="We need access to your device's motion sensors to control the basket by tilting."
          isDenied={permissionState === 'denied' || !isSupported}
          onGrant={handlePermissionGrant}
          onDeny={() => setGameState('countdown')}
        />
      )}

      {/* COUNTDOWN */}
      {gameState === 'countdown' && (
        <Countdown onComplete={() => setGameState('playing')} />
      )}

      {/* GAMEPLAY AREA */}
      <div className="flex-1 relative bg-gradient-to-b from-blue-100 to-blue-50" style={{ maxWidth: GAME_WIDTH, margin: '0 auto', width: '100%' }}>
        {/* Basket */}
        <motion.div
          className="absolute bg-white shadow-lg border-4 border-blue-400 rounded-b-xl rounded-t-sm flex items-center justify-center text-2xl z-10"
          style={{ 
            width: TILT_BASKET_CONFIG.BASKET_WIDTH, 
            height: TILT_BASKET_CONFIG.BASKET_HEIGHT,
            x: basketX,
            y: basketY
          }}
          transition={{ type: 'tween', ease: 'linear', duration: 0 }}
        >
          🧺
        </motion.div>

        {/* Falling Objects */}
        {objects.map(obj => (
          <div
            key={obj.id}
            className="absolute flex items-center justify-center"
            style={{ 
              width: TILT_BASKET_CONFIG.OBJECT_SIZE, 
              height: TILT_BASKET_CONFIG.OBJECT_SIZE,
              transform: `translate(${obj.x}px, ${obj.y}px)`,
              fontSize: '28px',
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
              className={`absolute font-black text-xl z-20 ${fs.score > 0 ? 'text-green-500' : 'text-red-500'}`}
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
            onExit={onExit} 
          />
        </>
      )}
    </div>
  );
}
