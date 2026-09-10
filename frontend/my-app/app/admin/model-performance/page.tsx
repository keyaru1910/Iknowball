"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, BarChart3, Activity, Layers } from "lucide-react";
import {
  getAdminModelPerformance,
  AdminModelPerformanceItem,
} from "../../lib/api/endpoints/admin";

export default function AdminModelPerformancePage() {
  const [metrics, setMetrics] = useState<AdminModelPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await getAdminModelPerformance();
        setMetrics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-purple-400" />
          Hiệu Năng & Độ Chính Xác Mô Hình AI
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Báo cáo thống kê độ chuẩn xác, Brier Score, Log Loss và F1-Score theo từng chu kỳ đánh giá.
        </p>
      </div>

      {/* Metrics Table */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Phiên Bản Mô Hình</th>
                <th className="py-3.5 px-4">Giải Đấu</th>
                <th className="py-3.5 px-4">Accuracy</th>
                <th className="py-3.5 px-4">F1 Score</th>
                <th className="py-3.5 px-4">Log Loss</th>
                <th className="py-3.5 px-4">Brier Score</th>
                <th className="py-3.5 px-4">Cỡ Mẫu</th>
                <th className="py-3.5 px-4">Chu Kỳ Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    Đang tải số liệu hiệu năng...
                  </td>
                </tr>
              ) : metrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    Chưa có báo cáo hiệu năng mô hình
                  </td>
                </tr>
              ) : (
                metrics.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                      {m.modelVersion}
                    </td>
                    <td className="py-3.5 px-4 text-white">
                      {m.league?.name || "Toàn Bộ Giải"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {(m.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {(m.f1 * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-300">
                      {m.avgLogLoss.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-neutral-300">
                      {m.avgBrierScore.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {m.sampleSize} trận
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                      {new Date(m.periodStart).toLocaleDateString("vi-VN")} - {new Date(m.periodEnd).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
