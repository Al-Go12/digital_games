export const TILT_BASKET_CONFIG = {
  GAME_DURATION: 30, // seconds
  OBJECT_TYPES: [
    { id: 'diamond', emoji: '💎', score: 50, prob: 0.1, speedMultiplier: 1.5 },
    { id: 'ring', emoji: '💍', score: 30, prob: 0.2, speedMultiplier: 1.2 },
    { id: 'gift', emoji: '🎁', score: 20, prob: 0.3, speedMultiplier: 1.0 },
    { id: 'star', emoji: '⭐', score: 10, prob: 0.25, speedMultiplier: 0.8 },
    { id: 'bomb', emoji: '💣', score: -30, prob: 0.15, speedMultiplier: 1.1 }
  ],
  SPAWN_RATE_MS: 800, // starting spawn rate
  BASKET_WIDTH: 80,
  BASKET_HEIGHT: 60,
  OBJECT_SIZE: 40
};
