"use client";

import { useState, useEffect } from "react";
import { useStandings } from "../../hooks/useStandings";
import { useLeagues } from "../../hooks/useLeagues";
import { useSport } from "../../context/SportContext";
import StandingsTable, { type StandingRow } from "../../components/StandingsTable";
import { colors } from "../../lib/design-tokens";

// Dữ liệu mẫu BXH Bóng đá
const mockFootballStandings: StandingRow[] = [
  {
    position: 1,
    team: { id: "t-1", name: "Arsenal", logoUrl: "https://media.api-sports.io/football/teams/42.png" },
    played: 27,
    won: 20,
    drawn: 4,
    lost: 3,
    goalsFor: 62,
    goalsAgainst: 23,
    goalDifference: 39,
    points: 64,
    form: ["W", "W", "W", "W", "W"],
  },
  {
    position: 2,
    team: { id: "t-3", name: "Manchester City", logoUrl: "https://media.api-sports.io/football/teams/50.png" },
    played: 27,
    won: 19,
    drawn: 5,
    lost: 3,
    goalsFor: 59,
    goalsAgainst: 25,
    goalDifference: 34,
    points: 62,
    form: ["W", "D", "W", "W", "W"],
  },
  {
    position: 3,
    team: { id: "t-4", name: "Liverpool", logoUrl: "https://media.api-sports.io/football/teams/40.png" },
    played: 27,
    won: 18,
    drawn: 6,
    lost: 3,
    goalsFor: 64,
    goalsAgainst: 25,
    goalDifference: 39,
    points: 60,
    form: ["W", "W", "W", "D", "W"],
  },
  {
    position: 4,
    team: { id: "t-7", name: "Aston Villa", logoUrl: "https://media.api-sports.io/football/teams/66.png" },
    played: 27,
    won: 16,
    drawn: 4,
    lost: 7,
    goalsFor: 56,
    goalsAgainst: 37,
    goalDifference: 19,
    points: 52,
    form: ["L", "W", "W", "W", "L"],
  },
];

// Dữ liệu mẫu BXH Bóng rổ Regular Season (NBA)
const mockBasketballStandings: StandingRow[] = [
  {
    position: 1,
    team: { id: "tb-3", name: "Boston Celtics", logoUrl: "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg" },
    played: 58,
    won: 46,
    drawn: 0,
    lost: 12,
    goalsFor: 7018,
    goalsAgainst: 6420,
    goalDifference: 598,
    points: 92,
    form: ["W", "W", "W", "W", "W"],
  },
  {
    position: 2,
    team: { id: "tb-5", name: "Denver Nuggets", logoUrl: "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg" },
    played: 59,
    won: 41,
    drawn: 0,
    lost: 18,
    goalsFor: 6780,
    goalsAgainst: 6490,
    goalDifference: 290,
    points: 82,
    form: ["W", "W", "L", "W", "W"],
  },
  {
    position: 3,
    team: { id: "tb-1", name: "LA Lakers", logoUrl: "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg" },
    played: 59,
    won: 36,
    drawn: 0,
    lost: 23,
    goalsFor: 6920,
    goalsAgainst: 6810,
    goalDifference: 110,
    points: 72,
    form: ["W", "L", "W", "W", "L"],
  },
  {
    position: 4,
    team: { id: "tb-2", name: "GS Warriors", logoUrl: "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg" },
    played: 58,
    won: 34,
    drawn: 0,
    lost: 24,
    goalsFor: 6890,
    goalsAgainst: 6780,
    goalDifference: 110,
    points: 68,
    form: ["L", "W", "W", "L", "W"],
  },
];

// Dữ liệu mẫu BXH NBA Playoffs
const mockNbaPlayoffsStandings: StandingRow[] = [
  {
    position: 1,
    team: { id: "tb-3", name: "Boston Celtics (Chung kết)", logoUrl: "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg" },
    played: 16,
    won: 12,
    drawn: 0,
    lost: 4,
    goalsFor: 1820,
    goalsAgainst: 1690,
    goalDifference: 130,
    points: 24,
    form: ["W", "W", "W", "L", "W"],
  },
  {
    position: 2,
    team: { id: "tb-5", name: "Denver Nuggets (CK Miền Tây)", logoUrl: "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg" },
    played: 15,
    won: 10,
    drawn: 0,
    lost: 5,
    goalsFor: 1710,
    goalsAgainst: 1660,
    goalDifference: 50,
    points: 20,
    form: ["W", "L", "W", "W", "L"],
  },
  {
    position: 3,
    team: { id: "tb-1", name: "LA Lakers (Bán kết)", logoUrl: "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg" },
    played: 12,
    won: 7,
    drawn: 0,
    lost: 5,
    goalsFor: 1380,
    goalsAgainst: 1360,
    goalDifference: 20,
    points: 14,
    form: ["L", "W", "L", "W", "L"],
  },
  {
    position: 4,
    team: { id: "tb-2", name: "GS Warriors (Vòng 1)", logoUrl: "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg" },
    played: 7,
    won: 3,
    drawn: 0,
    lost: 4,
    goalsFor: 780,
    goalsAgainst: 790,
    goalDifference: -10,
    points: 6,
    form: ["W", "L", "L", "W", "L"],
  },
];

