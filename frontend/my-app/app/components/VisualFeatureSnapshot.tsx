"use client";

import React from "react";
import Link from "next/link";
import { colors } from "../lib/design-tokens";

interface VisualFeatureSnapshotProps {
  featuresSnapshot?: any;
  explanation?: any;
  homeTeamName: string;
  awayTeamName: string;
  isLocked?: boolean;
}

export default function VisualFeatureSnapshot({
  featuresSnapshot,
  explanation,
  homeTeamName,
  awayTeamName,
  isLocked = false,
}: VisualFeatureSnapshotProps) {
  // Extract or default values
  const eloDiff = explanation?.eloDiff ?? ((featuresSnapshot?.homeElo ?? 1500) - (featuresSnapshot?.awayElo ?? 1500));
  const homeAdvantage = explanation?.homeAdvantage ?? 65.0;
  const formAdjustment = explanation?.formAdjustment ?? 18.5;
  const h2hMatches = explanation?.h2hMatchesConsidered ?? featuresSnapshot?.h2hMatches ?? 6;
  const dominantFactor = explanation?.dominantFactor || "elo_difference";

  // Calculate relative weight / impact percentage for visual bars
  const totalWeight = Math.abs(eloDiff) + Math.abs(homeAdvantage) + Math.abs(formAdjustment) + (h2hMatches * 10) || 100;
  const eloPct = Math.min(100, Math.max(15, Math.round((Math.abs(eloDiff) / totalWeight) * 100)));
  const homePct = Math.min(100, Math.max(10, Math.round((homeAdvantage / totalWeight) * 100)));
  const formPct = Math.min(100, Math.max(10, Math.round((Math.abs(formAdjustment) / totalWeight) * 100)));
  const h2hPct = Math.min(100, Math.max(10, Math.round(((h2hMatches * 10) / totalWeight) * 100)));

  // Extract Gemini AI enhancements
  const aiConfidence = explanation?.aiConfidence ?? 78;
  const keyFactors: string[] = explanation?.keyFactors ?? [
    `Chênh lệch Elo (${explanation?.eloDiff > 0 ? `+${explanation?.eloDiff}` : (explanation?.eloDiff || 0)}) định hình nền tảng thực lực.`,
    `Lợi thế sân bãi tiếp thêm sức ép cho ${homeTeamName}.`,
    `Phong độ thi đấu 5 trận gần nhất là chỉ số phản ánh trạng thái thực tế.`,
  ];
  const tacticalSummary: string = explanation?.tacticalSummary ?? "";
  const isHybridEngine = explanation?.engine === "gemini-hybrid-v1" || explanation?.modelVersion?.includes("gemini");

  return (
    <div
      className="rounded-xl border p-5 sm:p-6 relative overflow-hidden"
      style={{ borderColor: colors.border, backgroundColor: colors.panel }}
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🧠 Phân Tích Mô Hình Gemini Hybrid AI</span>
            </h3>
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 px-2 py-0.5 text-[11px] font-semibold text-blue-300">
              ✨ Gemini 24-48h
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            Mô hình lai kết hợp công thức toán học định lượng (Elo + Poisson) và trí tuệ nhân tạo Gemini hiệu chuẩn
          </p>
        </div>

        {/* AI Confidence & Dominant factor badge */}
        {!isLocked && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold">
              <span>🎯 Độ tự tin AI:</span>
              <span className="font-bold font-mono text-cyan-300">{aiConfidence}%</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
              <span>✨ Nhân tố chính:</span>
              <span className="font-bold">
                {dominantFactor === "elo_difference" && "Chênh lệch Elo"}
                {dominantFactor === "recent_form" && "Phong độ 5 trận"}
                {dominantFactor === "home_advantage" && "Lợi thế sân nhà"}
                {!["elo_difference", "recent_form", "home_advantage"].includes(dominantFactor) && "Đa yếu tố"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Gemini AI Key Factors Section */}
      {!isLocked && (
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-950/20 p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <span>⚡</span>
              <span>3 Điểm Nhấn Then Chốt Trận Đấu (Key Match Drivers)</span>
            </div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">24h-48h Outlook</span>
          </div>
          <ul className="space-y-2 text-xs text-neutral-200">
            {keyFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold font-mono">0{idx + 1}.</span>
                <span className="leading-relaxed">{factor}</span>
              </li>
            ))}
          </ul>
          {tacticalSummary && (
            <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-neutral-300 italic flex items-center gap-1.5">
              <span className="text-amber-400 not-italic font-bold">💡 Nhận định chiến thuật:</span>
              <span>"{tacticalSummary}"</span>
            </div>
          )}
        </div>
      )}


      {/* Breakdown Bars */}
      <div className={`flex flex-col gap-4 ${isLocked ? "filter blur-sm select-none pointer-events-none opacity-40" : ""}`}>
        {/* Factor 1: Elo Difference */}
        <div
          className="rounded-xl border p-4 transition-all"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <span className="font-semibold text-white">Chênh lệch Elo thực lực (Elo Difference)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {eloDiff > 0 ? `+${eloDiff}` : eloDiff} Elo
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-neutral-300">
                {eloPct}% tác động
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-700"
              style={{ width: `${eloPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>
            {eloDiff > 0
              ? `${homeTeamName} có trình độ Elo cơ bản vượt trội so với ${awayTeamName}.`
              : `${awayTeamName} được đánh giá có chỉ số thực lực cao hơn ${homeTeamName}.`}
          </p>
        </div>

        {/* Factor 2: Form Adjustment */}
        <div
          className="rounded-xl border p-4 transition-all"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔥</span>
              <span className="font-semibold text-white">Hiệu chỉnh phong độ gần nhất (Form Modifier)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-400 text-sm">
                {formAdjustment > 0 ? `+${formAdjustment}` : formAdjustment} Elo
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-neutral-300">
                {formPct}% tác động
              </span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-700"
              style={{ width: `${formPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>
            Tính toán theo chuỗi kết quả 5 trận gần đây, phản ánh đúng nhịp phong độ thực tế trước giờ bóng lăn.
          </p>
        </div>

        {/* Factor 3: Home Advantage */}
        <div
          className="rounded-xl border p-4 transition-all"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">🏟️</span>
              <span className="font-semibold text-white">Lợi thế sân nhà (Home Advantage)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-cyan-400 text-sm">+{homeAdvantage} Elo</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-neutral-300">
                {homePct}% tác động
              </span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all duration-700"
              style={{ width: `${homePct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>
            Ưu thế khán giả và mặt sân quen thuộc cộng thêm cho {homeTeamName}.
          </p>
        </div>

        {/* Factor 4: H2H History */}
        <div
          className="rounded-xl border p-4 transition-all"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚔️</span>
              <span className="font-semibold text-white">Lịch sử đối đầu trực tiếp (H2H Considered)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-purple-400 text-sm">{h2hMatches} trận</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-neutral-300">
                {h2hPct}% tác động
              </span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400 shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all duration-700"
              style={{ width: `${h2hPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>
            Dữ liệu chạm trán giữa hai câu lạc bộ để giải thuật hiệu chuẩn tỷ lệ hòa và bất ngờ.
          </p>
        </div>
      </div>

      {/* Lock Overlay for Free / Guest */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <div
            className="rounded-2xl border p-6 sm:p-8 max-w-md shadow-2xl backdrop-blur-xl border-emerald-500/30"
            style={{ backgroundColor: "rgba(11, 14, 19, 0.9)" }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-2xl mb-3">
              ⚡
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Mở Khóa Biểu Đồ Phân Rã Yếu Tố AI
            </h4>
            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              Nâng cấp gói PRO Analyst để xem trực quan tỷ lệ phần trăm đóng góp của từng chỉ số vào kết quả dự đoán của AI.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-lg hover:scale-105"
              style={{ backgroundColor: colors.accent, color: colors.bg }}
            >
              <span>⚡ Mở khóa Phân rã AI với gói PRO</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
