import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { GameHub } from './components/layout/GameHub';
import { GlobalOnboarding } from './components/layout/GlobalOnboarding';
import { PermissionProvider, usePermissions } from './engine/PermissionContext';
import { TiltBasket } from './games/tiltBasket/TiltBasket';
import { CatchDiamond } from './games/catchDiamond/CatchDiamond';
import { BalanceBoard } from './games/balanceBoard/BalanceBoard';
import { PoseFreeze } from './games/poseFreeze/PoseFreeze';
import { motion, AnimatePresence } from 'framer-motion';

// Protected Route wrapper that enforces onboarding completion
function ProtectedRoute({ children }) {
  const { hasCompletedOnboarding } = usePermissions();
  if (!hasCompletedOnboarding) {
    return <Navigate to="/welcome" replace />;
  }
  return children;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/welcome" element={
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col h-full w-full"
          >
            <GlobalOnboarding />
          </motion.div>
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1 flex flex-col h-full w-full"
            >
              <GameHub />
            </motion.div>
          </ProtectedRoute>
        } />

        <Route path="/game/tilt-basket" element={<ProtectedRoute><TiltBasket /></ProtectedRoute>} />
        <Route path="/game/catch-diamond" element={<ProtectedRoute><CatchDiamond /></ProtectedRoute>} />
        <Route path="/game/balance-board" element={<ProtectedRoute><BalanceBoard /></ProtectedRoute>} />
        <Route path="/game/pose-freeze" element={<ProtectedRoute><PoseFreeze /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <PermissionProvider>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </PermissionProvider>
  );
}

export default App;
