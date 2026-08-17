// Default configurations for game scoring

export const SCORING_EVENTS = {
  COLLECT_DIAMOND: 50,
  COLLECT_RING: 30,
  COLLECT_GIFT: 20,
  COLLECT_STAR: 10,
  HIT_BOMB: -30,
  JACKPOT_PERFECT: 500,
  JACKPOT_CLOSE: 100,
};

export function calculateGameScore(events) {
  // Can be used to sum up a list of events if needed
  return events.reduce((acc, curr) => acc + (SCORING_EVENTS[curr] || 0), 0);
}
