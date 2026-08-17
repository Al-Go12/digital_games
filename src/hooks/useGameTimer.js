import { useState, useEffect } from 'react';

export function useGameTimer(initialTime, isRunning, onTimeUp) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, onTimeUp]);

  const resetTimer = () => setTimeLeft(initialTime);

  return { timeLeft, resetTimer };
}
