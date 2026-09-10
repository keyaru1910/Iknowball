"use client";

import React from "react";
import { colors } from "../lib/design-tokens";

interface PredictionDisclaimerProps {
  className?: string;
  variant?: "banner" | "compact" | "card";
}

/**
 * Component hiển thị disclaimer cố định trên toàn bộ màn hình / component dự đoán
 * Tuân thủ quy định: Khẳng định phân tích xác suất dựa trên mô hình toán học/AI, không phải lời khuyên cá cược.
 */
export default function PredictionDisclaimer({
  className = "",
  variant = "banner",
}: PredictionDisclaimerProps) {
  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[11px] ${className}`}
        style={{
          borderColor: colors.borderSoft,
          backgroundColor: `${colors.panelAlt}B3`,
          color: colors.textMuted,
        }}
      >
        <span className="text-amber-400 text-xs">⚠️</span>
        <span>
          <strong>Lưu ý:</strong> Dữ liệu dự báo mang tính chất phân tích xác suất thống kê, không phải khuyến nghị cá cược tài chính.
        </span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`rounded-md border p-4 text-xs ${className}`}
        style={{
          borderColor: colors.border,
          backgroundColor: `${colors.panelAlt}80`,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-semibold text-xs">
          <span>⚖️</span>
          <span>Tuyên bố miễn trừ trách nhiệm (Disclaimer)</span>
        </div>
        <p className="leading-relaxed" style={{ color: colors.textMuted }}>
          Tất cả xác suất và chỉ số dự báo trên hệ thống <strong>iKnowBall</strong> được tạo tự động bởi các thuật toán thống kê (Elo, Machine Learning) dựa trên dữ liệu lịch sử. Kết quả chỉ mang tính tham khảo và nghiên cứu, tuyệt đối <strong>không phải là lời khuyên hay cam kết cá cược</strong>.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-md border p-3.5 sm:p-4 text-xs ${className}`}
      style={{
        borderColor: `${colors.accent}33`,
        backgroundColor: `${colors.panelAlt}E6`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="text-base leading-none">🧠</span>
          <div>
            <div className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
              <span>Phân tích định lượng & Xác suất AI</span>
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
              >
                iKnowBall Engine
              </span>
            </div>
            <p className="mt-1 text-[11px] sm:text-xs leading-relaxed" style={{ color: colors.textMuted }}>
              Xác suất trận đấu được tính toán theo dữ liệu thực tế và mô hình xác suất toán học. Không xem đây là lời khuyên cá độ hoặc đảm bảo kết quả chính xác 100%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
