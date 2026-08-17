export const POSE_FREEZE_CONFIG = {
  PREPARATION_TIME: 10, // seconds to get into pose
  FREEZE_TIME: 5, // seconds to hold the pose
  TARGET_POSES: [
    {
      id: 'hands-up',
      name: 'Hands Up',
      visual: '\\ O /',
      description: 'Raise both arms high!',
      // Approximate target relative y-coordinates for wrists (landmarks 15, 16) relative to shoulders (11, 12)
      check: (landmarks) => {
        if (!landmarks || landmarks.length < 17) return 0;
        const lShoulder = landmarks[11];
        const rShoulder = landmarks[12];
        const lWrist = landmarks[15];
        const rWrist = landmarks[16];
        
        // Wrist should be higher (smaller Y) than shoulder
        let score = 0;
        if (lWrist.y < lShoulder.y) score += 50;
        if (rWrist.y < rShoulder.y) score += 50;
        
        return score;
      }
    },
    {
      id: 'T-pose',
      name: 'T-Pose',
      visual: '- O -',
      description: 'Arms out to the sides!',
      check: (landmarks) => {
        if (!landmarks || landmarks.length < 17) return 0;
        const lShoulder = landmarks[11];
        const rShoulder = landmarks[12];
        const lWrist = landmarks[15];
        const rWrist = landmarks[16];
        
        // Wrists should be approximately at shoulder Y level
        let score = 100;
        const leftDiff = Math.abs(lWrist.y - lShoulder.y);
        const rightDiff = Math.abs(rWrist.y - rShoulder.y);
        
        score -= (leftDiff + rightDiff) * 100; // Penalize deviation
        return Math.max(0, Math.min(100, score));
      }
    }
  ]
};
