"use client";

import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getApiAccessToken } from "../lib/api/client";
import { colors } from "../lib/design-tokens";

interface CsvExportButtonProps {
  type: "predictions" | "performance";
  leagueId?: string;
  season?: string;
  sport?: string;
  label?: string;
  className?: string;
}

export default function CsvExportButton({
  type,
  leagueId,
  season,
  sport,
  label,
  className = "",
}: CsvExportButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isVipOrPro = user?.tier === "vip" || user?.tier === "pro" || user?.role === "admin";

  const handleExport = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    if (!isVipOrPro) {
      window.location.href = "/pricing";
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const token = getApiAccessToken();

      let url = `${baseUrl}/api/v1/predictions/${type === "performance" ? "performance/export" : "export"}`;
      const params = new URLSearchParams();
      if (leagueId) params.append("leagueId", leagueId);
      if (season) params.append("season", season);
      if (sport) params.append("sport", sport);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error("Không thể tải file CSV. Vui lòng thử lại sau.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        type === "performance"
          ? `iknowball-model-performance-${new Date().toISOString().slice(0, 10)}.csv`
          : `iknowball-predictions-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || "Lỗi tải file");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
          isVipOrPro
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
        } ${className}`}
        title={!isVipOrPro ? "Tính năng xuất CSV dành cho tài khoản Pro & VIP" : "Tải dữ liệu thống kê ra file CSV"}
      >
        <span>{isExporting ? "⏳ Đang xuất..." : "📥"}</span>
        <span>
          {label || (type === "performance" ? "Xuất CSV Benchmark" : "Xuất CSV Dữ liệu")}
        </span>
        {!isVipOrPro && (
          <span className="rounded bg-amber-400/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-300">
            VIP
          </span>
        )}
      </button>

      {errorMsg && (
        <div className="absolute top-full mt-1.5 right-0 z-20 rounded-lg border border-rose-500/30 bg-rose-950/90 px-3 py-1.5 text-[11px] text-rose-300 whitespace-nowrap shadow-lg">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
