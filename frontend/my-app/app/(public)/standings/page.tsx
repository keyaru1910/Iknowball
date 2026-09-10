"use client";

import { useEffect, useState } from "react";
import { useStandings } from "../../hooks/useStandings";
import { useLeagues } from "../../hooks/useLeagues";
import { useSport } from "../../context/SportContext";
import StandingsTable, { type StandingRow } from "../../components/StandingsTable";
import SeasonSelector from "../../components/SeasonSelector";
import { DEFAULT_SEASON } from "../../lib/constants/seasons";
import { colors } from "../../lib/design-tokens";

export default function StandingsPage() {
  const { sport, isBasketball } = useSport();
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<string>(DEFAULT_SEASON);
  const { data: leagues = [], isLoading: isLoadingLeagues, isError: isLeaguesError } = useLeagues(sport);

  useEffect(() => {
    setSelectedLeagueId("");
  }, [sport]);

  useEffect(() => {
    if (leagues.length > 0 && !leagues.some((league) => league.id === selectedLeagueId)) {
      setSelectedLeagueId(leagues[0].id);
    }
  }, [leagues, selectedLeagueId]);

  const { data: apiRows, isLoading: isLoadingStandings, isError: isStandingsError } = useStandings(selectedLeagueId, selectedSeason);
  const rows: StandingRow[] = (apiRows ?? []).map((row) => ({
    position: row.position,
    team: { id: row.team.id, name: row.team.name, logoUrl: row.team.logoUrl },
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    form: row.form,
  }));

  const isLoading = isLoadingLeagues || (Boolean(selectedLeagueId) && isLoadingStandings);
  const hasError = isLeaguesError || isStandingsError;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bảng xếp hạng {isBasketball ? "Bóng rổ (NBA)" : "Bóng đá"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
            {isBasketball
              ? "Bảng xếp hạng giải Bóng rổ Nhà nghề Mỹ NBA theo từng mùa giải."
              : "Bảng xếp hạng bóng đá các giải đấu hàng đầu theo từng mùa giải."}
          </p>
        </div>

        {/* Season Selector */}
        <SeasonSelector
          selectedSeason={selectedSeason}
          onSelectSeason={setSelectedSeason}
          variant="pill"
        />
      </div>

      {/* Leagues Tabs */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b pb-3 scrollbar-none" style={{ borderColor: colors.borderSoft }}>
        {leagues.map((league) => (
          <button
            key={league.id}
            type="button"
            onClick={() => setSelectedLeagueId(league.id)}
            className="whitespace-nowrap rounded-sm px-4 py-2 text-xs font-semibold transition-all hover:text-white"
            style={{
              backgroundColor: selectedLeagueId === league.id ? colors.panelAlt : "transparent",
              border: `1px solid ${selectedLeagueId === league.id ? colors.accent : colors.border}`,
              color: selectedLeagueId === league.id ? colors.accent : colors.textMuted,
            }}
          >
            {league.name}{league.country ? ` (${league.country})` : ""}
          </button>
        ))}
      </div>

      <div className="rounded-md border p-4 sm:p-6" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
        {isLoading ? (
          <div className="flex flex-col gap-3 py-6">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-10 animate-pulse rounded-sm" style={{ backgroundColor: colors.panelAlt }} />)}</div>
        ) : hasError ? (
          <p className="py-8 text-center text-sm text-rose-400">Không thể tải bảng xếp hạng lúc này.</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: colors.textMuted }}>
            Chưa có dữ liệu bảng xếp hạng cho mùa giải này.
          </p>
        ) : (
          <StandingsTable rows={rows} />
        )}
      </div>
    </div>
  );
}
