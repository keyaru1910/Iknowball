"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMatches } from "../../hooks/useMatches";
import { useLeagues } from "../../hooks/useLeagues";
import { useSport } from "../../context/SportContext";
import MatchCard from "../../components/MatchCard";
import MatchDateFilter from "../../components/MatchDateFilter";
import { colors, type MatchStatus } from "../../lib/design-tokens";
import type { Match } from "../../lib/api/schemas/match.schema";

// Dữ liệu mẫu bóng đá
const mockFootballMatches: Match[] = [
  {
    id: "m-1",
    league: "Premier League",
    homeTeam: { id: "t-1", name: "Arsenal", logoUrl: "https://media.api-sports.io/football/teams/42.png" },
    awayTeam: { id: "t-2", name: "Chelsea", logoUrl: "https://media.api-sports.io/football/teams/49.png" },
    kickoffTime: new Date(Date.now() + 3600000).toISOString(),
    status: "live" as MatchStatus,
    homeScore: 2,
    awayScore: 1,
    minute: 68,
    prediction: { homeWinProb: 55, drawProb: 25, awayWinProb: 20 },
  },
  {
    id: "m-2",
    league: "Premier League",
    homeTeam: { id: "t-3", name: "Man City", logoUrl: "https://media.api-sports.io/football/teams/50.png" },
    awayTeam: { id: "t-4", name: "Liverpool", logoUrl: "https://media.api-sports.io/football/teams/40.png" },
    kickoffTime: new Date(Date.now() + 7200000).toISOString(),
    status: "upcoming" as MatchStatus,
    prediction: { homeWinProb: 48, drawProb: 26, awayWinProb: 26 },
  },
  {
    id: "m-3",
    league: "La Liga",
    homeTeam: { id: "t-5", name: "Real Madrid", logoUrl: "https://media.api-sports.io/football/teams/541.png" },
    awayTeam: { id: "t-6", name: "Barcelona", logoUrl: "https://media.api-sports.io/football/teams/529.png" },
    kickoffTime: new Date(Date.now() - 7200000).toISOString(),
    status: "finished" as MatchStatus,
    homeScore: 3,
    awayScore: 2,
  },
];

// Dữ liệu mẫu bóng rổ (NBA & VBA)
const mockBasketballMatches: Match[] = [
  {
    id: "b-1",
    league: "NBA Regular Season",
    homeTeam: { id: "tb-1", name: "LA Lakers", logoUrl: "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg" },
    awayTeam: { id: "tb-2", name: "GS Warriors", logoUrl: "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg" },
    kickoffTime: new Date(Date.now() + 1800000).toISOString(),
    status: "live" as MatchStatus,
    homeScore: 104,
    awayScore: 98,
    minute: 38, // Q4
    prediction: { homeWinProb: 62, drawProb: 0, awayWinProb: 38 },
  },
  {
    id: "b-2",
    league: "NBA Regular Season",
    homeTeam: { id: "tb-3", name: "Boston Celtics", logoUrl: "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg" },
    awayTeam: { id: "tb-4", name: "Milwaukee Bucks", logoUrl: "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg" },
    kickoffTime: new Date(Date.now() + 5400000).toISOString(),
    status: "upcoming" as MatchStatus,
    prediction: { homeWinProb: 58, drawProb: 0, awayWinProb: 42 },
  },
  {
    id: "b-3",
    league: "NBA Regular Season",
    homeTeam: { id: "tb-5", name: "Denver Nuggets", logoUrl: "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg" },
    awayTeam: { id: "tb-6", name: "Phoenix Suns", logoUrl: "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg" },
    kickoffTime: new Date(Date.now() - 10800000).toISOString(),
    status: "finished" as MatchStatus,
    homeScore: 118,
    awayScore: 112,
  },
];

