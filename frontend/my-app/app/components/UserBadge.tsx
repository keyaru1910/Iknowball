"use client";

import React from "react";

export type UserTier = "free" | "pro" | "vip" | "admin" | "premium" | "user" | string | null | undefined;

interface UserBadgeProps {
  tier?: UserTier;
  role?: string;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

/**
 * Component hiển thị huy hiệu thành viên (VIP, PRO, ADMIN) chuẩn thẩm mỹ cao
 */
export default function UserBadge({
  tier,
  role,
  size = "sm",
  showLabel = true,
  className = "",
}: UserBadgeProps) {
  // Chuẩn hóa tier
  let resolvedTier = (tier || "").toLowerCase();
  const resolvedRole = (role || "").toLowerCase();

  if (!resolvedTier || resolvedTier === "user") {
    if (resolvedRole === "admin") resolvedTier = "admin";
    else if (resolvedRole === "premium") resolvedTier = "pro";
    else resolvedTier = "free";
  }

  if (resolvedTier === "premium") resolvedTier = "pro";

  if (resolvedTier === "free" || !resolvedTier) {
    return null;
  }

  // Size mappings
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px] gap-1",
    sm: "px-2 py-0.5 text-xs gap-1.2",
    md: "px-2.5 py-1 text-xs gap-1.5 font-bold",
  };

  if (resolvedTier === "vip") {
    return (
      <span
        title="Thành viên VIP Insights"
        className={`inline-flex items-center rounded-full font-bold tracking-wide border shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all ${
          sizeClasses[size]
        } bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-amber-400/50 text-amber-300 hover:border-amber-300 ${className}`}
      >
        <span className="text-[11px] drop-shadow">👑</span>
        {showLabel && <span className="uppercase tracking-wider font-extrabold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">VIP</span>}
      </span>
    );
  }

  if (resolvedTier === "pro") {
    return (
      <span
        title="Thành viên PRO Analyst"
        className={`inline-flex items-center rounded-full font-bold tracking-wide border shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all ${
          sizeClasses[size]
        } bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 border-emerald-400/50 text-emerald-300 hover:border-emerald-300 ${className}`}
      >
        <span className="text-[11px]">⚡</span>
        {showLabel && <span className="uppercase tracking-wider font-extrabold bg-gradient-to-r from-emerald-200 via-teal-300 to-cyan-300 bg-clip-text text-transparent">PRO</span>}
      </span>
    );
  }

  if (resolvedTier === "admin") {
    return (
      <span
        title="Quản trị viên hệ thống"
        className={`inline-flex items-center rounded-full font-bold tracking-wide border shadow-[0_0_10px_rgba(168,85,247,0.2)] transition-all ${
          sizeClasses[size]
        } bg-gradient-to-r from-purple-500/20 via-rose-500/15 to-pink-500/20 border-purple-400/50 text-purple-300 hover:border-purple-300 ${className}`}
      >
        <span className="text-[11px]">🛡️</span>
        {showLabel && <span className="uppercase tracking-wider font-extrabold bg-gradient-to-r from-purple-200 via-pink-300 to-rose-300 bg-clip-text text-transparent">ADMIN</span>}
      </span>
    );
  }

  return null;
}
