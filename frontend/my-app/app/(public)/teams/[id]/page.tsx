"use client";

import { useParams, useRouter } from "next/navigation";
import { useTeamDetail, useTeamStats } from "../../../hooks/useTeamDetail";
import TeamFormBadge from "../../../components/TeamFormBadge";
import { colors } from "../../../lib/design-tokens";
import type { TeamDetail } from "../../../lib/api/schemas/team.schema";

const mockTeam: TeamDetail = {
  id: "t-1",
  name: "Arsenal FC",
  shortName: "ARS",
  logoUrl: "https://media.api-sports.io/football/teams/42.png",
  foundedYear: 1886,
  leagueName: "Premier League",
  venue: "Emirates Stadium (London, 60.704 chỗ)",
  form: ["W", "W", "W", "W", "W"],
  stats: {
    matchesPlayed: 27,
    wins: 20,
    draws: 4,
    losses: 3,
    goalsFor: 62,
    goalsAgainst: 23,
    eloRating: 1980,
    cleanSheets: 12,
    avgGoalsScored: 2.3,
    avgGoalsConceded: 0.85,
  },
  players: [
    { id: "p-1", fullName: "Bukayo Saka", position: "Attacker", nationality: "England", number: 7 },
    { id: "p-2", fullName: "Martin Ødegaard", position: "Midfielder", nationality: "Norway", number: 8 },
    { id: "p-3", fullName: "Declan Rice", position: "Midfielder", nationality: "England", number: 41 },
    { id: "p-4", fullName: "William Saliba", position: "Defender", nationality: "France", number: 2 },
    { id: "p-5", fullName: "David Raya", position: "Goalkeeper", nationality: "Spain", number: 22 },
  ],
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = String(params?.id || "");

  const { data: teamData, isLoading } = useTeamDetail(teamId);
  const { data: statsData } = useTeamStats(teamId);

  const team = teamData || mockTeam;
  const stats = statsData || team.stats;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="h-64 animate-pulse rounded-md border" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
        <button type="button" onClick={() => router.back()} className="hover:text-white transition-colors">
          ← Quay lại
        </button>
        <span>/</span>
        <span>Đội bóng</span>
        <span>/</span>
        <span className="text-white font-medium">{team.name}</span>
      </div>

      {/* Team Header Banner */}
      <div
        className="mb-8 rounded-md border p-6 sm:p-8"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-md border p-3" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-white">{team.name.slice(0, 2)}</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{team.name}</h1>
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  {team.leagueName} • Thành lập năm {team.foundedYear || "---"}
                </p>
              </div>

              <div className="self-center sm:self-auto">
                <TeamFormBadge form={team.form} showLabel={true} />
              </div>
            </div>

            {team.venue && (
              <div className="mt-4 text-xs" style={{ color: colors.textFaint }}>
                🏟️ Sân nhà: <strong className="text-gray-300 font-medium">{team.venue}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-md border p-4 text-center" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.eloRating ?? 1500}</div>
            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Điểm số Elo</div>
          </div>
          <div className="rounded-md border p-4 text-center" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
            <div className="text-2xl font-bold text-white font-mono">{stats.wins}/{stats.matchesPlayed}</div>
            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Trận thắng/Tổng</div>
          </div>
          <div className="rounded-md border p-4 text-center" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
            <div className="text-2xl font-bold text-white font-mono">+{stats.goalsFor - stats.goalsAgainst}</div>
            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Hiệu số bàn thắng</div>
          </div>
          <div className="rounded-md border p-4 text-center" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.cleanSheets ?? 0}</div>
            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>Trận giữ sạch lưới</div>
          </div>
        </div>
      )}

      {/* Players Squad List */}
      {team.players && team.players.length > 0 && (
        <div className="rounded-md border p-6" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
            Danh sách cầu thủ tiêu biểu
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {team.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-sm border p-3 text-xs"
                style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-400 w-6">#{p.number ?? "-"}</span>
                  <div>
                    <div className="font-semibold text-white">{p.fullName}</div>
                    <div className="text-[11px]" style={{ color: colors.textMuted }}>{p.nationality}</div>
                  </div>
                </div>
                <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.border, color: colors.textMuted }}>
                  {p.position}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
