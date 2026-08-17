// Shared reward calculation engine

export const REWARD_TIERS = [
  { min: 0, max: 200, tier: "none", label: "Better Luck Next Time", message: "Keep practicing!" },
  { min: 201, max: 400, tier: "bronze", label: "₹100 Voucher", message: "Good job!" },
  { min: 401, max: 600, tier: "silver", label: "₹500 Voucher", message: "Great work!" },
  { min: 601, max: 750, tier: "gold", label: "₹1,000 Voucher", message: "Amazing!" },
  { min: 751, max: 99999, tier: "jackpot", label: "JACKPOT", message: "You are a master!" },
];

export function calculateReward(score, gameId) {
  // gameId can be used for game-specific reward maps if needed later
  
  for (const tier of REWARD_TIERS) {
    if (score >= tier.min && score <= tier.max) {
      return tier;
    }
  }
  
  // Fallback
  return REWARD_TIERS[0];
}
