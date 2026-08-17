import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [globalDemoMode, setGlobalDemoMode] = useState(false);
  const location = useLocation();

  const camera = useCamera();
  const orientation = useDeviceOrientation();

  const completeOnboarding = (isDemo = false) => {
    setGlobalDemoMode(isDemo);
    setHasCompletedOnboarding(true);
  };

  // Turn off camera stream when not playing a camera game to save battery
  useEffect(() => {
    const isCameraGame = location.pathname === '/game/catch-diamond' || location.pathname === '/game/pose-freeze';
    
    if (!isCameraGame) {
      if (camera.stream) {
        camera.stopCamera();
      }
    } else if (hasCompletedOnboarding && !globalDemoMode && !camera.stream) {
      // Re-request stream if returning to a camera game
      camera.requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, hasCompletedOnboarding, globalDemoMode]);

  return (
    <PermissionContext.Provider 
      value={{
        camera,
        orientation,
        hasCompletedOnboarding,
        completeOnboarding,
        globalDemoMode
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
