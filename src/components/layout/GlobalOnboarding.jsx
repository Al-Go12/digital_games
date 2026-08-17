import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Smartphone, Activity } from 'lucide-react';
import { usePermissions } from '../../engine/PermissionContext';
import { Button } from '../ui/Button';

export function GlobalOnboarding() {
  const navigate = useNavigate();
  const { camera, orientation, completeOnboarding } = usePermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleGrantPermissions = async () => {
    setIsRequesting(true);
    
    // Request motion first
    await orientation.requestPermission();
    
    // Then request camera
    await camera.requestPermission();
    
    completeOnboarding(false);
    navigate('/');
  };

  const handleDemoMode = () => {
    completeOnboarding(true); // User opts for demo mode (mouse/keyboard fallbacks)
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-white text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full space-y-8"
      >
        <div>
          <div className="flex justify-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Camera size={32} />
            </div>
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Smartphone size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
            Interactive Experience
          </h1>
          <p className="text-gray-600 leading-relaxed font-medium text-sm">
            These games use your device's camera and motion sensors for an immersive experience. All processing is done locally on your device.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-left space-y-4">
          <div className="flex items-start space-x-3">
            <Camera className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Camera Access</p>
              <p className="text-xs text-gray-500 mt-0.5">Used for Hand & Body tracking</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Activity className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Motion Sensors</p>
              <p className="text-xs text-gray-500 mt-0.5">Used for Tilt & Balance games</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            variant="primary" 
            className="w-full py-4 text-lg shadow-lg" 
            onClick={handleGrantPermissions}
            disabled={isRequesting}
          >
            {isRequesting ? 'Requesting...' : 'Enable Access & Play'}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={handleDemoMode}
          >
            Continue in Demo Mode
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
