import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage camera stream access.
 */
export function useCamera() {
  const [stream, setStream] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const videoRef = useRef(null);

  const requestPermission = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        }, 
        audio: false 
      });
      setStream(mediaStream);
      setPermissionState('granted');
      return true;
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      setPermissionState('denied');
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Bind stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return { stream, permissionState, requestPermission, stopCamera, videoRef };
}
