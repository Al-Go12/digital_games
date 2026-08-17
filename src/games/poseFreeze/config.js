export const POSE_FREEZE_CONFIG = {
  TOTAL_TIME: 20, 
  HOLD_TIME: 5, 
  TARGET_POSES: [
    {
      id: 'high-five',
      name: 'High Five',
      visual: '✋',
      description: 'Open your palm and spread your fingers!',
      check: (landmarks) => {
        if (!landmarks || landmarks.length < 21) return 0;
        const wrist = landmarks[0];
        const tips = [8, 12, 16, 20];
        
        // All tips must be above wrist
        let score = 0;
        let allUp = true;
        for (let tip of tips) {
          if (landmarks[tip].y < wrist.y - 0.1) {
            score += 25;
          } else {
            allUp = false;
          }
        }
        return allUp ? 100 : score;
      }
    },
    {
      id: 'peace-sign',
      name: 'Peace Sign',
      visual: '✌️',
      description: 'Show a peace sign (Index and Middle fingers up)!',
      check: (landmarks) => {
        if (!landmarks || landmarks.length < 21) return 0;
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        const middleTip = landmarks[12];
        const middlePip = landmarks[10];
        
        const ringTip = landmarks[16];
        const ringPip = landmarks[14];
        const pinkyTip = landmarks[20];
        const pinkyPip = landmarks[18];

        let score = 0;
        // Index and Middle should be extended (tip higher than pip)
        if (indexTip.y < indexPip.y) score += 25;
        if (middleTip.y < middlePip.y) score += 25;
        
        // Ring and Pinky should be curled (tip lower than pip)
        if (ringTip.y > ringPip.y) score += 25;
        if (pinkyTip.y > pinkyPip.y) score += 25;
        
        return score;
      }
    },
    {
      id: 'thumbs-up',
      name: 'Thumbs Up',
      visual: '👍',
      description: 'Give a thumbs up! (Other fingers curled)',
      check: (landmarks) => {
        if (!landmarks || landmarks.length < 21) return 0;
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        
        let score = 0;
        // Thumb should be highest point
        const highestOther = Math.min(indexTip.y, middleTip.y, ringTip.y, pinkyTip.y);
        
        if (thumbTip.y < highestOther) score += 50;
        
        // Other fingers should be curled (close together in y)
        const range = Math.max(indexTip.y, middleTip.y, ringTip.y, pinkyTip.y) - highestOther;
        if (range < 0.15) score += 50; // Tightly curled fingers share similar y
        
        return score;
      }
    }
  ]
};
