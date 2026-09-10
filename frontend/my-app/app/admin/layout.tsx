"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
  Activity,
  LogOut,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin", label: "Tổng Quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Người Dùng", icon: Users },
  { href: "/admin/subscriptions", label: "Thanh Toán & Gói", icon: CreditCard },
  { href: "/admin/sync-logs", label: "Nhật Ký Đồng Bộ", icon: RefreshCw },
  { href: "/admin/model-performance", label: "Hiệu Năng AI", icon: TrendingUp },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldCheck },
];

/**
 * AdminGuard: kiểm tra xác thực và role phía client.
 * Middleware đã chặn người không có cookie, nhưng đây là lớp bảo vệ thứ 2
 * để đảm bảo chỉ user có role "admin" mới vào được.
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isAdmin) {
      // Đăng nhập rồi nhưng không phải admin → logout và về trang chủ
      logout().then(() => router.replace("/"));
    }
  }, [isLoading, isAuthenticated, isAdmin, pathname, router, logout]);

  // Hiển thị màn hình loading trong khi check
  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-emerald-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-neutral-400">Đang xác thực quyền truy cập…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#07090E] text-[#EDEFF3] flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-neutral-900/70 border-b md:border-b-0 md:border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0">
          <div>
            {/* Brand & Admin Badge */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  iKnow<span className="text-emerald-400">Ball</span>
                </span>
              </Link>
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Admin
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-neutral-800 space-y-3">
            {/* Thông tin admin đang đăng nhập */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-800/40">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                  {user.fullName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {user.fullName ?? "Admin"}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/40 text-xs text-neutral-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Server Status: Online</span>
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Trang Chủ Khách Hàng</span>
            </Link>

            {/* Nút đăng xuất */}
            <button
              id="btn-admin-logout"
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 transition-colors rounded-lg hover:bg-rose-500/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}

