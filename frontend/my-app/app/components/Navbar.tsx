"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { colors } from "../lib/design-tokens";
import SportSwitcher from "./SportSwitcher";
import { useAuth } from "../hooks/useAuth";
import { type AuthUser } from "../lib/api/endpoints/auth";
import UserBadge from "./UserBadge";

interface NavLinkItem {
  href: string;
  label: string;
}

const navLinks: NavLinkItem[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/predictions", label: "Dự đoán hôm nay" },
  { href: "/alerts", label: "Cảnh báo biến động" },
  { href: "/predictions/performance", label: "Hiệu năng mô hình" },
  { href: "/news", label: "Tin tức" },
  { href: "/#pricing", label: "Đăng ký gói" },
];

/**
 * Dropdown menu cho user đã đăng nhập
 */
function UserDropdown({
  user,
  isAdmin,
  onLogout,
}: {
  user: AuthUser;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = (user.fullName?.[0] ?? user.email[0]).toUpperCase();
  const isPremiumUser = user.tier === "pro" || user.tier === "vip" || user.role === "premium";

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        id="btn-user-dropdown"
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/5 whitespace-nowrap shrink-0"
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0"
          style={{
            background: isPremiumUser ? "rgba(245,158,11,0.15)" : "rgba(47,217,140,0.15)",
            border: isPremiumUser ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(47,217,140,0.3)",
            color: isPremiumUser ? "#FBBF24" : colors.accent,
          }}
        >
          {initial}
        </div>
        <span className="text-sm font-medium whitespace-nowrap truncate max-w-[140px]" style={{ color: colors.text }}>
          {user.fullName ?? user.email.split("@")[0]}
        </span>
        <UserBadge tier={user.tier} role={user.role} size="xs" />
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          style={{ color: colors.textMuted }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border py-1.5 shadow-xl backdrop-blur-xl"
          style={{
            background: colors.panel,
            borderColor: colors.border,
            zIndex: 50,
          }}
        >
          {/* Email & Tier info */}
          <div
            className="px-4 py-2 mb-1 border-b"
            style={{ borderColor: colors.borderSoft }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-medium" style={{ color: colors.textFaint }}>
                Tài khoản
              </p>
              <UserBadge tier={user.tier} role={user.role} size="xs" />
            </div>
            <p className="text-xs truncate font-medium" style={{ color: colors.text }}>
              {user.email}
            </p>
          </div>

          {/* Pricing CTA */}
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/5"
            style={{ color: isPremiumUser ? "#FBBF24" : colors.accent }}
          >
            <span>{isPremiumUser ? "👑 Gói đăng ký của tôi" : "⚡ Nâng cấp PRO / VIP"}</span>
            <span className="text-[11px] font-normal text-neutral-400">→</span>
          </Link>

          {/* VIP Telegram Hub */}
          <Link
            href="/vip"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-white/5"
            style={{ color: colors.text }}
          >
            <span className="flex items-center gap-1.5">
              <span>✈️</span>
              <span>Kênh VIP Telegram</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-bold">
              VIP
            </span>
          </Link>

          {/* Developer API Link */}
          <Link
            href="/developer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-white/5"
            style={{ color: colors.text }}
          >
            <span className="flex items-center gap-1.5">
              <span>🔑</span>
              <span>Developer API</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
              VIP
            </span>
          </Link>

          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs transition-colors hover:bg-white/5"
              style={{ color: "#F87171" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Admin Dashboard
            </Link>
          )}

          {/* Logout */}
          <button
            id="btn-navbar-logout"
            type="button"
            onClick={() => { setOpen(false); onLogout(); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-xs transition-colors hover:bg-white/5 border-t mt-1"
            style={{ borderColor: colors.borderSoft, color: colors.textMuted }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Thanh điều hướng (Navbar) dùng chung cho toàn bộ ứng dụng
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        borderColor: colors.borderSoft,
        backgroundColor: `${colors.bg}E6`,
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 sm:px-6 py-3 gap-3">
        {/* Logo & Brand & Sport Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 transition-opacity hover:opacity-90">
            <img
              src="/img/fasvicon.png"
              alt="iKnowBall Logo"
              className="h-7 w-7 rounded-md object-contain shrink-0"
            />
            <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
              iKnowBall
            </span>
          </Link>

          {/* Sport Switcher Toggle - Hiển thị cạnh logo trên cả điện thoại & desktop */}
          <div className="flex items-center shrink-0">
            <SportSwitcher size="sm" />
          </div>
        </div>

        {/* Navigation Links (Desktop) - Luôn hiển thị 1 dòng, không bị ngắt chữ */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-sm font-medium whitespace-nowrap shrink-0">
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap shrink-0 transition-colors ${isActive ? "text-white font-semibold" : "hover:text-white"
                  }`}
                style={{ color: isActive ? colors.text : colors.textMuted }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5 xl:gap-3 shrink-0">
          {isLoading ? (
            // Skeleton loading khi đang kiểm tra session
            <div className="h-7 w-24 rounded-xl animate-pulse shrink-0" style={{ background: colors.border }} />
          ) : isAuthenticated && user ? (
            // Đã đăng nhập → hiển thị user menu
            <UserDropdown user={user} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            // Chưa đăng nhập → nút login/register
            <>
              <Link
                id="btn-navbar-login"
                href="/login"
                className="px-3 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors hover:text-white"
                style={{ color: colors.textMuted }}
              >
                Đăng nhập
              </Link>
              <Link
                id="btn-navbar-register"
                href="/register"
                className="rounded-sm px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap shrink-0 transition-all hover:opacity-90"
                style={{ backgroundColor: colors.accent, color: colors.bg }}
              >
                Bắt đầu miễn phí
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-sm border text-base lg:hidden shrink-0"
          style={{ borderColor: colors.border, color: colors.textMuted }}
          aria-label="Mở menu"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          className="flex flex-col gap-3 border-t px-5 py-4 lg:hidden"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
        >
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm py-1.5 transition-colors ${isActive ? "text-white font-semibold" : ""
                  }`}
                style={{ color: isActive ? colors.accent : colors.textMuted }}
              >
                {item.label}
              </Link>
            );
          })}

          <div
            className="mt-2 flex flex-col gap-2 border-t pt-3"
            style={{ borderColor: colors.borderSoft }}
          >
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center justify-between px-1 py-1.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0"
                      style={{
                        background: user.tier === "pro" || user.tier === "vip" ? "rgba(245,158,11,0.15)" : "rgba(47,217,140,0.15)",
                        border: user.tier === "pro" || user.tier === "vip" ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(47,217,140,0.3)",
                        color: user.tier === "pro" || user.tier === "vip" ? "#FBBF24" : colors.accent,
                      }}
                    >
                      {(user.fullName?.[0] ?? user.email[0]).toUpperCase()}
                    </div>
                    <span className="text-sm truncate" style={{ color: colors.text }}>
                      {user.fullName ?? user.email}
                    </span>
                  </div>
                  <UserBadge tier={user.tier} role={user.role} size="xs" />
                </div>
                <Link
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full rounded-sm border py-2 text-sm font-semibold text-center transition-colors hover:bg-white/5 block"
                  style={{
                    borderColor: user.tier === "pro" || user.tier === "vip" ? "rgba(245,158,11,0.3)" : colors.borderSoft,
                    color: user.tier === "pro" || user.tier === "vip" ? "#FBBF24" : colors.accent,
                  }}
                >
                  {user.tier === "pro" || user.tier === "vip" ? "👑 Quản lý gói cước" : "⚡ Nâng cấp PRO / VIP"}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full rounded-sm border py-2 text-sm font-medium text-center transition-colors hover:bg-white/5 block"
                    style={{ borderColor: "#F87171", color: "#F87171" }}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  className="w-full rounded-sm border py-2 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full rounded-sm border py-2 text-sm font-medium text-center transition-colors hover:bg-white/5 block"
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full rounded-sm py-2 text-sm font-semibold text-center transition-opacity hover:opacity-90 block"
                  style={{ backgroundColor: colors.accent, color: colors.bg }}
                >
                  Bắt đầu miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
