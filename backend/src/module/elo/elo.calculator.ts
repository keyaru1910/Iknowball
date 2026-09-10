export type EloResult = 1 | 0.5 | 0;

export interface EloUpdate {
  homeElo: number;
  awayElo: number;
  homeExpected: number;
  awayExpected: number;
}

export const DEFAULT_ELO = 1500;

export function expectedHomeScore(homeElo: number, awayElo: number, homeAdvantage = 65): number {
  return 1 / (1 + 10 ** (-(homeElo + homeAdvantage - awayElo) / 400));
}

/** Pure, side-effect-free Elo update. Actual result is from the home team's perspective. */
export function calculateEloUpdate(
  homeElo: number,
  awayElo: number,
  actualResult: EloResult,
  kFactor: number,
  homeAdvantage = 65,
): EloUpdate {
  const homeExpected = expectedHomeScore(homeElo, awayElo, homeAdvantage);
  const awayExpected = 1 - homeExpected;
  const delta = kFactor * (actualResult - homeExpected);

  return {
    homeElo: Number((homeElo + delta).toFixed(2)),
    awayElo: Number((awayElo - delta).toFixed(2)),
    homeExpected,
    awayExpected,
  };
}

export function kFactor(matchesPlayed: number): number {
  return matchesPlayed < 30 ? 32 : 20;
}
