"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMatches } from "../../hooks/useMatches";
import { useLeagues } from "../../hooks/useLeagues";
import { useSport } from "../../context/SportContext";
import MatchCard from "../../components/MatchCard";
import MatchDateFilter from "../../components/MatchDateFilter";
import PredictionDisclaimer from "../../components/PredictionDisclaimer";
import { DEFAULT_SEASON } from "../../lib/constants/seasons";
import { colors, type MatchStatus } from "../../lib/design-tokens";

export default function MatchesPage() {
  const router = useRouter();
  const { isBasketball } = useSport();

  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | undefined>(undefined);
  const [selectedSeason, setSelectedSeason] = useState<string>(DEFAULT_SEASON);
  const [statusTab, setStatusTab] = useState<"all" | MatchStatus>("all");

  const sport = isBasketball ? "basketball" : "football";
  const { data: leagues = [] } = useLeagues(sport);
  const { data: matchesData, isLoading, isError } = useMatches({
    date: selectedDate,
    leagueId: selectedLeagueId,
    sport,
    season: selectedSeason,
  });

  const displayMatches = matchesData ?? [];

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

      {/* Date, League & Season Filters */}
      <div
        className="mb-6 rounded-md border p-4"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <MatchDateFilter
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedLeagueId={selectedLeagueId}
          onSelectLeagueId={setSelectedLeagueId}
          selectedSeason={selectedSeason}
          onSelectSeason={(season) => {
            setSelectedSeason(season);
            setSelectedDate(undefined);
            setSelectedLeagueId(undefined);
          }}
          leagues={leagues}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b pb-3" style={{ borderColor: colors.borderSoft }}>
        <button
          type="button"
          onClick={() => setStatusTab("all")}
          className={`rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${statusTab === "all" ? "text-white shadow-sm" : "hover:text-white"
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
          className={`flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${statusTab === "live" ? "shadow-sm" : "hover:text-white"
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
          className={`rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${statusTab === "upcoming" ? "text-white shadow-sm" : "hover:text-white"
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
          className={`rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all ${statusTab === "finished" ? "text-white shadow-sm" : "hover:text-white"
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
          <p className="text-sm font-semibold text-rose-400">
            Không thể kết nối đến nhà cung cấp dữ liệu thể thao (Provider Error).
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            Hệ thống đang tự động thử lại kết nối. Vui lòng tải lại trang sau ít phút.
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div
          className="rounded-md border p-12 text-center"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <p className="text-sm font-medium text-white">
            Không tìm thấy trận đấu nào phù hợp với bộ lọc ngày hoặc giải đấu này.
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            Hãy thử chọn một ngày khác hoặc chọn tất cả các giải đấu.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
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

          {/* Disclaimer cố định */}
          <PredictionDisclaimer variant="compact" />
        </div>
      )}
    </div>
  );
}