export default function StandingsPage() {
  const { isBasketball } = useSport();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(isBasketball ? "nba-east" : "39");

  const { data: leagues = [] } = useLeagues();
  const { data: apiRows, isLoading, isError } = useStandings(selectedLeagueId);

  // Tự động chuyển đổi tab giải đấu mặc định khi người dùng chuyển môn thể thao
  useEffect(() => {
    if (isBasketball) {
      if (selectedLeagueId !== "nba-east" && selectedLeagueId !== "nba-west" && selectedLeagueId !== "nba-playoffs") {
        setSelectedLeagueId("nba-east");
      }
    } else {
      if (selectedLeagueId === "nba-east" || selectedLeagueId === "nba-west" || selectedLeagueId === "nba-playoffs") {
        setSelectedLeagueId("39");
      }
    }
  }, [isBasketball, selectedLeagueId]);

  const footballLeagues = [
    { id: "39", name: "Premier League", country: "Anh", season: "2024-2025" },
    { id: "140", name: "La Liga", country: "Tây Ban Nha", season: "2024-2025" },
    { id: "135", name: "Serie A", country: "Ý", season: "2024-2025" },
    { id: "78", name: "Bundesliga", country: "Đức", season: "2024-2025" },
    { id: "2", name: "UEFA Champions League", country: "Châu Âu", season: "2024-2025" },
  ];

  const basketballLeagues = [
    { id: "nba-east", name: "NBA Eastern Conference", country: "USA", season: "2024-2025" },
    { id: "nba-west", name: "NBA Western Conference", country: "USA", season: "2024-2025" },
    { id: "nba-playoffs", name: "NBA Playoffs", country: "USA", season: "2024-2025" },
  ];

  const displayLeagues = isBasketball ? basketballLeagues : (leagues.length > 0 ? leagues : footballLeagues);

  const activeMockRows = isBasketball
    ? (selectedLeagueId === "nba-playoffs" ? mockNbaPlayoffsStandings : mockBasketballStandings)
    : mockFootballStandings;

  const rows: StandingRow[] =
    apiRows && apiRows.length > 0
      ? apiRows.map((r) => ({
          position: r.position,
          team: { id: r.team.id, name: r.team.name, logoUrl: r.team.logoUrl },
          played: r.played,
          won: r.won,
          drawn: r.drawn,
          lost: r.lost,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference,
          points: r.points,
          form: r.form,
        }))
      : activeMockRows;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bảng xếp hạng {isBasketball ? "Bóng rổ (NBA / Basketball)" : "Bóng đá"}
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            {isBasketball
              ? "Theo dõi tỷ lệ thắng/thua, hiệu số điểm (Point Differential) và phong độ các đội bóng rổ NBA."
              : "Cập nhật điểm số, hiệu số bàn thắng bại và phong độ 5 trận gần nhất."}
          </p>
        </div>
      </div>

      {/* League Selection Tabs */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b pb-3 scrollbar-none" style={{ borderColor: colors.borderSoft }}>
        {displayLeagues.map((lg) => {
          const isSelected = selectedLeagueId === lg.id;
          return (
            <button
              key={lg.id}
              type="button"
              onClick={() => setSelectedLeagueId(lg.id)}
              className={`whitespace-nowrap rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
                isSelected ? "text-white shadow-sm" : "hover:text-white"
              }`}
              style={{
                backgroundColor: isSelected ? colors.panelAlt : "transparent",
                border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                color: isSelected ? colors.accent : colors.textMuted,
              }}
            >
              {lg.name} {lg.country ? `(${lg.country})` : ""}
            </button>
          );
        })}
      </div>

      {/* Standings Table Container */}
      <div
        className="rounded-md border p-4 sm:p-6"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        {isLoading ? (
          <div className="flex flex-col gap-3 py-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-sm"
                style={{ backgroundColor: colors.panelAlt }}
              />
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-rose-400 text-sm">
            Không thể tải bảng xếp hạng lúc này.
          </div>
        ) : (
          <StandingsTable rows={rows} />
        )}

        {/* Legend Notes */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t pt-4 text-xs font-medium" style={{ borderColor: colors.borderSoft, color: colors.textMuted }}>
          {isBasketball ? (
            selectedLeagueId === "nba-playoffs" ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                  <span>Vòng Chung kết NBA Finals (Hạng 1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                  <span>Chung kết Miền (Conference Finals)</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                  <span>Vé vào thẳng Vòng Playoff (Hạng 1 - 6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                  <span>Vòng Play-In Tournament (Hạng 7 - 10)</span>
                </div>
              </>
            )
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                <span>Vòng bảng UEFA Champions League (Top 1 - 4)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                <span>Vòng bảng UEFA Europa League (Top 5)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.loss }} />
                <span>Xuống hạng (Top 18 - 20)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
