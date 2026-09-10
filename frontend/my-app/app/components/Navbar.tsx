"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { colors } from "../lib/design-tokens";
import SportSwitcher from "./SportSwitcher";
import { useAuth } from "../hooks/useAuth";

interface NavLinkItem {
  href: string;
  label: string;
}

const navLinks: NavLinkItem[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/matches", label: "Lịch thi đấu" },
  { href: "/standings", label: "Bảng xếp hạng" },
];

/**
 * Dropdown menu cho user đã đăng nhập
 */
function UserDropdown({
  user,
  isAdmin,
  onLogout,
}: {
  user: { email: string; fullName: string | null };
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = (user.fullName?.[0] ?? user.email[0]).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar button */}
      <button
        id="btn-user-menu"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all hover:bg-white/5"
        aria-label="Menu tài khoản"
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: "rgba(47,217,140,0.15)",
            border: "1px solid rgba(47,217,140,0.3)",
            color: colors.accent,
          }}
        >
          {initial}
        </div>
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          {user.fullName ?? user.email.split("@")[0]}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: colors.textMuted }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border py-1.5 shadow-xl"
          style={{
            background: colors.panel,
            borderColor: colors.border,
            zIndex: 50,
          }}
        >
          {/* Email info */}
          <div
            className="px-4 py-2 mb-1 border-b"
            style={{ borderColor: colors.borderSoft }}
          >
            <p className="text-[11px] font-medium" style={{ color: colors.textFaint }}>
              Đăng nhập với
            </p>
            <p className="text-xs truncate" style={{ color: colors.text }}>
              {user.email}
            </p>
          </div>

          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-white/5"
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
            className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-white/5"
            style={{ color: colors.textMuted }}
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Logo & Brand & Sport Switcher */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <img
              src="/img/fasvicon.png"
              alt="iKnowBall Logo"
              className="h-7 w-7 rounded-md object-contain"
            />
            <span className="text-base font-bold tracking-tight text-white">
              iKnowBall
            </span>
          </Link>

          {/* Sport Switcher Toggle */}
          <div className="hidden sm:block">
            <SportSwitcher size="sm" />
          </div>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  isActive ? "text-white font-semibold" : "hover:text-white"
                }`}
                style={{ color: isActive ? colors.text : colors.textMuted }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            // Skeleton loading khi đang kiểm tra session
            <div className="h-7 w-24 rounded-xl animate-pulse" style={{ background: colors.border }} />
          ) : isAuthenticated && user ? (
            // Đã đăng nhập → hiển thị user menu
            <UserDropdown user={user} isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            // Chưa đăng nhập → nút login/register
            <>
              <Link
                id="btn-navbar-login"
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium transition-colors hover:text-white"
                style={{ color: colors.textMuted }}
              >
                Đăng nhập
              </Link>
              <Link
                id="btn-navbar-register"
                href="/register"
                className="rounded-sm px-4 py-1.5 text-sm font-semibold transition-all hover:opacity-90"
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
          className="flex h-9 w-9 items-center justify-center rounded-sm border text-base md:hidden"
          style={{ borderColor: colors.border, color: colors.textMuted }}
          aria-label="Mở menu"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          className="flex flex-col gap-3 border-t px-5 py-4 md:hidden"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
        >
          <div className="pb-2 border-b" style={{ borderColor: colors.borderSoft }}>
            <span className="text-[11px] text-gray-400 block mb-1.5 font-medium">Chọn môn thể thao:</span>
            <SportSwitcher size="sm" />
          </div>

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
                className={`text-sm py-1.5 transition-colors ${
                  isActive ? "text-white font-semibold" : ""
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
                <div className="flex items-center gap-2.5 px-1 py-1.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0"
                    style={{
                      background: "rgba(47,217,140,0.15)",
                      border: "1px solid rgba(47,217,140,0.3)",
                      color: colors.accent,
                    }}
                  >
                    {(user.fullName?.[0] ?? user.email[0]).toUpperCase()}
                  </div>
                  <span className="text-sm truncate" style={{ color: colors.text }}>
                    {user.fullName ?? user.email}
                  </span>
                </div>
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
