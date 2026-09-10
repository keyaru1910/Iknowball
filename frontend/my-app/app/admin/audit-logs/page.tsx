"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, AlertTriangle, KeyRound, Clock } from "lucide-react";
import { getAdminAuditLogs, AdminAuditLogItem } from "../../lib/api/endpoints/admin";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError(null);
        const res = await getAdminAuditLogs({ page, limit: 25 });
        setLogs(res.data || []);
        if (res.meta?.totalPages) setTotalPages(Number(res.meta.totalPages));
      } catch (err: any) {
        setError(err.message || "Không thể tải nhật ký kiểm toán");
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
          Nhật Ký Kiểm Toán (Audit Logs)
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Lịch sử các thao tác phân quyền, khóa tài khoản và thay đổi gói dịch vụ phục vụ an ninh hệ thống.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setPage((p) => p)}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold text-rose-300 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Hành Động</th>
                <th className="py-3.5 px-4">Người Thực Hiện (Actor)</th>
                <th className="py-3.5 px-4">Đối Tượng (Target)</th>
                <th className="py-3.5 px-4">Chi Tiết Thay Đổi</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Chưa có sự kiện kiểm toán nào
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-neutral-800 text-emerald-400 border border-neutral-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-300">
                      {log.actor?.email || "Hệ Thống (System)"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-300">
                      {log.targetUser?.email || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-neutral-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-neutral-500">
                      {log.ipAddress || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div>
              Trang {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Trang trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

