"use client";

import React, { useState } from "react";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

export default function BrierScorePage() {
  // Trạng thái cho công cụ tính Brier Score tương tác
  const [probHome, setProbHome] = useState(0.60);
  const [probDraw, setProbDraw] = useState(0.25);
  const [probAway, setProbAway] = useState(0.15);
  const [actualOutcome, setActualOutcome] = useState<"home" | "draw" | "away">("home");

  // Tính Brier Score cho 3 kết quả (Home / Draw / Away): BS = (pH - oH)^2 + (pD - oD)^2 + (pA - oA)^2
  const oHome = actualOutcome === "home" ? 1 : 0;
  const oDraw = actualOutcome === "draw" ? 1 : 0;
  const oAway = actualOutcome === "away" ? 1 : 0;

  const currentBrierScore = (
    Math.pow(probHome - oHome, 2) +
    Math.pow(probDraw - oDraw, 2) +
    Math.pow(probAway - oAway, 2)
  ).toFixed(4);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          📐 Phương pháp Đánh giá Mô hình Xác suất
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Brier Score Là Gì? Thước Đo Độ Chính Xác Của AI iKnowBall
        </h1>
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: colors.textMuted }}>
          Trong khoa học dữ liệu và dự đoán thể thao xác suất, tỷ lệ đoán trúng (Accuracy) không phản ánh được mức độ tự tin của mô hình. 
          <strong> Brier Score</strong> chính là thước đo vàng để đánh giá mức độ tin cậy (Calibration) của các thuật toán AI.
        </p>
      </div>

      {/* Tóm tắt nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-sm font-semibold text-emerald-400 mb-1">0.0 — Điểm Hoàn Hảo</div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Mô hình dự đoán chính xác 100% kết quả xảy ra với độ tin cậy tuyệt đối (gán xác suất 1.0 cho đúng biến cố).
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-sm font-semibold text-amber-400 mb-1">0.667 — Mức Chuẩn Ngẫu Nhiên</div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Nếu mô hình luôn dự đoán 33.3% cho Thắng, Hòa, Thua mà không có bất kỳ kiến thức phân tích nào.
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-sm font-semibold text-rose-400 mb-1">2.0 — Điểm Tệ Nhất</div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Mô hình hoàn toàn tự tin 100% vào một kết quả nhưng thực tế lại xảy ra kết quả khác.
          </p>
        </div>
      </div>

      {/* Công thức toán học */}
      <div
        className="p-6 sm:p-8 rounded-2xl border space-y-4"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Formula</span>
          <span className="text-sm font-normal text-neutral-400">Công thức toán học của Glenn W. Brier (1950)</span>
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
          Đối với dự đoán trận đấu bóng đá có 3 khả năng (Chủ nhà thắng, Hòa, Đội khách thắng):
        </p>

        <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-center text-emerald-300 text-sm sm:text-base">
          BS = (p<sub>Home</sub> - o<sub>Home</sub>)² + (p<sub>Draw</sub> - o<sub>Draw</sub>)² + (p<sub>Away</sub> - o<sub>Away</sub>)²
        </div>

        <div className="text-xs space-y-1.5 text-neutral-400">
          <p>• <strong>p<sub>k</sub></strong>: Xác suất mà mô hình AI dự báo cho biến cố k (Ví dụ: 0.65).</p>
          <p>• <strong>o<sub>k</sub></strong>: Kết quả thực tế (bằng 1 nếu kết quả đó xảy ra, bằng 0 nếu không xảy ra).</p>
          <p>• <strong>Nguyên tắc:</strong> Điểm Brier Score <strong>CÀNG THẤP CÀNG TỐT</strong> (Tương tự sai số Mean Squared Error).</p>
        </div>
      </div>

      {/* Công cụ tương tác trực quan */}
      <div
        className="p-6 sm:p-8 rounded-2xl border space-y-6"
        style={{ borderColor: colors.border, backgroundColor: colors.panelAlt }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">🧪 Trải Nghiệm Thử Tính Brier Score</h2>
          <p className="text-xs mt-1 text-neutral-400">
            Điều chỉnh xác suất phân phối của AI và chọn kết quả trận đấu để xem điểm phạt sai số.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Xác suất Chủ nhà (Home): {(probHome * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={probHome}
              onChange={(e) => setProbHome(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Xác suất Hòa (Draw): {(probDraw * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={probDraw}
              onChange={(e) => setProbDraw(parseFloat(e.target.value))}
              className="w-full accent-blue-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Xác suất Khách (Away): {(probAway * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={probAway}
              onChange={(e) => setProbAway(parseFloat(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Chọn kết quả thực tế */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-neutral-300">Kết quả thực tế trận đấu:</span>
          <div className="flex gap-3">
            {(["home", "draw", "away"] as const).map((outcome) => (
              <button
                key={outcome}
                onClick={() => setActualOutcome(outcome)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  actualOutcome === outcome
                    ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                    : "bg-white/5 text-neutral-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {outcome === "home" ? "Chủ nhà Thắng" : outcome === "draw" ? "Hòa" : "Khách Thắng"}
              </button>
            ))}
          </div>
        </div>

        {/* Kết quả hiển thị */}
        <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-400">Brier Score cho trận này:</span>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
              {currentBrierScore}
            </div>
          </div>
          <div className="text-xs text-neutral-400 max-w-sm sm:text-right">
            {parseFloat(currentBrierScore) < 0.3
              ? "🌟 Dự đoán xuất sắc: Xác suất khớp cao với biến cố thực tế!"
              : parseFloat(currentBrierScore) < 0.667
              ? "👍 Dự đoán tốt: Tốt hơn đáng kể so với việc gieo xúc xắc ngẫu nhiên."
              : "⚠️ Sai số lớn: Mô hình gán xác suất cao cho biến cố không xảy ra."}
          </div>
        </div>
      </div>

      {/* So sánh với Accuracy */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Tại Sao iKnowBall Ưu Tiên Brier Score Hơn Tỷ Lệ Accuracy?</h2>
        <div className="text-sm leading-relaxed space-y-3" style={{ color: colors.textMuted }}>
          <p>
            Giả sử 2 chuyên gia cùng đoán đúng Arsenal thắng:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-300">
            <li><strong>Chuyên gia A:</strong> Đưa ra xác suất Arsenal thắng là <strong>90%</strong>.</li>
            <li><strong>Chuyên gia B:</strong> Đưa ra xác suất Arsenal thắng là <strong>40%</strong> (và Hòa 35%, Thua 25%).</li>
          </ul>
          <p>
            Nếu dùng thang đo tỷ lệ thắng (Accuracy), cả hai đều được chấm 1 điểm đúng như nhau. Tuy nhiên, rõ ràng Chuyên gia A có độ tự tin và dự báo thuyết phục hơn rất nhiều.
            Brier Score thưởng điểm cao cho Chuyên gia A (BS thấp) và phạt Chuyên gia B vì sự thiếu chắc chắn.
          </p>
        </div>
      </div>

      {/* CTA Links */}
      <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
        <Link
          href="/log-loss"
          className="text-sm font-medium text-emerald-400 hover:underline flex items-center gap-1.5"
        >
          <span>Tìm hiểu tiếp: Thuật toán Log Loss (Cross-Entropy)</span>
          <span>→</span>
        </Link>
        <Link
          href="/predictions/performance"
          className="text-sm font-medium text-neutral-300 hover:text-white"
        >
          Xem biểu đồ hiệu năng AI thực tế →
        </Link>
      </div>
    </div>
  );
}
