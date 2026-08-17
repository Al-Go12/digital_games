import { createContext, useContext, useState, useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [globalDemoMode, setGlobalDemoMode] = useState(false); // If user opts for demo mode universally

  const camera = useCamera();
  const orientation = useDeviceOrientation();

  const completeOnboarding = (isDemo = false) => {
    setGlobalDemoMode(isDemo);
    setHasCompletedOnboarding(true);
  };

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
