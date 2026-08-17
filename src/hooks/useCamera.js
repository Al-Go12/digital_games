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

      // Bind to existing video element if present
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
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

  // Callback ref to attach video element when rendered in DOM
  const bindVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && stream) {
      if (node.srcObject !== stream) {
        node.srcObject = stream;
        node.play().catch(() => {});
      }
    }
  }, [stream]);

  // Ensure stream binding whenever stream or videoRef updates
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return { stream, permissionState, requestPermission, stopCamera, videoRef, bindVideoRef };
}
