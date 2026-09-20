"use client";

import React, { useState } from "react";
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
  const { data: report, isLoading, isError, refetch } = useVipReport(matchId);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setIsChatLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`http://localhost:8000/api/v1/predictions/${matchId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMsg }),
      });
      const json = await res.json();
      const reply = json.data?.reply || "Chưa thể phân tích câu trả lời vào lúc này.";
      setChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Lỗi kết nối tới Trợ lý AI. Vui lòng thử lại sau." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      await fetch(`http://localhost:8000/api/v1/predictions/${matchId}/vip-report/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      await refetch();
    } catch {
      // ignore
    } finally {
      setIsRegenerating(false);
    }
  };

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
  const scoreDetails = (report as any).scoreDetails;
  const isBasketball = scoreDetails?.projectedSpread !== undefined || scoreDetails?.projectedTotalPoints !== undefined;

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
                {report.generatedBy === "GEMINI_FLASH" ? "Gemini 2.0 Flash AI" : "Heuristic AI"}
              </span>
              {report.userTier === "admin" && (
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 border border-white/15 transition-all"
                  title="Tái tạo phân tích AI với dữ liệu mới nhất"
                >
                  {isRegenerating ? "Đang tạo..." : "🔄 Tái tạo AI"}
                </button>
              )}
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {report.headline || `${homeTeamName} vs ${awayTeamName}`}
            </h3>
          </div>
        </div>

        {/* Confidence & Score Preview */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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

        {/* Section: Quantitative Deep Metrics (Poisson for Football, Spread/O-U for Basketball) */}
        {scoreDetails && !isLocked && (
          <div
            className="rounded-xl border p-4.5"
            style={{ borderColor: "rgba(56, 189, 248, 0.25)", backgroundColor: "rgba(15, 23, 42, 0.6)" }}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5">
              <span>📊</span>
              <span>{isBasketball ? "Chỉ số Định lượng Bóng rổ (Point Spread & Total Points)" : "Chỉ số Định lượng Bóng đá (Poisson Model & Kèo Phụ)"}</span>
            </div>

            {isBasketball ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-neutral-400 text-[10px] mb-1">Dự đoán Điểm số</div>
                  <div className="font-bold text-white font-mono text-sm">{scoreDetails.projectedHomePoints} - {scoreDetails.projectedAwayPoints}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-neutral-400 text-[10px] mb-1">Kèo Chấp Điểm (Spread)</div>
                  <div className="font-bold text-amber-400 font-mono text-sm">{scoreDetails.projectedSpread > 0 ? `+${scoreDetails.projectedSpread}` : scoreDetails.projectedSpread}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-neutral-400 text-[10px] mb-1">Tổng điểm kỳ vọng (O/U)</div>
                  <div className="font-bold text-emerald-400 font-mono text-sm">{scoreDetails.projectedTotalPoints} pts</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-neutral-400 text-[10px] mb-1">Thể lực Back-to-Back</div>
                  <div className="font-semibold text-neutral-200 text-xs">
                    {scoreDetails.b2bFactors?.homeIsBackToBack ? "⚠️ Chủ nhà B2B" : (scoreDetails.b2bFactors?.awayIsBackToBack ? "⚠️ Khách B2B" : "✅ Thể lực tốt")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {scoreDetails.topLikelyScores && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-neutral-400 text-[10px] mb-1.5">Top 3 Tỷ số Poisson</div>
                    <div className="flex gap-2">
                      {scoreDetails.topLikelyScores.map((s: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-xs border border-sky-500/30">
                          {s.score} ({Math.round(s.probability * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {scoreDetails.overUnder25 && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-neutral-400 text-[10px] mb-1.5">Tài / Xỉu 2.5 Bàn</div>
                    <div className="font-mono text-xs flex gap-2">
                      <span className="text-emerald-400 font-bold">Tài: {Math.round(scoreDetails.overUnder25.overProb * 100)}%</span>
                      <span className="text-neutral-400">|</span>
                      <span className="text-amber-400 font-bold">Xỉu: {Math.round(scoreDetails.overUnder25.underProb * 100)}%</span>
                    </div>
                  </div>
                )}
                {scoreDetails.bothTeamsToScore && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-neutral-400 text-[10px] mb-1.5">Cả hai đội ghi bàn (BTTS)</div>
                    <div className="font-mono text-xs flex gap-2">
                      <span className="text-emerald-400 font-bold">Có: {Math.round(scoreDetails.bothTeamsToScore.yesProb * 100)}%</span>
                      <span className="text-neutral-400">|</span>
                      <span className="text-neutral-400">Không: {Math.round(scoreDetails.bothTeamsToScore.noProb * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
                <span>{isBasketball ? "Phân tích chiến thuật & Nhịp độ trận đấu (Pace & Matchup):" : "Phân tích chiến thuật & Khắc chế lối chơi:"}</span>
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

          {/* Section: Match AI Interactive Chat Assistant */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "rgba(168, 85, 247, 0.3)", backgroundColor: "rgba(88, 28, 135, 0.1)" }}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-2">
              <span>🤖</span>
              <span>Hỏi Đáp Chuyên Sâu với Trợ Lý AI iKnowBall:</span>
            </div>

            {chatMessages.length > 0 && (
              <div className="flex flex-col gap-2.5 mb-3 max-h-60 overflow-y-auto pr-1">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-amber-500/20 text-white self-end max-w-[85%] border border-amber-500/30"
                        : "bg-white/5 text-neutral-200 self-start max-w-[90%] border border-white/10"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Đặt câu hỏi cho AI về trận đấu (VD: Phân tích khả năng nổ tài hiệp 1, phong độ chủ lực...)"
                className="flex-1 rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isChatLoading ? "..." : "Gửi"}
              </button>
            </form>
          </div>
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
