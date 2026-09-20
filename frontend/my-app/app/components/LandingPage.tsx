"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SportSwitcher from "./SportSwitcher";
import PricingSection from "./PricingSection";
import { useMatches } from "../hooks/useMatches";
import { useSport } from "../context/SportContext";

// ────────────────────────────────────────────
// Icon SVG cho từng bước quy trình và tính năng nổi bật
// ────────────────────────────────────────────
function IconDatabase() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" />
    </svg>
  );
}

function IconBellAlert() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <path d="M4 2C2.8 3.7 2 5.7 2 8" />
      <path d="M22 8c0-2.3-.8-4.3-2-6" />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function IconShieldCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Hệ màu chủ đạo (Dark theme & Accent Green, Draw Neutral, Away Coral Red) dùng cho Landing Page
const bangMau = {
  bg: "#0B0E13",
  panel: "#12161D",
  panelAlt: "#161B23",
  border: "#232935",
  borderSoft: "#1B2029",
  text: "#EDEFF3",
  textMuted: "#B0B8C8",     // Tăng sáng để cải thiện contrast (trước: #8890A0)
  textFaint: "#8891A1",     // Tăng sáng để dễ đọc hơn (trước: #565E6C)
  accent: "#2FD98C",       // Màu xanh lá đại diện cho Đội nhà (Home win)
  accentDim: "#1E9A63",
  live: "#F2A93B",
  probDraw: "#64748B",     // Màu xám trung tính cho Tỷ lệ Hòa (Draw)
  probAway: "#F43F5E",     // Màu hồng/đỏ thẫm nổi bật cho Đội khách (Away win)
};

// Kiểu dữ liệu thông tin trận đấu
interface TranDau {
  league: string;
  home: string;
  away: string;
  time: string;
  probHome: number;
  probDraw: number;
  probAway: number;
}

interface ThanhXacSuatProps {
  home: number;
  draw: number;
  away: number;
  hienThiChuGiai?: boolean;
}

