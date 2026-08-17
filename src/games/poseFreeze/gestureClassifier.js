/**
 * Relative Distance Hand Gesture Classifier for MediaPipe 21 Hand Landmarks.
 */

function euclideanDist(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const palmScale = euclideanDist(wrist, middleMcp);
  if (palmScale === 0) return null;

  // Relative extension ratios: distance(wrist, tip) / distance(wrist, mcp)
  // Extended finger ratio ~ 1.3 to 2.0; Curled finger ratio ~ 0.6 to 1.18
  const thumbRatio = euclideanDist(wrist, landmarks[4]) / euclideanDist(wrist, landmarks[2]);
  const indexRatio = euclideanDist(wrist, landmarks[8]) / euclideanDist(wrist, landmarks[5]);
  const middleRatio = euclideanDist(wrist, landmarks[12]) / euclideanDist(wrist, landmarks[9]);
  const ringRatio = euclideanDist(wrist, landmarks[16]) / euclideanDist(wrist, landmarks[13]);
  const pinkyRatio = euclideanDist(wrist, landmarks[20]) / euclideanDist(wrist, landmarks[17]);

  // Pinch distance (thumb tip 4 to index tip 8) normalized by palm scale
  const pinchDist = euclideanDist(landmarks[4], landmarks[8]) / palmScale;

  const isIndexExt = indexRatio > 1.25;
  const isMiddleExt = middleRatio > 1.25;
  const isRingExt = ringRatio > 1.25;
  const isPinkyExt = pinkyRatio > 1.25;
  const isThumbExt = thumbRatio > 1.2;

  const isIndexCurled = indexRatio < 1.2;
  const isMiddleCurled = middleRatio < 1.2;
  const isRingCurled = ringRatio < 1.2;
  const isPinkyCurled = pinkyRatio < 1.2;

  const extCount = (isIndexExt ? 1 : 0) + (isMiddleExt ? 1 : 0) + (isRingExt ? 1 : 0) + (isPinkyExt ? 1 : 0);
  const curledCount = (isIndexCurled ? 1 : 0) + (isMiddleCurled ? 1 : 0) + (isRingCurled ? 1 : 0) + (isPinkyCurled ? 1 : 0);

  // 1. OPEN PALM (✋) - At least 3 of 4 main fingers extended
  if (extCount >= 3) {
    return 'openPalm';
  }

  // 2. THUMBS UP (👍) - Thumb extended & pointing upward, other fingers curled
  const isThumbUpVertical = landmarks[4].y < landmarks[2].y;
  if (isThumbExt && isThumbUpVertical && curledCount >= 3) {
    return 'thumbsUp';
  }

  // 3. POINTING (☝️) - Index extended, middle/ring/pinky curled
  if (isIndexExt && isMiddleCurled && isRingCurled && isPinkyCurled) {
    return 'point';
  }

  // 4. PINCH (🤏) - Thumb tip & Index tip close together
  if (pinchDist < 0.40) {
    return 'pinch';
  }

  return null;
}

/**
 * Temporal smoothing class to prevent false single-frame gesture flips.
 */
export class GestureSmoother {
  constructor(windowSize = 3, threshold = 2) {
    this.windowSize = windowSize;
    this.threshold = threshold;
    this.history = [];
    this.currentStableGesture = null;
  }

  addFrame(rawGesture) {
    if (!rawGesture) {
      this.history.push(null);
    } else {
      this.history.push(rawGesture);
    }

    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // Count occurrences of non-null gestures
    const counts = {};
    for (const g of this.history) {
      if (g) {
        counts[g] = (counts[g] || 0) + 1;
      }
    }

    let dominant = null;
    let maxCount = 0;
    for (const [gesture, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = gesture;
      }
    }

    if (maxCount >= this.threshold) {
      this.currentStableGesture = dominant;
    }

    return this.currentStableGesture;
  }

  reset() {
    this.history = [];
    this.currentStableGesture = null;
  }
}
