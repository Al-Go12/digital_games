export const BALANCE_CONFIG = {
  INITIAL_PLANK_WIDTH: 320, // Starting plank width
  MIN_PLANK_WIDTH: 200, // Plank shrinks to this minimum
  PLANK_SHRINK_RATE: 2.5, // Pixels shrunk per second
  PLANK_HEIGHT: 12,
  BALL_RADIUS: 14,
  MAX_TILT_ANGLE: 40, // max degrees
  GRAVITY: 750, // pixels per second squared
  FRICTION: 0.98, // dampening factor
  SCORE_PER_SECOND: 10,

  // Wind Mechanics
  WIND_INTERVAL_MS: 6000, // Wind triggers every ~6 seconds
  WIND_DURATION_MS: 2500, // Wind lasts for 2.5 seconds
  WIND_FORCE: 350, // Force pushing the ball horizontally

  // Items & Hazards Spawns
  SPAWN_INTERVAL_MS: 3500, // Item spawns every 3.5 seconds
  GEM_SCORE_BONUS: 50, // Score added per gem collected
  ANVIL_TORQUE_FORCE: 450, // Weight force pushing down one side
};
