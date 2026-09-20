"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, Play, Database, Layers, Trophy, Newspaper, Loader2 } from "lucide-react";
import { getAdminSyncLogs, triggerAdminSync, syncNews, AdminSyncLogItem } from "../../lib/api/endpoints/admin";

export default function AdminSyncLogsPage() {
  const [logs, setLogs] = useState<AdminSyncLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterJob, setFilterJob] = useState("");

  const [syncingType, setSyncingType] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await getAdminSyncLogs({
        page,
        limit: 20,
        jobName: filterJob || undefined,
      });
      setLogs(res.data);
      if (res.meta?.totalPages) setTotalPages(Number(res.meta.totalPages));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, filterJob]);

  const handleTriggerSync = async (type: "full" | "matches" | "standings" | "leagues" | "teams" | "news", sport?: "football" | "basketball") => {
    setSyncingType(type + (sport ? `-${sport}` : ""));
    setSyncResult(null);
    try {
      if (type === "news") {
        const res = await syncNews();
        setSyncResult({
          success: true,
          message: `Đồng bộ Tin tức thành công! Đã xử lý ${res.data?.recordsProcessed ?? 0} bài viết từ ${res.data?.sources ?? 0} nguồn.`,
        });
      } else {
        const res = await triggerAdminSync({ type: type as any, sport });
        setSyncResult({
          success: true,
          message: `Kích hoạt đồng bộ ${type.toUpperCase()} ${sport ? `(${sport})` : ""} thành công!`,
        });
      }
      await loadLogs();
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || `Lỗi khi kích hoạt đồng bộ ${type}`,
      });
    } finally {
      setSyncingType(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-emerald-400" />
            Nhật Ký & Kích Hoạt Đồng Bộ Dữ Liệu
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Theo dõi tiến trình và kích hoạt đồng bộ dữ liệu trận đấu, giải đấu, bảng xếp hạng qua API nhà cung cấp thể thao.
          </p>
        </div>

        <button
          onClick={() => loadLogs()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Sync Trigger Action Panel */}
      <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            Kích Hoạt Đồng Bộ Dữ Liệu Tức Thì (On-Demand Sync API)
          </h2>
          <span className="text-xs text-neutral-500 font-mono">POST /api/v1/admin/sync/trigger</span>
        </div>

        {syncResult && (
          <div
            className={`p-3.5 rounded-xl text-sm flex items-center gap-3 ${
              syncResult.success
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
            }`}
          >
            {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>{syncResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => handleTriggerSync("full")}
            disabled={!!syncingType}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 gap-2"
          >
            {syncingType === "full" ? (
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            ) : (
              <Database className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-xs font-semibold">Đồng Bộ Toàn Diện</span>
          </button>

          <button
            onClick={() => handleTriggerSync("matches", "football")}
            disabled={!!syncingType}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 gap-2"
          >
            {syncingType === "matches-football" ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <Layers className="w-5 h-5 text-blue-400" />
            )}
            <span className="text-xs font-semibold">Trận Bóng Đá</span>
          </button>

          <button
            onClick={() => handleTriggerSync("matches", "basketball")}
            disabled={!!syncingType}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 gap-2"
          >
            {syncingType === "matches-basketball" ? (
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            ) : (
              <Layers className="w-5 h-5 text-amber-400" />
            )}
            <span className="text-xs font-semibold">Trận NBA</span>
          </button>

          <button
            onClick={() => handleTriggerSync("standings")}
            disabled={!!syncingType}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 gap-2"
          >
            {syncingType === "standings" ? (
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            ) : (
              <Trophy className="w-5 h-5 text-purple-400" />
            )}
            <span className="text-xs font-semibold">Bảng Xếp Hạng</span>
          </button>

          <button
            onClick={() => handleTriggerSync("teams")}
            disabled={!!syncingType}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 gap-2"
          >
            {syncingType === "teams" ? (
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            ) : (
              <Database className="w-5 h-5 text-cyan-400" />
            )}
            <span className="text-xs font-semibold">Đội Bóng</span>
          </button>

          <button
            onClick={() => handleTriggerSync("news")}
            disabled={!!syncingType}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 gap-2"
          >
            {syncingType === "news" ? (
              <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
            ) : (
              <Newspaper className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-xs font-semibold">Tin Tức RSS</span>
          </button>
        </div>
      </div>


      {/* Logs Table */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Tác Vụ (Job Name)</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Bản Ghi Đã Xử Lý</th>
                <th className="py-3.5 px-4">Bắt Đầu</th>
                <th className="py-3.5 px-4">Hoàn Tất</th>
                <th className="py-3.5 px-4">Thông Báo Lỗi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Đang tải nhật ký đồng bộ...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Chưa có lịch sử đồng bộ
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {log.jobName}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {log.recordsProcessed.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                      {new Date(log.startedAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                      {log.finishedAt ? new Date(log.finishedAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-rose-400 font-mono max-w-xs truncate">
                      {log.errorMessage || "—"}
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