// Component hiển thị thanh phần trăm xác suất Thắng (Sân nhà) - Hòa - Thắng (Sân khách)
function ThanhXacSuat({ home, draw, away, hienThiChuGiai = true }: ThanhXacSuatProps) {
  const homeFormat = Number(home).toFixed(1);
  const drawFormat = Number(draw).toFixed(1);
  const awayFormat = Number(away).toFixed(1);

  const customTooltipText = `Dự đoán: Đội nhà thắng ${homeFormat}% | Hòa ${drawFormat}% | Đội khách thắng ${awayFormat}%`;

  return (
    <div className="w-full">
      {/* Thanh 3 phân khúc màu sắc rõ ràng + hiệu ứng tooltip native & phân chia viền */}
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#161B22] p-[1px] gap-[1px]"
        title={customTooltipText}
      >
        <div
          className="h-full rounded-l-full transition-all duration-300 hover:brightness-125"
          style={{ width: `${home}%`, backgroundColor: bangMau.accent }}
        />
        <div
          className="h-full transition-all duration-300 hover:brightness-125"
          style={{ width: `${draw}%`, backgroundColor: bangMau.probDraw }}
        />
        <div
          className="h-full rounded-r-full transition-all duration-300 hover:brightness-125"
          style={{ width: `${away}%`, backgroundColor: bangMau.probAway }}
        />
      </div>

      {/* Chú giải (Legend) rõ ràng với nhãn Nhà / Hòa / Khách kèm chấm màu */}
      {hienThiChuGiai && (
        <div
          className="mt-1.5 flex items-center justify-between font-mono text-[11px]"
          style={{ color: bangMau.textMuted }}
        >
          <span className="flex items-center gap-1.5" title={`Chủ nhà thắng: ${homeFormat}%`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bangMau.accent }} />
            <span>Nhà <strong style={{ color: bangMau.text }}>{homeFormat}%</strong></span>
          </span>
          <span className="flex items-center gap-1.5" title={`Hai đội hòa: ${drawFormat}%`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bangMau.probDraw }} />
            <span>Hòa <strong style={{ color: bangMau.text }}>{drawFormat}%</strong></span>
          </span>
          <span className="flex items-center gap-1.5" title={`Đội khách thắng: ${awayFormat}%`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bangMau.probAway }} />
            <span>Khách <strong style={{ color: bangMau.text }}>{awayFormat}%</strong></span>
          </span>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  // Trạng thái bật/tắt tooltip giải thích Brier Score
  const [hienGiaiThichBrier, setHienGiaiThichBrier] = useState<boolean>(false);
  const { sport } = useSport();
  const today = new Intl.DateTimeFormat("en-CA").format(new Date());
  const { data: todayMatches = [] } = useMatches({ date: today, sport });
  const { data: allMatches = [] } = useMatches({ sport, limit: 10 });

  const upcomingToday = todayMatches.filter((m) => m.status === "upcoming" || m.status === "live");
  const effectiveMatches = upcomingToday.length > 0 ? upcomingToday : (todayMatches.length > 0 ? todayMatches : allMatches);
  const isTodayMatch = todayMatches.length > 0;

  const danhSachTranDauSapToi: TranDau[] = effectiveMatches.slice(0, 3).map((match) => {
    const rawHome = match.prediction?.homeWinProb;
    const rawDraw = match.prediction?.drawProb;
    const rawAway = match.prediction?.awayWinProb;

    const probHome = rawHome !== undefined && rawHome !== null ? (rawHome > 1 ? rawHome : Number((rawHome * 100).toFixed(1))) : 45;
    const probDraw = sport === "basketball" ? 0 : (rawDraw !== undefined && rawDraw !== null ? (rawDraw > 1 ? rawDraw : Number((rawDraw * 100).toFixed(1))) : 25);
    const probAway = rawAway !== undefined && rawAway !== null ? (rawAway > 1 ? rawAway : Number((rawAway * 100).toFixed(1))) : 30;

    return {
      league: match.league,
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      time: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(match.kickoffTime)),
      probHome,
      probDraw,
      probAway,
    };
  });


  return (
    <div
      className="min-h-screen w-full max-w-full font-sans antialiased overflow-x-hidden"
      style={{ backgroundColor: bangMau.bg, color: bangMau.text }}
    >
      {/* Thanh điều hướng dùng chung toàn ứng dụng */}
      <Navbar />

      {/* Phần Hero - Giới thiệu dịch vụ với hiệu ứng Atmosphere & Floating Badges */}
      <section className="relative mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 xl:px-12 min-h-[calc(100vh-64px)] flex flex-col justify-center py-10 lg:py-16">
        {/* Lớp nền lưới công nghệ + Ambient Radial Glows (overflow-hidden riêng để không cắt cầu thủ) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-tech-grid opacity-60" />
          <div
            className="absolute top-1/4 -left-32 h-[450px] w-[450px] rounded-full opacity-15 blur-[120px]"
            style={{ backgroundColor: bangMau.accent }}
          />
          <div
            className="absolute bottom-10 right-0 h-[400px] w-[400px] rounded-full opacity-10 blur-[130px]"
            style={{ backgroundColor: "#38BDF8" }}
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-[1fr_auto] items-center justify-between">
          {/* Cột bên trái: Tiêu đề, Tagline AI & Nút CTA */}
          <div className="flex flex-col justify-center text-center sm:text-left max-w-xl xl:max-w-2xl">
            {/* AI Model Status Badge */}
            <div className="mb-4 inline-flex items-center gap-2 self-center sm:self-start rounded-full border px-3.5 py-1.5 backdrop-blur-md shadow-sm"
              style={{
                borderColor: `${bangMau.accent}35`,
                backgroundColor: "rgba(47, 217, 140, 0.08)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FD98C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2FD98C]"></span>
              </span>
              <span className="text-xs font-mono font-semibold tracking-wide" style={{ color: bangMau.accent }}>
                AI Model v2.4 • Cập nhật dữ liệu thời gian thực
              </span>
            </div>

            <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[52px] 2xl:text-[58px] text-white">
              Cảm xúc là của người hâm mộ, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#2FD98C] via-[#38BDF8] to-white bg-clip-text text-transparent">
                con số là của chúng tôi.
              </span>
            </h1>

            <p
              className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-[18px] leading-relaxed mx-auto sm:mx-0 font-normal"
              style={{ color: bangMau.textMuted }}
            >
              Mỗi trận đấu được chấm điểm từ dữ liệu thật: phong độ gần đây, Elo
              rating, hiệu suất sân nhà/sân khách. Sai số của mô hình được đo và
              tính toán rõ ràng bằng chuẩn Brier Score & Log Loss.
            </p>

            {/* Các nút CTA với hiệu ứng Glow */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 justify-center sm:justify-start">
              <Link
                href="/predictions"
                className="group relative z-20 inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 sm:px-8 sm:py-4 text-base font-bold transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-lg text-center shadow-[#2FD98C]/25"
                style={{ backgroundColor: bangMau.accent, color: bangMau.bg }}
              >
                <span>Xem dự đoán hôm nay</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#accuracy"
                className="relative z-20 inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-3.5 sm:px-8 sm:py-4 text-base font-semibold transition-all hover:bg-white/5 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] text-center backdrop-blur-sm"
                style={{ borderColor: bangMau.border, color: bangMau.text }}
              >
                <span>Xem độ chính xác</span>
                <span className="text-xs font-mono opacity-70">↓</span>
              </a>
            </div>

            {/* Micro Highlights bên dưới CTA */}
            <div className="mt-6 flex items-center justify-center sm:justify-start gap-5 text-xs" style={{ color: bangMau.textFaint }}>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Không quảng cáo rác
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Minh bạch 100%
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Tự động cập nhật
              </div>
            </div>
          </div>

          {/* Cột bên phải: Cụm Bảng Danh sách trận + Cầu thủ + Floating Badges (Tăng lề phải để Ronaldo/Curry hiển thị trọn vẹn 100%) */}
          <div className="flex justify-center items-center w-full lg:w-auto lg:mr-20 xl:mr-32 2xl:mr-40">
            <div className="relative w-full sm:w-[350px] lg:w-[360px] xl:w-[380px]">
              {/* Floating Badge 1: Nổi góc trên bên trái */}
              <div className="hidden lg:flex absolute -top-5 -left-10 z-20 animate-float-slow items-center gap-2 rounded-xl border px-3 py-1.5 shadow-xl backdrop-blur-md"
                style={{
                  borderColor: "rgba(47,217,140,0.3)",
                  backgroundColor: "rgba(18,22,29,0.85)",
                }}
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-[11px] font-medium text-emerald-300">
                  ⚡ Elo Rating: 1.890 (+14)
                </span>
              </div>

              {/* Floating Badge 2: Nổi góc dưới bên phải */}
              <div className="hidden lg:flex absolute -bottom-4 right-0 xl:-right-6 z-20 animate-float-reverse items-center gap-2 rounded-xl border px-3 py-1.5 shadow-xl backdrop-blur-md"
                style={{
                  borderColor: "rgba(56,189,248,0.3)",
                  backgroundColor: "rgba(18,22,29,0.85)",
                }}
              >
                <span className="font-mono text-[11px] font-medium text-sky-300">
                  🎯 Value Bet: +8.4% EV
                </span>
              </div>

              {/* Cầu thủ bên trái (Messi / LeBron) */}
              <div className="hidden xl:block absolute right-[calc(100%+8px)] bottom-0 z-10 w-36 xl:w-40 pointer-events-none transition-transform duration-300 hover:scale-105">
                <img
                  src={sport === "basketball" ? "/img/lebron.png" : "/img/messi.png"}
                  alt={sport === "basketball" ? "LeBron James" : "Lionel Messi"}
                  className="w-full h-auto object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]"
                />
              </div>

              {/* Bảng Danh sách trận sắp diễn ra */}
              <div
                className="relative z-10 w-full rounded-2xl border p-5 sm:p-6 shadow-2xl backdrop-blur-md transition-all hover:border-[#2FD98C]/30"
                style={{ borderColor: bangMau.border, backgroundColor: bangMau.panel }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold tracking-wide" style={{ color: bangMau.textMuted }}>
                    Trận sắp diễn ra
                  </span>
                  <span
                    className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10"
                    style={{ color: isTodayMatch ? bangMau.live : bangMau.accent }}
                  >
                    <span
                      className="h-2 w-2 animate-pulse rounded-full"
                      style={{ backgroundColor: isTodayMatch ? bangMau.live : bangMau.accent }}
                    />
                    {isTodayMatch ? "hôm nay" : "tâm điểm"}
                  </span>
                </div>

                {danhSachTranDauSapToi.length === 0 ? (
                  <div className="flex min-h-[240px] sm:min-h-[260px] items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm sm:text-base" style={{ borderColor: bangMau.borderSoft, color: bangMau.textMuted }}>
                    Chưa có trận nào hôm nay
                  </div>
                ) : (
                  <div className="flex flex-col divide-y" style={{ borderColor: bangMau.borderSoft }}>
                    {danhSachTranDauSapToi.map((tranDau, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0" style={{ borderColor: bangMau.borderSoft }}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium" style={{ color: bangMau.textFaint }}>
                            {tranDau.league}
                          </span>
                          <span className="font-mono text-xs font-medium" style={{ color: bangMau.textFaint }}>
                            {tranDau.time}
                          </span>
                        </div>
                        <div className="mb-2.5 flex items-center justify-between text-sm sm:text-base font-bold">
                          <span className="truncate max-w-[130px] sm:max-w-[150px]">{tranDau.home}</span>
                          <span className="text-xs px-2 font-normal" style={{ color: bangMau.textFaint }}>vs</span>
                          <span className="truncate max-w-[130px] sm:max-w-[150px] text-right">{tranDau.away}</span>
                        </div>
                        <ThanhXacSuat home={tranDau.probHome} draw={tranDau.probDraw} away={tranDau.probAway} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cầu thủ bên phải (Ronaldo / Curry) — Đảm bảo trọn vẹn 100% người và cánh tay */}
              <div className={`hidden xl:block absolute left-[calc(100%+4px)] bottom-0 z-10 pointer-events-none transition-transform duration-300 hover:scale-105 ${sport === "basketball" ? "w-40 xl:w-44" : "w-32 xl:w-36"}`}>
                <img
                  src={sport === "basketball" ? "/img/curry.png" : "/img/ronaldo.png"}
                  alt={sport === "basketball" ? "Stephen Curry" : "Cristiano Ronaldo"}
                  className="w-full h-auto object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phần Thống kê độ chính xác — Glassmorphism Stats Cards */}
      <section
        id="accuracy"
        className="border-y relative"
        style={{ borderColor: bangMau.borderSoft, backgroundColor: bangMau.panelAlt }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 px-4 sm:px-6 py-12 md:py-16 sm:grid-cols-3">
          {/* Card thống kê 1 — Độ chính xác */}
          <div
            className="group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:border-[#2FD98C]/40 hover:shadow-[0_0_30px_rgba(47,217,140,0.12)]"
            style={{
              borderColor: bangMau.border,
              backgroundColor: "rgba(22,27,35,0.6)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2FD98C]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: bangMau.accent }}>
                  55.4%
                </div>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400">
                  ▲ +2.4% tuần này
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold" style={{ color: bangMau.text }}>
                Độ chính xác 36 ngày qua
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: bangMau.textMuted }}>
                Tỷ lệ dự đoán đúng kết quả (Thắng/Hòa/Thua) trong 1 tháng gần nhất trên hơn 300+ trận.
              </p>
            </div>
          </div>

          {/* Card thống kê 2 — Brier Score với giải thích */}
          <div
            className="group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:border-[#2FD98C]/40 hover:shadow-[0_0_30px_rgba(47,217,140,0.12)]"
            style={{
              borderColor: bangMau.border,
              backgroundColor: "rgba(22,27,35,0.6)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2FD98C]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: bangMau.accent }}>
                    0.21
                  </span>
                  <button
                    type="button"
                    onClick={() => setHienGiaiThichBrier(!hienGiaiThichBrier)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold transition-colors hover:border-white hover:text-white"
                    style={{ borderColor: bangMau.border, color: bangMau.textMuted }}
                    title="Xem giải thích Brier Score"
                    aria-label="Giải thích Brier Score"
                  >
                    ?
                  </button>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-400">
                  Chuẩn Data Science
                </span>
              </div>

              <div className="mt-2 text-sm font-semibold" style={{ color: bangMau.text }}>
                Brier Score trung bình
              </div>

              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: bangMau.textMuted }}>
                Đo lường sai số dự đoán (0 đến 1). <strong className="text-emerald-400 font-semibold">Càng thấp càng chính xác</strong> (dưới 0.25 là mô hình đạt chuẩn).
              </p>

              {/* Popover chi tiết khi click nút (?) */}
              {hienGiaiThichBrier && (
                <div
                  className="absolute top-16 left-0 right-0 sm:right-auto sm:left-0 z-30 max-w-[calc(100vw-48px)] sm:w-72 rounded-xl border p-4 text-xs shadow-2xl backdrop-blur-xl"
                  style={{ borderColor: bangMau.border, backgroundColor: "rgba(18,22,29,0.95)", color: bangMau.text }}
                >
                  <div className="flex justify-between items-center mb-2 font-semibold text-emerald-400">
                    <span>💡 Brier Score là gì?</span>
                    <button onClick={() => setHienGiaiThichBrier(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
                  </div>
                  <p className="leading-relaxed" style={{ color: bangMau.textMuted }}>
                    Brier Score đánh giá khoảng cách giữa xác suất dự đoán và kết quả thực tế. Điểm số 0 nghĩa là dự đoán hoàn hảo 100%, 0.21 chứng tỏ mô hình có độ tin cậy rất cao.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card thống kê 3 — Trận đấu theo dõi */}
          <div
            className="group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:border-[#2FD98C]/40 hover:shadow-[0_0_30px_rgba(47,217,140,0.12)]"
            style={{
              borderColor: bangMau.border,
              backgroundColor: "rgba(22,27,35,0.6)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2FD98C]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: bangMau.accent }}>
                  1.240+
                </div>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400">
                  Live Sync API
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold" style={{ color: bangMau.text }}>
                Trận đấu đã theo dõi
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: bangMau.textMuted }}>
                Tổng số trận đấu được kiểm chứng và lưu trữ dữ liệu công khai trên toàn bộ các giải đấu lớn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mục Tính năng nổi bật & Công nghệ cốt lõi (Core Features Showcase) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span
            className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold mb-3"
            style={{ backgroundColor: `${bangMau.accent}15`, color: bangMau.accent }}
          >
            Tính năng cốt lõi
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            Nền tảng phân tích thể thao thế hệ mới
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: bangMau.textMuted }}>
            Kết hợp toán xác suất, hệ số Elo độc quyền và công nghệ AI thời gian thực để mang lại góc nhìn chuẩn xác nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {[
            {
              icon: <IconBrain />,
              title: "Mô hình AI & Elo Rating",
              badge: "Thuật toán",
              desc: "Tự động cập nhật điểm sức mạnh Elo sau mỗi trận, kết hợp phong độ 5 trận gần nhất và hệ số sân nhà/khách.",
            },
            {
              icon: <IconBellAlert />,
              title: "Cảnh báo Kèo Lệch",
              badge: "Value Bet",
              desc: "Phát hiện ngay khi tỷ lệ xác suất thực tế chênh lệch có lợi so với Odds thị trường, tạo kỳ vọng lợi nhuận dương.",
            },
            {
              icon: <IconTelegram />,
              title: "Bot Telegram VIP 24/7",
              badge: "Realtime",
              desc: "Nhận thông báo nhận định trước trận, phân tích đội hình và biến động tỷ lệ cược trực tiếp ngay trên điện thoại.",
            },
            {
              icon: <IconShieldCheck />,
              title: "Minh bạch 100%",
              badge: "Data Science",
              desc: "Không che giấu kết quả sai. Toàn bộ lịch sử dự đoán đều được đối chiếu và công khai chỉ số Brier Score & Log Loss.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border p-6 transition-all duration-300 hover:border-[#2FD98C]/40 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              style={{
                borderColor: bangMau.border,
                backgroundColor: bangMau.panel,
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border transition-colors group-hover:border-[#2FD98C]/50"
                    style={{
                      borderColor: bangMau.borderSoft,
                      backgroundColor: "rgba(47,217,140,0.08)",
                      color: bangMau.accent,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)", color: bangMau.textMuted }}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs sm:text-[13px] leading-relaxed" style={{ color: bangMau.textMuted }}>
                  {item.desc}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t flex items-center text-xs font-semibold text-emerald-400 gap-1 opacity-0 transition-opacity group-hover:opacity-100" style={{ borderColor: bangMau.borderSoft }}>
                <span>Khám phá tính năng</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mục So sánh: "Cảm tính / Tipster" vs "iKnowBall AI Data" */}
      <section
        className="border-y py-16 md:py-24 relative overflow-hidden"
        style={{ borderColor: bangMau.borderSoft, backgroundColor: bangMau.panelAlt }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <span
              className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold mb-3"
              style={{ backgroundColor: `${bangMau.accent}15`, color: bangMau.accent }}
            >
              Sự khác biệt vượt trội
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
              Tại sao nên tin vào Dữ liệu hơn là Cảm tính?
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: bangMau.textMuted }}>
              Đừng để cảm xúc và tin đồn dẫn dắt quyết định của bạn. Hãy nhìn nhận thể thao qua lăng kính khoa học.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Cột 1: Nhận định truyền thống / Tipster */}
            <div
              className="rounded-2xl border p-6 sm:p-8 flex flex-col justify-between"
              style={{
                borderColor: "rgba(244,63,94,0.2)",
                backgroundColor: "rgba(18,22,29,0.7)",
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-bold text-rose-400 font-mono tracking-wide">
                    ❌ CÁCH TRUYỀN THỐNG / TIPSTER
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">
                    Cảm tính
                  </span>
                </div>

                <ul className="space-y-4 text-xs sm:text-sm" style={{ color: bangMau.textMuted }}>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span><strong>Dựa vào linh cảm:</strong> Nhận định theo phong trào, tin đồn phòng thay đồ hoặc tên tuổi đội bóng.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span><strong>Thiếu minh bạch:</strong> Thổi phồng tỷ lệ thắng "100%", xóa các bài dự đoán thua, không có thống kê dài hạn.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span><strong>Rủi ro cao:</strong> Không có công thức tính kỳ vọng giá trị (Expected Value - EV), dễ cháy tài khoản.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span><strong>Không có dữ liệu đối chứng:</strong> Không thể tự kiểm tra lại hiệu quả trong quá khứ.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Cột 2: iKnowBall AI Engine */}
            <div
              className="rounded-2xl border p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl"
              style={{
                borderColor: "rgba(47,217,140,0.5)",
                backgroundColor: "rgba(22,27,35,0.85)",
              }}
            >
              <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full px-3 py-1 font-mono text-[11px] font-bold shadow-lg"
                style={{ backgroundColor: bangMau.accent, color: bangMau.bg }}
              >
                KHUYÊN DÙNG ★
              </div>

              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-bold text-emerald-400 font-mono tracking-wide flex items-center gap-1.5">
                    <span>⚡</span> IKNOWBALL DATA ENGINE
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">
                    Data-driven
                  </span>
                </div>

                <ul className="space-y-4 text-xs sm:text-sm" style={{ color: bangMau.text }}>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Xác suất 3 chiều:</strong> Đo đếm % Thắng - Hòa - Thua dựa trên Elo rating, hiệu số bàn thắng và tương quan đối đầu.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Công khai sai số Brier Score:</strong> Minh bạch từng trận, sai số đo lường theo chuẩn quốc tế không chỉnh sửa.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Phát hiện Value Bet:</strong> So sánh trực tiếp với Odds nhà cái để chỉ điểm những kèo có kỳ vọng dương cao.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Tự động hóa 24/7:</strong> Đồng bộ dữ liệu liên tục từ API-Football, báo kèo tức thì qua Telegram VIP.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quy trình hoạt động (How it works) */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24">
        <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl text-white">
          Từ dữ liệu thô đến một con số xác suất
        </h2>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {[
            {
              buoc: "1",
              tieuDe: "Thu thập dữ liệu thật",
              noiDung: "Đồng bộ tự động lịch thi đấu, kết quả và thống kê từ API-Football, chuẩn hóa về một định dạng chung.",
              icon: <IconDatabase />,
            },
            {
              buoc: "2",
              tieuDe: "Tính điểm elo",
              noiDung: "Elo rating được cập nhật sau mỗi trận, kết hợp phong độ gần đây và hiệu suất sân nhà/sân khách.",
              icon: <IconChart />,
            },
            {
              buoc: "3",
              tieuDe: "Dự đoán & đánh giá",
              noiDung: "Mô hình đưa ra xác suất thắng/hòa/thua, sai số đo bằng Log Loss và Brier Score sau mỗi trận.",
              icon: <IconTarget />,
            },
          ].map((buocXuly, idx) => (
            <div key={idx} className="relative flex flex-col items-start">
              {/* Hàng chứa Icon và Mũi tên kết nối sang bước tiếp theo */}
              <div className="flex w-full items-center">
                <div
                  className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 hover:shadow-[0_0_20px_rgba(47,217,140,0.15)]"
                  style={{
                    borderColor: bangMau.border,
                    backgroundColor: "rgba(22,27,35,0.6)",
                    color: bangMau.accent,
                  }}
                >
                  {buocXuly.icon}
                </div>

                {/* Mũi tên kết nối sang bước kế tiếp (Desktop) */}
                {idx < 2 && (
                  <div className="hidden md:flex flex-1 items-center pl-4 pr-2">
                    <div
                      className="relative h-[2px] w-full"
                      style={{
                        background: `linear-gradient(90deg, ${bangMau.accent}80, ${bangMau.accent}25)`,
                      }}
                    >
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-0 w-0"
                        style={{
                          borderTop: "4px solid transparent",
                          borderBottom: "4px solid transparent",
                          borderLeft: `7px solid ${bangMau.accent}90`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <span
                className="mt-4 inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                style={{
                  backgroundColor: `${bangMau.accent}15`,
                  color: bangMau.accent,
                }}
              >
                Bước {buocXuly.buoc}
              </span>

              <h3 className="mt-2.5 text-[15px] font-semibold">{buocXuly.tieuDe}</h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: bangMau.textMuted }}>
                {buocXuly.noiDung}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bảng xem trước lịch thi đấu */}
      <section id="matches" className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 md:pb-24">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Lịch thi đấu hôm nay</h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: bangMau.textMuted }}>
              Tỷ lệ dự đoán xác suất Thắng - Hòa - Thua trực quan theo thời gian thực <span className="sm:hidden text-emerald-400 font-mono text-[11px]">(Vuốt ngang để xem)</span>
            </p>
          </div>
          <Link href="/predictions" className="text-sm font-medium hover:underline shrink-0" style={{ color: bangMau.accent }}>
            Xem tất cả →
          </Link>
        </div>

        <div className="border-t overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0" style={{ borderColor: bangMau.border }}>
          {/* Header Bảng */}
          <div
            className="grid min-w-[620px] sm:min-w-[680px] grid-cols-[65px_1.2fr_1.2fr_220px_100px] gap-4 border-b py-3 text-[11px] font-medium"
            style={{ borderColor: bangMau.borderSoft, color: bangMau.textFaint }}
          >
            <span>Giờ</span>
            <span>Đội nhà</span>
            <span>Đội khách</span>
            <span>Tỷ lệ dự đoán (Nhà - Hòa - Khách)</span>
            <span className="text-right">Giải đấu</span>
          </div>

          {/* Nội dung danh sách trận đấu */}
          {danhSachTranDauSapToi.map((tranDau, idx) => (
            <div
              key={idx}
              className="grid min-w-[620px] sm:min-w-[680px] grid-cols-[65px_1.2fr_1.2fr_220px_100px] items-center gap-4 border-b py-3.5 sm:py-4 text-[13.5px] sm:text-[14px] transition-colors hover:bg-white/[0.02]"
              style={{ borderColor: bangMau.borderSoft }}
            >
              <span className="font-mono text-[12.5px] sm:text-[13px]" style={{ color: bangMau.textMuted }}>
                {tranDau.time}
              </span>
              <span className="font-semibold">{tranDau.home}</span>
              <span className="font-semibold">{tranDau.away}</span>
              <div>
                <ThanhXacSuat
                  home={tranDau.probHome}
                  draw={tranDau.probDraw}
                  away={tranDau.probAway}
                  hienThiChuGiai={true}
                />
              </div>
              <span className="text-right text-[11.5px] sm:text-[12px]" style={{ color: bangMau.textFaint }}>
                {tranDau.league}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Mục 5: Đánh giá & Nhận xét từ cộng đồng (Marquee tự chạy từ trái sang phải) */}
      <section
        id="testimonials"
        className="relative border-y py-14 md:py-20 overflow-hidden"
        style={{ borderColor: bangMau.borderSoft, backgroundColor: bangMau.panelAlt }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-8 sm:mb-10">
          {/* Tiêu đề phần Đánh giá */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span
                className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold mb-2.5"
                style={{ backgroundColor: `${bangMau.accent}15`, color: bangMau.accent }}
              >
                Cộng đồng & Trải nghiệm
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Được tin tưởng bởi người đam mê thể thao số liệu
              </h2>
              <p className="mt-2 text-xs sm:text-sm max-w-xl leading-relaxed" style={{ color: bangMau.textMuted }}>
                Lắng nghe chia sẻ từ những người dùng đã thay đổi cách theo dõi và nhận định trận đấu từ cảm tính sang khoa học dữ liệu.
              </p>
            </div>

            {/* Chỉ số uy tín tóm tắt */}
            <div
              className="flex items-center justify-around sm:justify-start gap-4 sm:gap-6 rounded-xl border p-3.5 sm:p-4 backdrop-blur-md shrink-0"
              style={{ borderColor: bangMau.border, backgroundColor: "rgba(18,22,29,0.7)" }}
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 text-xs sm:text-sm">
                  {"★".repeat(5)}
                </div>
                <div className="text-[11px] sm:text-xs font-medium mt-1" style={{ color: bangMau.textMuted }}>
                  <strong style={{ color: bangMau.text }}>4.9/5</strong> từ hơn 500+ đánh giá
                </div>
              </div>
              <div className="h-7 w-[1px]" style={{ backgroundColor: bangMau.border }} />
              <div>
                <div className="font-mono text-sm sm:text-base font-bold" style={{ color: bangMau.accent }}>
                  98.2%
                </div>
                <div className="text-[11px] sm:text-xs font-medium mt-1" style={{ color: bangMau.textMuted }}>
                  Hài lòng về độ minh bạch
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dải Card chạy vô tận từ Trái sang Phải */}
        <div className="relative w-full overflow-hidden py-3 sm:py-4">
          {/* Lớp gradient mờ 2 bên nhẹ mượt không gây lag */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 z-10"
            style={{
              background: `linear-gradient(to right, ${bangMau.panelAlt}, transparent)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 z-10"
            style={{
              background: `linear-gradient(to left, ${bangMau.panelAlt}, transparent)`,
            }}
          />

          {/* Hàng card chạy với hiệu ứng animate-marquee-ltr */}
          <div className="animate-marquee-ltr flex gap-4 sm:gap-6 px-4">
            {[
              {
                ten: "Trần Gia Bảo",
                vaiTro: "Fan laliga",
                avatar: "https://i.pinimg.com/736x/c2/2d/b1/c22db1d4af82f826fe66ebfa4218c4e7.jpg",
                noiDung:
                  "Điểm mình ưng ý nhất ở IKNOWBALL là tính minh bạch. Họ công khai Brier Score và Log Loss chứ không 'nổ' tỷ lệ thắng 100% như các hội nhóm. Mô hình Elo tính sân nhà/khách cực kỳ sát thực tế.",
                tag: "Premier League",
                xepHang: 5,
              },
              {
                ten: "Trương Tuấn Tú",
                vaiTro: "Chuyên đọc sách thể thao",
                avatar: "https://i.pinimg.com/736x/10/85/4e/10854e9efd086ecc63d68154a3496afd.jpg",
                noiDung:
                  "Thanh xác suất 3 màu phân tách Nhà - Hòa - Khách rất trực quan. Mình thường dùng chỉ số xác suất này để so sánh với Odds nhà cái, tìm ra các kèo Value Bet có kỳ vọng dương.",
                tag: "La Liga & UCL",
                xepHang: 5,
              },
              {
                ten: "Lê Quang Huy",
                vaiTro: "Người theo dõi NBA & Thể thao Mỹ",
                avatar: "https://i.pinimg.com/736x/22/fd/30/22fd30953a14a9f2dfb428f9dca61c39.jpg",
                noiDung:
                  "Chuyển đổi giữa Bóng đá và Bóng rổ rất mượt. Dữ liệu các trận đấu NBA cập nhật chuẩn xác, giúp việc phân tích phong độ các đội trước giờ bóng lăn nhàn hơn rất nhiều.",
                tag: "NBA Basketball",
                xepHang: 5,
              },
              {
                ten: "Lê Ngọc Mai",
                vaiTro: "Fan Ngoại Hạng Anh",
                avatar: "https://i.pinimg.com/1200x/fa/80/09/fa8009ce4fd4acc8e5fbb02f8c4aaece.jpg",
                noiDung:
                  "Giao diện Dark Mode đẹp và tốc độ tải trang cực nhanh. Không có quảng cáo rác hay banner cá cược phiền toái, thuần túy là dữ liệu và thống kê sạch sẽ.",
                tag: "Serie A & Calcio",
                xepHang: 5,
              },
              {
                ten: "Vũ Bảo Ngọc",
                vaiTro: "Chuyên viên thống kê thể thao",
                avatar: "https://i.pinimg.com/736x/8f/44/f1/8f44f107893d8b3b14a047602f6d1105.jpg",
                noiDung:
                  "Rất ấn tượng với cách giải thích Brier Score của website. Đây là tiêu chuẩn vàng trong xác suất dự báo thời tiết và tài chính, giờ được áp dụng cho thể thao rất chuẩn.",
                tag: "Data Science",
                xepHang: 5,
              },
              {
                ten: "Đỗ Quốc Cường",
                vaiTro: "Quản trị viên cộng đồng Bóng rổ",
                avatar: "https://i.pinimg.com/736x/4f/0f/70/4f0f70440d2be02a7b726b294cc63f27.jpg",
                noiDung:
                  "Theo dõi tỷ lệ dự đoán chuỗi trận Play-offs NBA từ mùa trước đến nay thấy mô hình dự đoán rất ổn định, đặc biệt là những trận derby căng thẳng.",
                tag: "Basketball Pro",
                xepHang: 5,
              },
              // Nhân đôi danh sách:
              {
                ten: "Nguyễn Hoàng Anh",
                vaiTro: "Data Analyst ",
                avatar: "https://i.pinimg.com/736x/a7/64/5f/a7645f9cc84777fbfe0d56e0ca15adbe.jpg",
                noiDung:
                  "Điểm mình ưng ý nhất ở IKNOWBALL là tính minh bạch. Họ công khai Brier Score và Log Loss chứ không 'nổ' tỷ lệ thắng 100% như các hội nhóm. Mô hình Elo tính sân nhà/khách cực kỳ sát thực tế.",
                tag: "Premier League",
                xepHang: 5,
              },
              {
                ten: "Đặng Tuấn Minh",
                vaiTro: "Fan sách thể thao",
                avatar: "https://i.pinimg.com/736x/41/91/3c/41913cc88884317f682aa4f3b78a3b41.jpg",
                noiDung:
                  "Thanh xác suất 3 màu phân tách Nhà - Hòa - Khách rất trực quan. Mình thường dùng chỉ số xác suất này để so sánh với Odds nhà cái, tìm ra các kèo Value Bet có kỳ vọng dương.",
                tag: "La Liga & UCL",
                xepHang: 5,
              },
              {
                ten: "Trần Minh Khánh",
                vaiTro: "Người theo dõi NBA & Thể thao Mỹ",
                avatar: "https://i.pinimg.com/736x/f0/3c/27/f03c27ee6774124784c6a8bac7ba48a3.jpg",
                noiDung:
                  "Chuyển đổi giữa Bóng đá và Bóng rổ rất mượt. Dữ liệu các trận đấu NBA cập nhật chuẩn xác, giúp việc phân tích phong độ các đội trước giờ bóng lăn nhàn hơn rất nhiều.",
                tag: "NBA Basketball",
                xepHang: 5,
              },
              {
                ten: "Hoàng Hải Long",
                vaiTro: "Fan Serie A",
                avatar: "https://i.pinimg.com/736x/27/0b/ed/270bedabfa19e4c2679ecc0570f12600.jpg",
                noiDung:
                  "Giao diện Dark Mode đẹp và tốc độ tải trang cực nhanh. Không có quảng cáo rác hay banner cá cược phiền toái, thuần túy là dữ liệu và thống kê sạch sẽ.",
                tag: "Serie A & Calcio",
                xepHang: 5,
              },
              {
                ten: "Vũ Thị Quỳnh Anh",
                vaiTro: "Fan bóng đá",
                avatar: "https://i.pinimg.com/736x/16/c2/05/16c2055939af0eb4f400050d8469064c.jpg",
                noiDung:
                  "Rất ấn tượng với cách giải thích Brier Score của website. Đây là tiêu chuẩn vàng trong xác suất dự báo thời tiết và tài chính, giờ được áp dụng cho thể thao rất chuẩn.",
                tag: "Data Science",
                xepHang: 5,
              },
              {
                ten: "Lê Thành Nam",
                vaiTro: "Data Scientist",
                avatar: "https://i.pinimg.com/736x/61/e4/77/61e47710c6148d25b8f114a3d2fb9afd.jpg",
                noiDung:
                  "Theo dõi tỷ lệ dự đoán chuỗi trận Play-offs NBA từ mùa trước đến nay thấy mô hình dự đoán rất ổn định, đặc biệt là những trận derby căng thẳng.",
                tag: "Basketball Pro",
                xepHang: 5,
              },
            ].map((nhanXet, idx) => (
              <div
                key={idx}
                className="group relative flex w-[280px] sm:w-[340px] md:w-[380px] min-h-[210px] sm:min-h-[220px] shrink-0 flex-col justify-between rounded-xl border p-4 sm:p-6 select-none"
                style={{
                  borderColor: bangMau.border,
                  backgroundColor: "#12161D",
                  transform: "translateZ(0)",
                }}
              >
                <div
                  className="absolute top-4 right-5 font-serif text-3xl sm:text-4xl font-bold opacity-10 pointer-events-none select-none transition-opacity duration-300 group-hover:opacity-25"
                  style={{ color: bangMau.accent }}
                >
                  “
                </div>

                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs sm:text-sm mb-2.5 sm:mb-3">
                    {Array.from({ length: nhanXet.xepHang }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>

                  <p className="text-[12.5px] sm:text-[13px] leading-relaxed relative z-10" style={{ color: bangMau.textMuted }}>
                    "{nhanXet.noiDung}"
                  </p>
                </div>

                <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t flex items-center justify-between" style={{ borderColor: bangMau.borderSoft }}>
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <img
                      src={nhanXet.avatar}
                      alt={nhanXet.ten}
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border shrink-0"
                      style={{ borderColor: bangMau.border }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate" style={{ color: bangMau.text }}>
                        {nhanXet.ten}
                      </div>
                      <div className="text-[10px] sm:text-[11px] truncate" style={{ color: bangMau.textFaint }}>
                        {nhanXet.vaiTro}
                      </div>
                    </div>
                  </div>

                  <span
                    className="rounded px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-medium shrink-0 ml-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)", color: bangMau.textFaint }}
                  >
                    {nhanXet.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mục Bảng giá & Đăng ký gói dịch vụ trực tiếp trên Landing Page */}
      <PricingSection id="pricing" showFaq={true} />

      {/* Banner Call-to-Action (CTA) phủ full toàn bộ chiều ngang trang web */}
      <section
        className="relative w-full border-t py-16 sm:py-20 md:py-24 overflow-hidden text-center"
        style={{
          borderColor: bangMau.borderSoft,
          backgroundColor: bangMau.panel,
        }}
      >
        {/* Hiệu ứng ánh sáng nền gradient lan tỏa toàn màn hình */}
        <div
          className="absolute -top-32 -left-20 h-96 w-96 rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ backgroundColor: bangMau.accent }}
        />
        <div
          className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full opacity-15 blur-[100px] pointer-events-none"
          style={{ backgroundColor: bangMau.probAway }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
          style={{ backgroundColor: bangMau.accent }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mx-auto leading-tight text-white">
            Bắt đầu theo dõi dự đoán thể thao bằng dữ liệu ngay hôm nay
          </h2>
          <p
            className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed"
            style={{ color: bangMau.textMuted }}
          >
            Trải nghiệm nền tảng phân tích thể thao chuẩn Data Science. Đăng ký tài khoản miễn phí để mở khóa toàn bộ số liệu và dự đoán chuyên sâu.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto rounded-md px-7 py-3 text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_20px_rgba(47,217,140,0.3)] shadow-md text-center"
              style={{ backgroundColor: bangMau.accent, color: bangMau.bg }}
            >
              Tạo tài khoản miễn phí
            </Link>
            <Link
              href="/predictions"
              className="w-full sm:w-auto rounded-md border px-7 py-3 text-sm font-medium transition-all duration-200 hover:bg-white/5 hover:border-white/40 text-center"
              style={{ borderColor: bangMau.border, color: bangMau.text }}
            >
              Xem dự đoán hôm nay
            </Link>
          </div>
        </div>
      </section>

      {/* Chân trang (Footer) dùng chung toàn hệ thống */}
      <Footer />
    </div>
  );
}
