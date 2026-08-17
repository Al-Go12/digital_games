export const CATCH_DIAMOND_CONFIG = {
  GAME_DURATION: 30,
  OBJECT_TYPES: [
    { id: 'diamond', emoji: '💎', score: 50, prob: 0.15 },
    { id: 'ring', emoji: '💍', score: 30, prob: 0.25 },
    { id: 'gift', emoji: '🎁', score: 20, prob: 0.3 },
    { id: 'bomb', emoji: '💣', score: -30, prob: 0.3 }
  ],
  SPAWN_RATE_MS: 1000, 
  CURSOR_RADIUS: 40,
  OBJECT_SIZE: 50
};
