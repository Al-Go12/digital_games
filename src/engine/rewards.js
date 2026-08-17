// Shared reward calculation engine

export const REWARD_TIERS = [
  { min: 0, max: 200, tier: "none", label: "Better Luck Next Time", message: "Keep practicing!" },
  { min: 201, max: 400, tier: "bronze", label: "₹100 Voucher", message: "Good job!" },
  { min: 401, max: 600, tier: "silver", label: "₹500 Voucher", message: "Great work!" },
  { min: 601, max: 750, tier: "gold", label: "₹1,000 Voucher", message: "Amazing!" },
  { min: 751, max: 99999, tier: "jackpot", label: "JACKPOT", message: "You are a master!" },
];

export const GAME_CONFIGS = {
  'balance-board': {
    tiers: [
      { min: 0, max: 99, reward: REWARD_TIERS[1] }, // survive < 10 seconds
      { min: 100, max: 199, reward: REWARD_TIERS[2] }, // survive 10-20s
      { min: 200, max: 299, reward: REWARD_TIERS[3] }, // survive 20-30s
      { min: 300, max: Infinity, reward: REWARD_TIERS[4] } // survive > 30s
    ]
  },
};

export function calculateReward(score, gameId) {
  // Check if there is a specific config for this game
  if (GAME_CONFIGS[gameId]) {
    for (const tier of GAME_CONFIGS[gameId].tiers) {
      if (score >= tier.min && score <= tier.max) {
        return tier.reward;
      }
    }
  }
  
  // Default shared tiers
  for (const tier of REWARD_TIERS) {
    if (score >= tier.min && score <= tier.max) {
      return tier;
    }
  }
  
  // Fallback
  return REWARD_TIERS[0];
}
