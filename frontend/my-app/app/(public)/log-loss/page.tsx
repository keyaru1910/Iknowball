"use client";

import React from "react";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

export default function LogLossPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          ⚙️ Thuật Toán Tối Ưu Hóa & Hàm Mất Mát (Loss Function)
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Thuật Toán Log Loss (Cross-Entropy) Trong Dự Đoán Bóng Đá
        </h1>
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: colors.textMuted }}>
          <strong>Logarithmic Loss (Log Loss)</strong> là hàm mục tiêu cốt lõi mà iKnowBall sử dụng để huấn luyện mô hình Machine Learning. 
          Nó đo lường mức độ sai lệch giữa phân phối xác suất dự đoán và kết quả thực tế, với cơ chế phạt cực nặng các dự đoán <em>"quá tự tin nhưng lại sai"</em>.
        </p>
      </div>

      {/* 3 Nguyên lý then chốt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-sm font-semibold text-emerald-400 mb-1">🎯 Đánh giá phân phối đầy đủ</div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Không chỉ chọn ra đội có tỷ lệ thắng cao nhất, Log Loss kiểm định toàn bộ xác suất của cả 3 cửa (Thắng, Hòa, Thua).
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-sm font-semibold text-rose-400 mb-1">⚡ Phạt nặng sự ảo tưởng</div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Nếu mô hình đưa ra xác suất 99% cho Real Madrid thắng nhưng trận đấu kết thúc Hòa, điểm phạt Log Loss sẽ tiến tới vô cùng lớn.
          </p>
        </div>

        <div
          className="p-5 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-sm font-semibold text-purple-400 mb-1">🔄 Tối ưu Gradient Descent</div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Đạo hàm của Log Loss mượt mà, giúp các thuật toán LightGBM & Neural Networks hội tụ nhanh về trạng thái tối ưu toàn cục.
          </p>
        </div>
      </div>

      {/* Công thức toán học */}
      <div
        className="p-6 sm:p-8 rounded-2xl border space-y-4"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Hàm Mất Mát Đa Lớp (Multi-class Log Loss)</span>
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
          Với mỗi trận đấu $i$ có $C = 3$ kết quả khả dĩ (Home, Draw, Away):
        </p>

        <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-center text-purple-300 text-sm sm:text-base">
          Log Loss = - [ y<sub>Home</sub> · ln(p<sub>Home</sub>) + y<sub>Draw</sub> · ln(p<sub>Draw</sub>) + y<sub>Away</sub> · ln(p<sub>Away</sub>) ]
        </div>

        <div className="text-xs space-y-2 text-neutral-400">
          <p>• <strong>y<sub>k</sub> ∈ &#123;0, 1&#125;</strong>: Nhãn nhị phân (bằng 1 nếu kết quả $k$ diễn ra, bằng 0 nếu không).</p>
          <p>• <strong>p<sub>k</sub></strong>: Xác suất dự báo của AI cho kết quả $k$ (nằm trong khoảng từ 0 đến 1).</p>
          <p>• <strong>ln(p)</strong>: Logarit tự nhiên. Khi $p \to 1$, $\ln(p) \to 0$ (mất mát bằng 0). Khi $p \to 0$, $\ln(p) \to -\infty$ (mất mát vô cực).</p>
        </div>
      </div>

      {/* Bảng so sánh Log Loss vs Brier Score */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">So Sánh Giữa Log Loss & Brier Score</h2>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b bg-white/5 text-neutral-300" style={{ borderColor: colors.borderSoft }}>
                <tr>
                  <th className="p-4 font-semibold">Đặc điểm</th>
                  <th className="p-4 font-semibold text-purple-400">Log Loss (Cross-Entropy)</th>
                  <th className="p-4 font-semibold text-emerald-400">Brier Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-300">
                <tr>
                  <td className="p-4 font-medium text-white">Bản chất toán học</td>
                  <td className="p-4">Dựa trên hàm Logarit (Information Theory)</td>
                  <td className="p-4">Dựa trên bình phương khoảng cách (Mean Squared Error)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Mức độ phạt sai sót</td>
                  <td className="p-4 text-rose-300">Cực kỳ nghiêm khắc với xác suất sai gần 0 hoặc 1</td>
                  <td className="p-4 text-neutral-400">Phạt bậc 2 tuyến tính hơn, có chặn cận trên</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Ứng dụng chính</td>
                  <td className="p-4">Huấn luyện mô hình (Training Loss) trong ML</td>
                  <td className="p-4">Đo lường & Báo cáo hiệu năng trực quan cho người dùng</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Giá trị lý tưởng</td>
                  <td className="p-4 font-mono text-purple-300">0.0 (Càng thấp càng tốt)</td>
                  <td className="p-4 font-mono text-emerald-300">0.0 (Càng thấp càng tốt)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ứng dụng trong iKnowBall Pipeline */}
      <div
        className="p-6 sm:p-8 rounded-2xl border space-y-4"
        style={{ borderColor: colors.border, backgroundColor: colors.panelAlt }}
      >
        <h2 className="text-xl font-bold text-white">iKnowBall Áp Dụng Log Loss Như Thế Nào?</h2>
        <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-neutral-300">
          <p>
            1. <strong>Tự động cân chỉnh (Probability Calibration):</strong> Sau khi tính toán các chỉ số xG và Elo, mô hình áp dụng kỹ thuật <em>Platt Scaling</em> hoặc <em>Isotonic Regression</em> kết hợp Log Loss để đảm bảo rằng khi hệ thống dự đoán xác suất 70%, thì đúng 70 trận trong số 100 trận thực sự diễn ra kết quả đó.
          </p>
          <p>
            2. <strong>Tránh bẫy Overfitting:</strong> Log Loss kết hợp L2 Regularization ngăn ngừa việc mô hình đưa ra các con số dự đoán cực đoan (như 99% hay 1%) trong một môn thể thao có tính biến động và bất ngờ cao như bóng đá.
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
        <Link
          href="/brier-score"
          className="text-sm font-medium text-emerald-400 hover:underline flex items-center gap-1.5"
        >
          <span>← Xem lại: Brier Score là gì?</span>
        </Link>
        <Link
          href="/predictions"
          className="text-sm font-medium text-neutral-300 hover:text-white"
        >
          Xem các dự đoán bóng đá hôm nay →
        </Link>
      </div>
    </div>
  );
}
