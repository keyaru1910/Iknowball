export type NewsSource = { key: string; sport: 'FOOTBALL' | 'BASKETBALL'; category?: string; name: string; url: string };
// URLs are allow-listed deliberately: admin cannot turn the server into an RSS proxy.
export const NEWS_SOURCES: NewsSource[] = [
  { key: 'football-hot', sport: 'FOOTBALL', category: 'hot', name: 'Bóng đá 24h', url: 'https://bongda24h.vn/RSS/279.rss' },
  { key: 'football-england', sport: 'FOOTBALL', category: 'premier-league', name: 'Bóng đá 24h', url: 'https://bongda24h.vn/RSS/172.rss' },
  { key: 'football-spain', sport: 'FOOTBALL', category: 'la-liga', name: 'Bóng đá 24h', url: 'https://bongda24h.vn/RSS/180.rss' },
  { key: 'football-italy', sport: 'FOOTBALL', category: 'serie-a', name: 'Bóng đá 24h', url: 'https://bongda24h.vn/RSS/176.rss' },
  { key: 'football-germany', sport: 'FOOTBALL', category: 'bundesliga', name: 'Bóng đá 24h', url: 'https://bongda24h.vn/RSS/193.rss' },
  { key: 'football-france', sport: 'FOOTBALL', category: 'ligue-1', name: 'Bóng đá 24h', url: 'https://bongda24h.vn/RSS/197.rss' },
  { key: 'football-ucl', sport: 'FOOTBALL', category: 'champions-league', name: 'Bóng đá 24h', url: 'https://bongda24h.vn/RSS/488.rss' },
  { key: 'nba', sport: 'BASKETBALL', category: 'nba', name: 'ESPN', url: 'https://www.espn.com/espn/rss/nba/news' },
];
