import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { GameHub } from './components/layout/GameHub';
import { TiltBasket } from './games/tiltBasket/TiltBasket';
import { CatchDiamond } from './games/catchDiamond/CatchDiamond';
import { JackpotStop } from './games/jackpotStop/JackpotStop';
import { PoseFreeze } from './games/poseFreeze/PoseFreeze';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [currentScreen, setCurrentScreen] = useState('hub');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'hub':
        return <GameHub onSelectGame={setCurrentScreen} key="hub" />;
      case 'tilt-basket':
        return <TiltBasket onExit={() => setCurrentScreen('hub')} key="tilt-basket" />;
      case 'catch-diamond':
        return <CatchDiamond onExit={() => setCurrentScreen('hub')} key="catch-diamond" />;
      case 'jackpot-stop':
        return <JackpotStop onExit={() => setCurrentScreen('hub')} key="jackpot-stop" />;
      case 'pose-freeze':
        return <PoseFreeze onExit={() => setCurrentScreen('hub')} key="pose-freeze" />;
      default:
        return <GameHub onSelectGame={setCurrentScreen} key="hub" />;
    }
  };

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col h-full w-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

export default App;
