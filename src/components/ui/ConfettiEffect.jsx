import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function ConfettiEffect({ fire, config = {} }) {
  useEffect(() => {
    if (fire) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, ...config };

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount,
          origin: { x: Math.random(), y: Math.random() - 0.2 }
        }));
      }, 250);

      return () => clearInterval(interval);
    }
  }, [fire, config]);

  return null;
}
