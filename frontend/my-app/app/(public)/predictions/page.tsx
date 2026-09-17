"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMatches } from "../../hooks/useMatches";
import { useLeagues } from "../../hooks/useLeagues";
import { useSport } from "../../context/SportContext";
import MatchCard from "../../components/MatchCard";
import MatchDateFilter from "../../components/MatchDateFilter";
import PredictionDisclaimer from "../../components/PredictionDisclaimer";
import CsvExportButton from "../../components/CsvExportButton";
import { layMuaGiaiHienTai } from "../../lib/constants/seasons";
import { colors, type MatchStatus } from "../../lib/design-tokens";

/**
 * Trang danh sách dự đoán AI trung tâm của iKnowBall (/predictions)
 * Hỗ trợ lọc theo ngày, giải đấu, mùa giải, trạng thái trận đấu và chuyển đổi Bóng đá / Bóng rổ (NBA).
 */
export default function PredictionsPage() {
  const router = useRouter();
  const { isBasketball } = useSport();

  const sport = isBasketball ? "basketball" : "football";
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | undefined>(undefined);
  const [selectedSeason, setSelectedSeason] = useState<string>(() => layMuaGiaiHienTai(sport));
  const [statusTab, setStatusTab] = useState<"all" | MatchStatus>("all");

  // Tự động đồng bộ mùa giải khi chuyển đổi giữa Bóng đá và Bóng rổ
  useEffect(() => {
    setSelectedSeason(layMuaGiaiHienTai(sport));
  }, [sport]);

  const { data: leagues = [] } = useLeagues(sport);
  const { data: matchesData, isLoading, isError } = useMatches({
    date: selectedDate,
    leagueId: selectedLeagueId,
    sport,
    // Khi người dùng chọn một ngày cụ thể, xem toàn bộ trận trong ngày
    season: selectedDate ? undefined : selectedSeason,
  });

  const displayMatches = matchesData ?? [];

  const filteredMatches = displayMatches.filter((m) => {
    if (statusTab === "all") return true;
    return m.status === statusTab;
  });

  const liveCount = displayMatches.filter((m) => m.status === "live").length;
  const upcomingCount = displayMatches.filter((m) => m.status === "upcoming").length;
  const finishedCount = displayMatches.filter((m) => m.status === "finished").length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Header & Title Section */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
              style={{
                backgroundColor: `${colors.accent}15`,
                color: colors.accent,
              }}
            >
              AI Prediction Engine v1.0
            </span>
            <span className="text-xs" style={{ color: colors.textFaint }}>
              • {isBasketball ? "Mô hình NBA 2 chiều" : "Mô hình Đa lớp 3 chiều (Thắng/Hòa/Thua)"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Dự đoán trận đấu {isBasketball ? "Bóng rổ (NBA)" : "Bóng đá"}
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            {isBasketball
              ? "Xác suất chiến thắng trận đấu NBA được tính toán từ mô hình Logistic Regression kết hợp Elo rating và phong độ gần đây."
              : "Xác suất kết quả Thắng - Hòa - Khách dựa trên dữ liệu thống kê khách quan, phân tích chênh lệch thực lực và phong độ."}
          </p>
        </div>

        {/* Header Actions: Live indicator & CSV Export */}
        <div className="flex items-center gap-3 flex-wrap">
          <CsvExportButton
            type="predictions"
            leagueId={selectedLeagueId}
            season={selectedSeason}
            sport={sport}
            label="Xuất CSV Dự Đoán"
          />

          {liveCount > 0 && (
            <div
              className="flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-semibold"
              style={{
                borderColor: `${colors.live}40`,
                backgroundColor: `${colors.live}15`,
                color: colors.live,
              }}
            >
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: colors.live }} />
              {liveCount} trận trực tiếp
            </div>
          )}
        </div>
      </div>

      {/* Real-time VIP Fluctuation Alert Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-cyan-500/10 border border-amber-500/25 p-4 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
            🔥
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs sm:text-sm font-bold text-white">Tín Hiệu Biến Động Odds & Value Bet Hôm Nay</p>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                VIP Signals
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
              Hệ thống vừa ghi nhận biến động xác suất tại các cặp đấu tâm điểm. Theo dõi trực tiếp trên Kênh VIP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <a
            href="/alerts"
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-all"
          >
            Xem Biến Động
          </a>
          <a
            href="/vip"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1"
          >
            <span>Kênh VIP Telegram</span>
            <span>→</span>
          </a>
        </div>
      </div>

      {/* Date, League & Season Filters */}
      <div
        className="mb-6 rounded-xl border p-4 shadow-sm"
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
          sport={sport}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b pb-3 overflow-x-auto scrollbar-none" style={{ borderColor: colors.borderSoft }}>
        <button
          type="button"
          onClick={() => setStatusTab("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
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
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
            statusTab === "live" ? "shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: statusTab === "live" ? colors.panelAlt : "transparent",
            color: statusTab === "live" ? colors.live : colors.textMuted,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.live }} />
          Trực tiếp ({liveCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("upcoming")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
            statusTab === "upcoming" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: statusTab === "upcoming" ? colors.panelAlt : "transparent",
            color: statusTab === "upcoming" ? colors.accent : colors.textMuted,
          }}
        >
          Sắp tới ({upcomingCount})
        </button>

        <button
          type="button"
          onClick={() => setStatusTab("finished")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
            statusTab === "finished" ? "text-white shadow-sm" : "hover:text-white"
          }`}
          style={{
            backgroundColor: statusTab === "finished" ? colors.panelAlt : "transparent",
            color: statusTab === "finished" ? colors.accent : colors.textMuted,
          }}
        >
          Đã kết thúc ({finishedCount})
        </button>
      </div>

      {/* Match Prediction Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border"
              style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
            />
          ))}
        </div>
      ) : isError ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: colors.loss, backgroundColor: `${colors.loss}10` }}
        >
          <p className="text-sm font-semibold text-rose-400">
            Không thể kết nối đến máy chủ dự đoán thể thao.
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            Hệ thống đang tự động thử lại kết nối. Vui lòng tải lại trang sau ít phút.
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-gray-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
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
                onClick={(id) => router.push(`/predictions/${id}`)}
              />
            ))}
          </div>

          {/* Cảnh báo & Miễn trừ trách nhiệm */}
          <PredictionDisclaimer variant="compact" />
        </div>
      )}
    </div>
  );
}
