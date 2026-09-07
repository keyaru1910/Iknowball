"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { colors } from "../lib/design-tokens";
import SportSwitcher from "./SportSwitcher";

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
 * Thanh điều hướng (Navbar) dùng chung cho toàn bộ ứng dụng
 */
export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <button
            type="button"
            className="px-3.5 py-1.5 text-sm font-medium transition-colors hover:text-white"
            style={{ color: colors.textMuted }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className="rounded-sm px-4 py-1.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: colors.accent, color: colors.bg }}
          >
            Bắt đầu miễn phí
          </button>
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
            <button
              type="button"
              className="w-full rounded-sm border py-2 text-sm font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: colors.border, color: colors.text }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className="w-full rounded-sm py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.accent, color: colors.bg }}
            >
              Bắt đầu miễn phí
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
