export const GESTURE_CATALOG = {
  openPalm: {
    id: 'openPalm',
    name: 'Open Palm',
    visual: '✋',
    description: 'Five fingers extended'
  },
  thumbsUp: {
    id: 'thumbsUp',
    name: 'Thumbs Up',
    visual: '👍',
    description: 'Thumb extended upward'
  },
  point: {
    id: 'point',
    name: 'Pointing',
    visual: '☝️',
    description: 'Index finger extended upward'
  },
  pinch: {
    id: 'pinch',
    name: 'Pinch',
    visual: '🤏',
    description: 'Thumb and index tips close together'
  }
};

export const GESTURE_KEYS = Object.keys(GESTURE_CATALOG);

/**
 * Generate a sequence of given length from supported gestures without consecutive duplicates.
 */
export function generateRandomSequence(length) {
  const sequence = [];
  let lastKey = null;

  for (let i = 0; i < length; i++) {
    const available = GESTURE_KEYS.filter(k => k !== lastKey);
    const chosen = available[Math.floor(Math.random() * available.length)];
    sequence.push(chosen);
    lastKey = chosen;
  }

  return sequence;
}

export const GESTURE_MEMORY_CONFIG = {
  TITLE: "Gesture Memory Challenge",
  SHORT_DESC: "Watch. Remember. Repeat.",
  MAX_ATTEMPTS_PER_GESTURE: 2,
  
  ROUNDS: [
    {
      round: 1,
      gesturesCount: 5,
      memorizeTimeSeconds: 3,
      presetSequence: ['openPalm', 'thumbsUp', 'point', 'pinch', 'openPalm']
    },
    {
      round: 2,
      gesturesCount: 5,
      memorizeTimeSeconds: 3,
      presetSequence: ['thumbsUp', 'openPalm', 'pinch', 'point', 'thumbsUp']
    },
    {
      round: 3,
      gesturesCount: 5,
      memorizeTimeSeconds: 3,
      presetSequence: ['point', 'thumbsUp', 'openPalm', 'pinch', 'point']
    },
    {
      round: 4,
      gesturesCount: 5,
      memorizeTimeSeconds: 3,
      presetSequence: ['pinch', 'point', 'openPalm', 'thumbsUp', 'pinch']
    }
  ],

  SCORING: {
    CORRECT_GESTURE: 100,
    NO_RETRY_BONUS: 50,
    SPEED_BONUS: 25, // Awarded if gesture submitted < 2.0s
    ROUND_COMPLETION_BONUS: 200
  }
};
