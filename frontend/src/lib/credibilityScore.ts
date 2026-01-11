import type { Round } from '@/hooks/usePonderData';

export interface CredibilityScore {
  score: number; // 0-10
  label: string; // "Excellent", "Good", etc.
  color: string; // Tailwind color classes
  breakdown: {
    traction: number; // 0-10
    socialProof: number; // 0-10
    dealQuality: number; // 0-10
  };
}

/**
 * Calculate credibility score for a round based on:
 * - Traction (funding progress %)
 * - Social Proof (investor count)
 * - Deal Quality (equity % fairness)
 */
export function calculateCredibilityScore(round: Round): CredibilityScore {
  const fundingProgress = Number(round.totalRaised) / Number(round.targetRaise);
  const investorCount = Number(round.investorCount);
  const equityPercent = Number(round.equityPercentage) / 100; // Convert from basis points
  const targetRaise = Number(round.targetRaise) / 1e6; // Convert from USDC decimals

  // 1. Traction Score (0-10) - based on funding progress
  let tractionScore = 0;
  if (fundingProgress >= 0.75) tractionScore = 10;
  else if (fundingProgress >= 0.5) tractionScore = 8;
  else if (fundingProgress >= 0.25) tractionScore = 6;
  else if (fundingProgress >= 0.1) tractionScore = 4;
  else tractionScore = 2;

  // 2. Social Proof Score (0-10) - based on investor count
  let socialProofScore = 0;
  if (investorCount >= 30) socialProofScore = 10;
  else if (investorCount >= 15) socialProofScore = 8;
  else if (investorCount >= 6) socialProofScore = 6;
  else if (investorCount >= 3) socialProofScore = 4;
  else if (investorCount >= 1) socialProofScore = 2;
  else socialProofScore = 0;

  // 3. Deal Quality Score (0-10) - based on equity % fairness
  // Standard seed: 5-15% equity
  // Calculate implied valuation: targetRaise / (equityPercent / 100)
  let dealQualityScore = 0;
  if (equityPercent >= 10 && equityPercent <= 20) {
    dealQualityScore = 10; // Very investor-friendly
  } else if (equityPercent >= 5 && equityPercent < 10) {
    dealQualityScore = 8; // Standard terms
  } else if (equityPercent > 20 && equityPercent <= 30) {
    dealQualityScore = 7; // Generous but verify
  } else if (equityPercent >= 3 && equityPercent < 5) {
    dealQualityScore = 5; // High valuation
  } else if (equityPercent > 30) {
    dealQualityScore = 4; // Too generous, suspicious
  } else {
    dealQualityScore = 3; // Very high valuation or unusual
  }

  // Weight the scores (traction and social proof matter more)
  const weightedScore = (
    tractionScore * 0.4 +
    socialProofScore * 0.35 +
    dealQualityScore * 0.25
  );

  // Round to 1 decimal
  const finalScore = Math.round(weightedScore * 10) / 10;

  // Determine label and color
  let label: string;
  let color: string;
  if (finalScore >= 8) {
    label = 'Excellent';
    color = 'bg-[#1C4D8D] text-black';
  } else if (finalScore >= 6) {
    label = 'Good';
    color = 'bg-[#4988C4] text-black';
  } else if (finalScore >= 4) {
    label = 'Fair';
    color = 'bg-yellow-500 text-black';
  } else {
    label = 'Risky';
    color = 'bg-red-500 text-white';
  }

  return {
    score: finalScore,
    label,
    color,
    breakdown: {
      traction: tractionScore,
      socialProof: socialProofScore,
      dealQuality: dealQualityScore,
    },
  };
}

/**
 * Get a short description explaining the score
 */
export function getScoreExplanation(score: CredibilityScore): string {
  const parts: string[] = [];

  if (score.breakdown.traction >= 8) parts.push('Strong funding momentum');
  else if (score.breakdown.traction >= 6) parts.push('Good traction');
  else if (score.breakdown.traction >= 4) parts.push('Early stage');
  else parts.push('Very early');

  if (score.breakdown.socialProof >= 8) parts.push('high investor count');
  else if (score.breakdown.socialProof >= 6) parts.push('growing community');
  else if (score.breakdown.socialProof >= 4) parts.push('some validation');
  else parts.push('limited validation');

  return parts.join(', ');
}
