import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useCamera } from '../../hooks/useCamera';
import { useHandTracking } from '../../hooks/useHandTracking';
import { usePermissions } from '../../engine/PermissionContext';
import { calculateReward } from '../../engine/rewards';

import { GESTURE_CATALOG, GESTURE_MEMORY_CONFIG } from './config';
import { useGestureMemoryLogic } from './gestureMemoryLogic';

export function PoseFreeze() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { camera, globalDemoMode } = usePermissions();

  const activeDemoMode = isDemoMode || globalDemoMode;
  const isCameraEnabled = !activeDemoMode && camera.stream !== null;

  const { isLoaded, handData, demoMode } = useHandTracking(
    camera.videoRef,
    isCameraEnabled
  );

  const rawLandmarks = handData?.landmarks || null;

  const {
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
  } = useGestureMemoryLogic(rawLandmarks, activeDemoMode || demoMode);

  const handleEnableCamera = async () => {
    const granted = await camera.requestPermission();
    if (granted) {
      setIsDemoMode(false);
      startGame();
    }
  };

  const handleUseDemoMode = () => {
    setIsDemoMode(true);
    startGame();
  };

  const reward = calculateReward(score, 'gesture-memory');
  const expectedKey = currentSequence[currentIndexInSeq];
  const expectedGesture = GESTURE_CATALOG[expectedKey];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-hidden font-sans select-none">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-purple-950/40 pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <Link to="/" className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Hub
        </Link>
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Gesture Memory</span>
          <span className="text-xs text-slate-400 block font-semibold">Score: {score}</span>
        </div>
        <div className="flex items-center space-x-2">
          {activeDemoMode ? (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              Demo Mode
            </span>
          ) : (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${camera.stream ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
              {camera.stream ? 'Camera Active' : 'Camera Off'}
            </span>
          )}
        </div>
      </div>

      {/* MAIN GAME VIEWPORT */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 overflow-y-auto">
        
        {/* PHASE 1: INSTRUCTIONS & SETUP */}
        {gamePhase === 'instructions' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-indigo-500/20">
              🧠✋
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-2">{GESTURE_MEMORY_CONFIG.TITLE}</h1>
              <p className="text-indigo-300 font-medium text-sm">{GESTURE_MEMORY_CONFIG.SHORT_DESC}</p>
            </div>

            <Card className="p-4 bg-slate-900/80 border-slate-800 text-left text-xs space-y-3">
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Game Rules</div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">1️⃣</span>
                <p className="text-slate-300">Memorize the sequence of hand gestures shown in each round.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">2️⃣</span>
                <p className="text-slate-300">When the sequence disappears, reproduce the exact gestures in order.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-lg">3️⃣</span>
                <p className="text-slate-300">You have 2 attempts per gesture. Complete all 4 rounds to win!</p>
              </div>
            </Card>

            <div className="space-y-3">
              <Button onClick={handleEnableCamera} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Enable Camera</span>
              </Button>
              <Button onClick={handleUseDemoMode} variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs">
                Use Demo Mode (No Camera)
              </Button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: ROUND INTRO */}
        {gamePhase === 'round_intro' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full text-center space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold text-sm uppercase tracking-widest">
              ROUND {currentRoundConfig.round} / {GESTURE_MEMORY_CONFIG.ROUNDS.length}
            </div>
            
            <h2 className="text-3xl font-black tracking-tight text-white">Watch Carefully</h2>
            <p className="text-slate-400 text-sm">
              You will have {currentRoundConfig.memorizeTimeSeconds} seconds to memorize {currentRoundConfig.gesturesCount} gestures.
            </p>

            <Button onClick={startMemorization} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-base shadow-lg shadow-indigo-600/30">
              Start Memorization
            </Button>
          </motion.div>
        )}

        {/* PHASE 3: MEMORIZATION PHASE */}
        {gamePhase === 'memorizing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full text-center space-y-8">
            <div className="text-xs uppercase tracking-widest text-amber-400 font-extrabold animate-pulse">
              MEMORIZE THE SEQUENCE
            </div>

            {/* Gestures Display */}
            <div className="flex flex-wrap items-center justify-center gap-2 py-4 px-3 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl">
              {currentSequence.map((gKey, idx) => {
                const info = GESTURE_CATALOG[gKey];
                return (
                  <React.Fragment key={idx}>
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center bg-slate-800/90 border border-slate-700/80 p-2.5 rounded-xl min-w-[55px]"
                    >
                      <span className="text-3xl mb-1">{info.visual}</span>
                      <span className="text-[9px] font-bold text-slate-300">{info.name}</span>
                    </motion.div>
                    {idx < currentSequence.length - 1 && (
                      <span className="text-slate-500 font-bold text-xs">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Countdown */}
            <div className="flex flex-col items-center">
              <span className="text-6xl font-black text-amber-400 animate-bounce">{memorizeCountdown}</span>
              <span className="text-xs font-semibold text-slate-400 mt-2">Hiding sequence soon...</span>
            </div>
          </motion.div>
        )}

        {/* PHASE 4: PERFORMANCE PHASE */}
        {(gamePhase === 'performing' || gamePhase === 'gesture_result') && (
          <div className="w-full max-w-md flex flex-col items-center space-y-4">
            
            {/* Progress Bar & Counter */}
            <div className="w-full bg-slate-900/90 border border-slate-800/80 p-3 rounded-2xl flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>ROUND {currentRoundConfig.round}</span>
                <span>GESTURE {currentIndexInSeq + 1} / {currentSequence.length}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                {currentSequence.map((_, idx) => {
                  let status = 'upcoming'; // completed, current, upcoming
                  if (idx < currentIndexInSeq) status = 'completed';
                  else if (idx === currentIndexInSeq) status = 'current';

                  return (
                    <div 
                      key={idx} 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        status === 'completed' ? 'bg-emerald-500 text-white' :
                        status === 'current' ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30 scale-110' :
                        'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {status === 'completed' ? '✓' : idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prompt Banner */}
            <div className="w-full text-center bg-indigo-950/60 border border-indigo-800/50 p-4 rounded-2xl relative overflow-hidden">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-1">YOUR TURN</div>
              <div className="text-2xl font-black text-white flex items-center justify-center space-x-3">
                <span>SHOW</span>
                <span className="text-4xl">{expectedGesture?.visual}</span>
                <span>{expectedGesture?.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-semibold">
                Attempt {3 - attemptsLeft} / {GESTURE_MEMORY_CONFIG.MAX_ATTEMPTS_PER_GESTURE}
              </div>
            </div>

            {/* Feedback Popups */}
            <AnimatePresence>
              {feedback && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.9 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`w-full p-3 rounded-xl border text-center font-bold text-sm shadow-xl ${
                    feedback.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200' : 'bg-rose-950/90 border-rose-500/80 text-rose-200'
                  }`}
                >
                  <div>{feedback.text}</div>
                  {feedback.subtext && <div className="text-xs font-normal mt-1 opacity-90">{feedback.subtext}</div>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera Viewport or Demo Viewport */}
            <div className="w-full relative aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center">
              {!activeDemoMode ? (
                <>
                  <video 
                    ref={camera.bindVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                  />
                  {/* Subtle Hand Tracking Indicator */}
                  {handData && (
                    <div 
                      className="absolute w-12 h-12 rounded-full border-2 border-indigo-400 bg-indigo-500/30 backdrop-blur-xs pointer-events-none transition-all duration-75 flex items-center justify-center"
                      style={{
                        left: `${(1 - handData.x) * 100}%`,
                        top: `${handData.y * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="w-3 h-3 rounded-full bg-indigo-300 animate-ping" />
                    </div>
                  )}

                  {!isLoaded && isCameraEnabled && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                      <span className="text-xs font-semibold text-slate-300">Loading Hand Tracking AI Model...</span>
                    </div>
                  )}

                  {/* Detected Gesture Badge */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 flex items-center space-x-2 text-xs font-bold text-slate-200">
                    <span>Detected:</span>
                    <span className="text-base">{detectedGesture ? GESTURE_CATALOG[detectedGesture]?.visual : '❓'}</span>
                    <span>{detectedGesture ? GESTURE_CATALOG[detectedGesture]?.name : 'None'}</span>
                  </div>
                </>
              ) : (
                /* DEMO MODE VIEWPORT */
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="text-xs uppercase tracking-widest font-extrabold text-amber-400">DEMO MODE ACTIVE</div>
                  <p className="text-xs text-slate-400">Select a gesture button below to simulate participant input:</p>

                  <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
                    {Object.values(GESTURE_CATALOG).map(g => (
                      <button
                        key={g.id}
                        onClick={() => submitGesture(g.id)}
                        className="flex flex-col items-center justify-center bg-slate-800 hover:bg-indigo-600 border border-slate-700 p-2 rounded-xl transition-colors active:scale-95"
                      >
                        <span className="text-2xl mb-1">{g.visual}</span>
                        <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 5: ROUND COMPLETE */}
        {gamePhase === 'round_complete' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full text-center space-y-6 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">ROUND {currentRoundConfig.round} CLEARED!</h2>
              <p className="text-xs text-emerald-400 font-bold mt-1">+200 Round Completion Bonus</p>
            </div>

            <Button onClick={advanceNextRound} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-base shadow-lg shadow-emerald-600/30">
              Next Round →
            </Button>
          </motion.div>
        )}

        {/* PHASE 6: FINAL RESULT / REWARD SCREEN */}
        {gamePhase === 'game_over' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full text-center space-y-6 bg-slate-900/95 border border-slate-800 p-6 rounded-3xl shadow-2xl">
            {completedCount >= 13 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-4xl">
                  🎉
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">GESTURE MASTER!</h2>
                  <p className="text-xs font-semibold text-indigo-300 mt-1">You completed all 4 rounds perfectly.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-4xl">
                  👏
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">NICE TRY!</h2>
                  <p className="text-xs font-semibold text-slate-400 mt-1">You completed {currentRoundIndex} / 4 rounds.</p>
                </div>
              </>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Gestures</div>
                <div className="text-base font-extrabold text-indigo-400">{completedCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Retries</div>
                <div className="text-base font-extrabold text-amber-400">{retriesCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Score</div>
                <div className="text-base font-extrabold text-emerald-400">{score}</div>
              </div>
            </div>

            {/* Reward Card */}
            <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border border-amber-500/30 p-4 rounded-2xl text-center space-y-1">
              <div className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">REWARD UNLOCKED</div>
              <div className="text-2xl font-black text-white">{reward.label}</div>
              <div className="text-xs text-slate-300">{reward.message}</div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button onClick={startGame} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-base shadow-lg shadow-indigo-600/30">
                Play Again
              </Button>
              <Link to="/" className="block">
                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs">
                  Back to Games
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
