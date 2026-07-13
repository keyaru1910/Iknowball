export type Sport = "Football" | "Basketball" | "E-sports";
export type MatchStatus = "LIVE" | "FT" | "Soon";

export type Match = {
  id: string;
  sport: Sport;
  league: string;
  home: string;
  away: string;
  score: [number, number];
  minute: string;
  status: MatchStatus;
  prediction: {
    home: number;
    draw: number;
    away: number;
    expected: string;
  };
  form: string[];
};

export const sports: Sport[] = ["Football", "Basketball", "E-sports"];

export const matches: Match[] = [
  {
    id: "mci-liv",
    sport: "Football",
    league: "Premier League",
    home: "Manchester City",
    away: "Liverpool",
    score: [2, 1],
    minute: "72'",
    status: "LIVE",
    prediction: { home: 58, draw: 24, away: 18, expected: "2.4 - 1.6" },
    form: ["W", "W", "D", "W", "L"],
  },
  {
    id: "lal-bos",
    sport: "Basketball",
    league: "NBA Summer",
    home: "Los Angeles",
    away: "Boston",
    score: [84, 80],
    minute: "Q4 07:18",
    status: "LIVE",
    prediction: { home: 51, draw: 0, away: 49, expected: "104 - 101" },
    form: ["W", "L", "W", "W", "W"],
  },
  {
    id: "t1-geng",
    sport: "E-sports",
    league: "LCK",
    home: "T1",
    away: "Gen.G",
    score: [1, 1],
    minute: "Map 3",
    status: "Soon",
    prediction: { home: 47, draw: 0, away: 53, expected: "1 - 2" },
    form: ["L", "W", "W", "L", "W"],
  },
  {
    id: "ars-che",
    sport: "Football",
    league: "Friendly",
    home: "Arsenal",
    away: "Chelsea",
    score: [0, 0],
    minute: "20:00",
    status: "Soon",
    prediction: { home: 44, draw: 29, away: 27, expected: "1.5 - 1.2" },
    form: ["D", "W", "W", "L", "D"],
  },
];

export const accuracyByWeek = [
  { label: "W1", value: 52 },
  { label: "W2", value: 55 },
  { label: "W3", value: 57 },
  { label: "W4", value: 61 },
];

export function statusLabel(status: MatchStatus) {
  if (status === "LIVE") return "LIVE";
  if (status === "FT") return "FT";
  return "Chua bat dau";
}

export function predictionTone(match: Match) {
  // Keep the visual result deterministic: the highest percentage becomes the active tone.
  const values = [
    { key: "home", value: match.prediction.home },
    { key: "draw", value: match.prediction.draw },
    { key: "away", value: match.prediction.away },
  ];

  return values.reduce((best, item) => (item.value > best.value ? item : best)).key;
}
