"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { getAdminDashboardStats, DashboardStats } from "../lib/api/endpoints/admin";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await getAdminDashboardStats();
        setStats(res.data);
      } catch (err: any) {
        setError(err.message || "Không thể tải số liệu thống kê quản trị");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Bảng Điều Khiển Quản Trị
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Tổng quan hệ thống, người dùng, doanh thu Stripe và tình trạng hoạt động AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sync-logs"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Xem Nhật Ký Sync</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Tổng Người Dùng
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? "..." : stats?.users.total ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
            <span className="text-emerald-400 font-medium">{stats?.users.premium ?? 0} Pro/VIP</span>
            <span>•</span>
            <span className="text-rose-400">{stats?.users.banned ?? 0} Bị khóa</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Gói Đang Hoạt Động
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? "..." : stats?.billing.activeSubscriptions ?? 0}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400">
            <span>Stripe Active Customers</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Tổng Doanh Thu (USD)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? "..." : `$${(stats?.billing.totalRevenue ?? 0).toFixed(2)}`}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400">
            <span>{stats?.billing.totalTransactions ?? 0} giao dịch thành công</span>
          </div>
        </div>

        {/* AI Model Accuracy */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Độ Chính Xác Mô Hình AI
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading
              ? "..."
              : stats?.system.latestModelPerformance
              ? `${(stats.system.latestModelPerformance.accuracy * 100).toFixed(1)}%`
              : "Đang tính..."}
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400">
            <span>Phiên bản: {stats?.system.latestModelPerformance?.modelVersion || "v1-elo-logistic"}</span>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sync Logs */}
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Nhật Ký Đồng Bộ Thể Thao Gần Đây
            </h2>
            <Link
              href="/admin/sync-logs"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-neutral-500 py-4 text-center">Đang tải nhật ký...</div>
            ) : !stats?.system.recentSyncLogs.length ? (
              <div className="text-sm text-neutral-500 py-4 text-center">Chưa có nhật ký đồng bộ</div>
            ) : (
              stats.system.recentSyncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800/80"
                >
                  <div className="flex items-center gap-3">
                    {log.status === "SUCCESS" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-white">{log.jobName}</div>
                      <div className="text-xs text-neutral-400">
                        {new Date(log.startedAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {log.recordsProcessed} bản ghi
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System & Model Performance Summary */}
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Chi Tiết Đánh Giá Mô Hình AI
            </h2>
            <Link
              href="/admin/model-performance"
              className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Xem báo cáo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.system.latestModelPerformance ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800/80">
                  <div className="text-xs text-neutral-400">F1 Score</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {(stats.system.latestModelPerformance.f1 * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800/80">
                  <div className="text-xs text-neutral-400">Brier Score</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {stats.system.latestModelPerformance.avgBrierScore.toFixed(4)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800/80">
                  <div className="text-xs text-neutral-400">Log Loss</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {stats.system.latestModelPerformance.avgLogLoss.toFixed(4)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800/80">
                  <div className="text-xs text-neutral-400">Mẫu Đánh Giá</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {stats.system.latestModelPerformance.sampleSize} trận
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                Mô hình đang hoạt động ổn định và tự động hiệu chỉnh sau mỗi lượt trận đấu kết thúc.
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500 py-10 text-center">
              Chưa có dữ liệu đánh giá mô hình gần nhất
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
