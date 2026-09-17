"use client";

import React from "react";
import VipApiKeyManager from "../../components/VipApiKeyManager";
import PredictionDisclaimer from "../../components/PredictionDisclaimer";
import { colors } from "../../lib/design-tokens";

export default function DeveloperApiPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            👑 VIP Developer Access
          </span>
          <span className="text-xs font-mono" style={{ color: colors.textFaint }}>
            REST API v1
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          iKnowBall Developer API & Tích Hợp
        </h1>
        <p className="mt-2 text-sm max-w-3xl leading-relaxed" style={{ color: colors.textMuted }}>
          Dành riêng cho hội viên <strong>VIP Insights</strong>: Tự động hóa lấy dữ liệu dự đoán thể thao, xác suất phân tích Machine Learning và lịch sử Elo rating qua REST API tốc độ cao.
        </p>
      </div>

      {/* API Key Manager Card */}
      <div className="mb-8">
        <VipApiKeyManager />
      </div>

      {/* API Documentation Preview */}
      <div
        className="rounded-2xl border p-6 mb-8"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <span>📚</span>
          <span>Tài liệu các Endpoint chính</span>
        </h3>

        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                GET
              </span>
              <code className="font-mono text-xs text-white">/api/v1/predictions</code>
            </div>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Lấy danh sách các trận đấu kèm xác suất dự đoán (Home / Draw / Away win rate). Hỗ trợ lọc theo <code>date</code>, <code>league</code>, <code>page</code>, <code>limit</code>.
            </p>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                GET
              </span>
              <code className="font-mono text-xs text-white">/api/v1/predictions/:matchId/vip-report</code>
            </div>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Lấy toàn văn báo cáo nhận định AI chuyên sâu (Gemini Flash & Heuristic) gồm phân tích chiến thuật, điểm nóng và dự báo tỷ số.
            </p>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                GET
              </span>
              <code className="font-mono text-xs text-white">/api/v1/predictions/export</code>
            </div>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Tải xuống toàn bộ tập dữ liệu dự đoán ra file CSV chuẩn UTF-8 để phân tích bằng Python / Pandas / Excel.
            </p>
          </div>
        </div>
      </div>

      <PredictionDisclaimer variant="banner" />
    </div>
  );
}
