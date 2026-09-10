import { calculateEloUpdate, expectedHomeScore } from './elo.calculator';

describe('Elo calculator', () => {
  it('moves rating slightly when the expected favourite wins', () => {
    const update = calculateEloUpdate(1700, 1500, 1, 20);
    expect(update.homeElo - 1700).toBeLessThan(8);
    expect(update.awayElo).toBeLessThan(1500);
  });

  it('moves rating more for an upset', () => {
    const favourite = calculateEloUpdate(1700, 1500, 1, 20);
    const upset = calculateEloUpdate(1700, 1500, 0, 20);
    expect(1700 - upset.homeElo).toBeGreaterThan(favourite.homeElo - 1700);
  });

  it('uses home advantage in expected score', () => {
    expect(expectedHomeScore(1500, 1500)).toBeGreaterThan(0.5);
  });
});