export default function MatchesPage() {
  const router = useRouter();
  const { isBasketball } = useSport();
  const todayStr = new Intl.DateTimeFormat("en-CA").format(new Date());

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | undefined>(undefined);
  const [statusTab, setStatusTab] = useState<"all" | MatchStatus>("all");

  const { data: leagues = [] } = useLeagues();
  const { data: matchesData, isLoading, isError } = useMatches({
    date: selectedDate,
    leagueId: selectedLeagueId,
  });

  const activeMockMatches = isBasketball ? mockBasketballMatches : mockFootballMatches;
  const displayMatches = (matchesData && matchesData.length > 0) ? matchesData : activeMockMatches;

  const filteredMatches = displayMatches.filter((m) => {
    if (statusTab === "all") return true;
    return m.status === statusTab;
  });

  const liveCount = displayMatches.filter((m) => m.status === "live").length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Header & Title */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Lịch thi đấu & Kết quả {isBasketball ? "Bóng rổ (NBA)" : "Bóng đá"}
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            {isBasketball
              ? "Theo dõi tỷ số trực tiếp các hiệp đấu (Q1-Q4), bảng điểm NBA và phân tích xác suất thắng thua."
              : "Theo dõi tỷ số trực tiếp, lịch thi đấu và kết quả các giải bóng đá hàng đầu thế giới."}
          </p>
        </div>

        {/* Live indicator badge */}
        {liveCount > 0 && (
          <div
            className="flex items-center gap-2 self-start rounded-full border px-3 py-1 font-mono text-xs font-semibold"
            style={{
              borderColor: `${colors.live}40`,
              backgroundColor: `${colors.live}15`,
              color: colors.live,
            }}
          >
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: colors.live }} />
            {liveCount} trận đang diễn ra (Live)
          </div>
        )}
      </div>

      {/* Date & League Filters */}
      <div
        className="mb-6 rounded-md border p-4"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <MatchDateFilter
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedLeagueId={selectedLeagueId}
          onSelectLeagueId={setSelectedLeagueId}
          leagues={leagues}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b pb-3" style={{ borderColor: colors.borderSoft }}>
        <button
          type="button"
          onClick={() => setStatusTab("all")}
          className={`rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${
            statusTab === "all" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: statusTab === "all" ? colors.panelAlt : "transparent",
            color: statusTab === "all" ? colors.accent : colors.textMuted,
          }}
        >
          Tất cả ({displayMatches.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("live")}
          className={`flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${
            statusTab === "live" ? "shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: statusTab === "live" ? colors.panelAlt : "transparent",
            color: statusTab === "live" ? colors.live : colors.textMuted,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.live }} />
          Trực tiếp ({displayMatches.filter((m) => m.status === "live").length})
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("upcoming")}
          className={`rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${
            statusTab === "upcoming" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: statusTab === "upcoming" ? colors.panelAlt : "transparent",
            color: statusTab === "upcoming" ? colors.accent : colors.textMuted,
          }}
        >
          Sắp tới ({displayMatches.filter((m) => m.status === "upcoming").length})
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("finished")}
          className={`rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${
            statusTab === "finished" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: statusTab === "finished" ? colors.panelAlt : "transparent",
            color: statusTab === "finished" ? colors.accent : colors.textMuted,
          }}
        >
          Đã kết thúc ({displayMatches.filter((m) => m.status === "finished").length})
        </button>
      </div>

      {/* Match Cards Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-md border"
              style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
            />
          ))}
        </div>
      ) : isError ? (
        <div
          className="rounded-md border p-8 text-center"
          style={{ borderColor: colors.loss, backgroundColor: `${colors.loss}10` }}
        >
          <p className="text-sm font-medium text-rose-400">
            Không thể tải danh sách trận đấu. Vui lòng thử lại sau.
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div
          className="rounded-md border p-12 text-center"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <p className="text-sm font-medium" style={{ color: colors.textMuted }}>
            Không tìm thấy trận đấu nào phù hợp với bộ lọc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              id={match.id}
              league={match.league}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              kickoffTime={match.kickoffTime}
              status={match.status}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              prediction={match.prediction}
              onClick={(id) => router.push(`/matches/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
