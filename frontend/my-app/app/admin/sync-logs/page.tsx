"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Play } from "lucide-react";
import { getAdminSyncLogs, AdminSyncLogItem } from "../../lib/api/endpoints/admin";

export default function AdminSyncLogsPage() {
  const [logs, setLogs] = useState<AdminSyncLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterJob, setFilterJob] = useState("");

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-emerald-400" />
            Nhật Ký Đồng Bộ Dữ Liệu Thể Thao
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Theo dõi tiến trình ingest dữ liệu trận đấu, bảng xếp hạng, và cập nhật Elo rating.
          </p>
        </div>

        <button
          onClick={() => loadLogs()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-white transition-all"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>Làm Mới</span>
        </button>
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
