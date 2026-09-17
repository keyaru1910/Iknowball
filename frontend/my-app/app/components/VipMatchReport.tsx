"use client";

import React from "react";
import Link from "next/link";
import { useVipReport } from "../hooks/useVipReport";
import { colors } from "../lib/design-tokens";

interface VipMatchReportProps {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  isVipUser?: boolean;
}

export default function VipMatchReport({
  matchId,
  homeTeamName,
  awayTeamName,
  isVipUser = false,
}: VipMatchReportProps) {
  const { data: report, isLoading, isError } = useVipReport(matchId);

  if (isLoading) {
    return (
      <div
        className="rounded-2xl border p-6 animate-pulse"
        style={{
          borderColor: "rgba(245, 158, 11, 0.3)",
          backgroundColor: colors.panel,
        }}
      >
        <div className="h-6 w-1/3 bg-amber-500/20 rounded-lg mb-4" />
        <div className="h-20 bg-white/5 rounded-xl mb-4" />
        <div className="h-32 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div
        className="rounded-2xl border p-6 text-center"
        style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
      >
        <p className="text-xs" style={{ color: colors.textMuted }}>
          Chưa thể tải báo cáo nhận định AI VIP cho trận đấu này. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  const isLocked = report.isLocked && !isVipUser;

  return (
    <div
      className="rounded-2xl border relative overflow-hidden transition-all shadow-xl"
      style={{
        borderColor: "rgba(245, 158, 11, 0.35)",
        background: "linear-gradient(180deg, rgba(245, 158, 11, 0.06) 0%, rgba(18, 22, 29, 0.95) 100%)",
        boxShadow: "0 0 30px rgba(245, 158, 11, 0.08)",
      }}
    >
      {/* Header Banner */}
      <div
        className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          borderColor: "rgba(245, 158, 11, 0.2)",
          backgroundColor: "rgba(245, 158, 11, 0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-lg shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
                VIP Match Intelligence Report
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                {report.generatedBy === "GEMINI_FLASH" ? "Gemini Flash AI" : "Heuristic AI"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {report.headline || `${homeTeamName} vs ${awayTeamName}`}
            </h3>
          </div>
        </div>

        {/* Confidence & Score Preview */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {report.predictedScore && !isLocked && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              <span>🎯 Dự đoán:</span>
              <span className="text-sm text-white">{report.predictedScore}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <span>✨</span>
            <span>{report.confidence === "HIGH" ? "Độ tự tin: CAO" : (report.confidence || "Độ tự tin: TRUNG BÌNH")}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 flex flex-col gap-6">
        {/* Section 1: Executive Summary */}
        <div
          className="rounded-xl border p-4.5 text-xs sm:text-sm leading-relaxed"
          style={{
            borderColor: "rgba(245, 158, 11, 0.25)",
            backgroundColor: "rgba(22, 27, 35, 0.7)",
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <span>📌</span>
            <span>Tóm tắt cục diện & Nhận định tổng quan:</span>
          </div>
          <p className="text-neutral-200 leading-relaxed font-normal">
            {report.summary}
          </p>
        </div>

        {/* Section 2 & 3: Tactical Analysis & Key Battles (Blurred if Locked) */}
        <div className={`flex flex-col gap-5 ${isLocked ? "filter blur-md select-none pointer-events-none opacity-25" : ""}`}>
          {/* Tactical Breakdown */}
          {report.tacticalAnalysis && (
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-2">
                <span>⚔️</span>
                <span>Phân tích chiến thuật & Khắc chế lối chơi:</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                {report.tacticalAnalysis}
              </p>
            </div>
          )}

          {/* Key Battles */}
          {report.keyBattles && report.keyBattles.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <span>🔥</span>
                <span>Điểm nóng then chốt trên sân (Key Battles):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.keyBattles.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-4 transition-all hover:border-amber-500/30"
                    style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
                  >
                    <div className="font-semibold text-xs text-amber-300 mb-1.5 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{b.title}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {report.recommendation && (
            <div
              className="rounded-xl border p-4 flex items-start gap-3"
              style={{
                borderColor: "rgba(52, 211, 153, 0.3)",
                backgroundColor: "rgba(52, 211, 153, 0.05)",
              }}
            >
              <span className="text-base shrink-0">💡</span>
              <div className="text-xs leading-relaxed">
                <strong className="text-emerald-400">Góc nhìn phân tích định lượng: </strong>
                <span className="text-neutral-200">{report.recommendation}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lock Overlay for Non-VIP Users */}
      {isLocked && (
        <div className="absolute inset-0 top-24 flex flex-col items-center justify-center p-6 text-center z-10">
          <div
            className="rounded-2xl border p-6 sm:p-8 max-w-lg shadow-2xl backdrop-blur-2xl"
            style={{
              borderColor: "rgba(245, 158, 11, 0.4)",
              backgroundColor: "rgba(11, 14, 19, 0.92)",
              boxShadow: "0 0 40px rgba(245, 158, 11, 0.15)",
            }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-3xl mb-3 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              👑
            </div>
            <h4 className="text-lg font-bold text-white mb-2">
              Mở Khóa Báo Cáo Phân Tích AI VIP
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              {report.lockedMessage ||
                "Báo cáo nhận định chiến thuật AI chuyên sâu, phân tích điểm nóng đối đầu và dự đoán kịch bản tỷ số độc quyền chỉ dành cho thành viên VIP Insights."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold transition-all shadow-lg hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  color: "#0B0E13",
                  boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)",
                }}
              >
                <span>👑 Nâng cấp VIP Insights (499k/tháng)</span>
                <span>→</span>
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border px-4 py-3 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
              >
                Xem chi tiết quyền lợi
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
