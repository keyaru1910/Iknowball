"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SportSwitcher from "./SportSwitcher";
import { useMatches } from "../hooks/useMatches";
import { useSport } from "../context/SportContext";

// ────────────────────────────────────────────
// Icon SVG cho từng bước quy trình (How it works)
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
  const customTooltipText = `Dự đoán: Đội nhà thắng ${home}% | Hòa ${draw}% | Đội khách thắng ${away}%`;

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
          <span className="flex items-center gap-1.5" title={`Chủ nhà thắng: ${home}%`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bangMau.accent }} />
            <span>Nhà <strong style={{ color: bangMau.text }}>{home}%</strong></span>
          </span>
          <span className="flex items-center gap-1.5" title={`Hai đội hòa: ${draw}%`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bangMau.probDraw }} />
            <span>Hòa <strong style={{ color: bangMau.text }}>{draw}%</strong></span>
          </span>
          <span className="flex items-center gap-1.5" title={`Đội khách thắng: ${away}%`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bangMau.probAway }} />
            <span>Khách <strong style={{ color: bangMau.text }}>{away}%</strong></span>
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
  const { data: matches = [] } = useMatches({ date: today, sport });
  const danhSachTranDauSapToi: TranDau[] = matches.slice(0, 3).map((match) => ({
    league: match.league,
    home: match.homeTeam.name,
    away: match.awayTeam.name,
    time: new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(match.kickoffTime)),
    probHome: match.prediction?.homeWinProb ?? 0,
    probDraw: match.prediction?.drawProb ?? 0,
    probAway: match.prediction?.awayWinProb ?? 0,
  }));

  return (
    <div
      className="min-h-screen w-full max-w-full font-sans antialiased overflow-x-hidden"
      style={{ backgroundColor: bangMau.bg, color: bangMau.text }}
    >
      {/* Thanh điều hướng dùng chung toàn ứng dụng */}
      <Navbar />

      {/* Phần Hero - Giới thiệu dịch vụ */}
      <section className="relative mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 xl:px-12 min-h-[calc(100vh-64px)] flex flex-col justify-center py-10 lg:py-16">
        <div className="relative grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-[1fr_auto] items-center justify-between">
          {/* Cột bên trái: Tiêu đề & mô tả */}
          <div className="flex flex-col justify-center text-center sm:text-left max-w-xl xl:max-w-2xl">
            <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[52px] 2xl:text-[58px]">
              Cảm xúc là của người hâm mộ, con số là của chúng tôi.
            </h1>
            <p
              className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-[18px] leading-relaxed mx-auto sm:mx-0 font-normal"
              style={{ color: bangMau.textMuted }}
            >
              Mỗi trận đấu được chấm điểm từ dữ liệu thật: phong độ gần đây, Elo
              rating, hiệu suất sân nhà/sân khách. Sai số của mô hình được đo và
              tính toán rõ ràng.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5 justify-center sm:justify-start">
              <Link
                href="/matches"
                className="relative z-20 rounded-lg px-7 py-3.5 sm:px-8 sm:py-4 text-base font-bold transition-all hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-lg text-center shadow-[#2FD98C]/20"
                style={{ backgroundColor: bangMau.accent, color: bangMau.bg }}
              >
                Xem trận hôm nay
              </Link>
              <a
                href="#accuracy"
                className="relative z-20 rounded-lg border px-7 py-3.5 sm:px-8 sm:py-4 text-base font-semibold transition-all hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] text-center"
                style={{ borderColor: bangMau.border, color: bangMau.text }}
              >
                Xem độ chính xác mô hình
              </a>
            </div>
          </div>

          {/* Cột bên phải: Cụm Bảng Danh sách trận + 2 cầu thủ 2 bên (Dời vào trong để Ronaldo hiển thị trọn vẹn) */}
          <div className="flex justify-center items-center w-full lg:w-auto lg:mr-14 xl:mr-20 2xl:mr-24">
            <div className="relative w-full sm:w-[350px] lg:w-[360px] xl:w-[380px]">
              {/* Cầu thủ bên trái (Messi / LeBron) — Nằm hoàn toàn bên ngoài mép trái */}
              <div className="hidden xl:block absolute right-[calc(100%+10px)] bottom-0 z-10 w-36 xl:w-40 pointer-events-none transition-transform duration-300 hover:scale-105">
                <img
                  src={sport === "basketball" ? "/img/lebron.png" : "/img/messi.png"}
                  alt={sport === "basketball" ? "LeBron James" : "Lionel Messi"}
                  className="w-full h-auto object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]"
                />
              </div>

              {/* Bảng Danh sách trận sắp diễn ra */}
              <div
                className="relative z-10 w-full rounded-2xl border p-5 sm:p-6 shadow-2xl backdrop-blur-md"
                style={{ borderColor: bangMau.border, backgroundColor: bangMau.panel }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold tracking-wide" style={{ color: bangMau.textMuted }}>
                    Trận sắp diễn ra
                  </span>
                  <span
                    className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-red-500/10"
                    style={{ color: bangMau.live }}
                  >
                    <span
                      className="h-2 w-2 animate-pulse rounded-full"
                      style={{ backgroundColor: bangMau.live }}
                    />
                    hôm nay
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

              {/* Cầu thủ bên phải (Ronaldo / Curry) — Nằm hoàn toàn bên ngoài mép phải */}
              <div className={`hidden xl:block absolute left-[calc(100%+10px)] bottom-0 z-10 pointer-events-none transition-transform duration-300 hover:scale-105 ${sport === "basketball" ? "w-44 xl:w-48" : "w-36 xl:w-40"}`}>
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
        className="border-y"
        style={{ borderColor: bangMau.borderSoft, backgroundColor: bangMau.panelAlt }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 px-4 sm:px-6 py-12 md:py-16 sm:grid-cols-3">
          {/* Card thống kê 1 — Độ chính xác */}
          <div
            className="group relative rounded-xl border p-5 sm:p-6 transition-all duration-300 hover:border-[#2FD98C]/40 hover:shadow-[0_0_30px_rgba(47,217,140,0.08)]"
            style={{
              borderColor: bangMau.border,
              backgroundColor: "rgba(22,27,35,0.5)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#2FD98C]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            <div className="relative z-10">
              <div className="font-mono text-3xl font-bold tracking-tight" style={{ color: bangMau.accent }}>
                55.4%
              </div>
              <div className="mt-2 text-sm font-medium" style={{ color: bangMau.textMuted }}>
                Độ chính xác 36 ngày qua
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: bangMau.textFaint }}>
                Tỷ lệ dự đoán đúng kết quả (Thắng/Hòa/Thua) trong 1 tháng gần nhất.
              </p>
            </div>
          </div>

          {/* Card thống kê 2 — Brier Score với giải thích */}
          <div
            className="group relative rounded-xl border p-5 sm:p-6 transition-all duration-300 hover:border-[#2FD98C]/40 hover:shadow-[0_0_30px_rgba(47,217,140,0.08)]"
            style={{
              borderColor: bangMau.border,
              backgroundColor: "rgba(22,27,35,0.5)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#2FD98C]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-3xl font-bold tracking-tight" style={{ color: bangMau.accent }}>
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

              <div className="mt-2 text-sm font-medium" style={{ color: bangMau.textMuted }}>
                Brier Score trung bình
              </div>

              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: bangMau.textFaint }}>
                Đo lường sai số dự đoán (từ 0 đến 1). <strong className="text-emerald-400 font-normal">Càng thấp càng chính xác</strong> (dưới 0.25 là mô hình tốt).
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
            className="group relative rounded-xl border p-5 sm:p-6 transition-all duration-300 hover:border-[#2FD98C]/40 hover:shadow-[0_0_30px_rgba(47,217,140,0.08)]"
            style={{
              borderColor: bangMau.border,
              backgroundColor: "rgba(22,27,35,0.5)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#2FD98C]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            <div className="relative z-10">
              <div className="font-mono text-3xl font-bold tracking-tight" style={{ color: bangMau.accent }}>
                1.240
              </div>
              <div className="mt-2 text-sm font-medium" style={{ color: bangMau.textMuted }}>
                Trận đấu đã theo dõi
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: bangMau.textFaint }}>
                Tổng số trận đấu được kiểm chứng và lưu trữ dữ liệu công khai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quy trình hoạt động (How it works) */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24">
        <h2 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
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
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Lịch thi đấu hôm nay</h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: bangMau.textMuted }}>
              Tỷ lệ dự đoán xác suất Thắng - Hòa - Thua trực quan theo thời gian thực <span className="sm:hidden text-emerald-400 font-mono text-[11px]">(Vuốt ngang để xem)</span>
            </p>
          </div>
          <Link href="/matches" className="text-sm font-medium hover:underline shrink-0" style={{ color: bangMau.accent }}>
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
                ten: "Trần Hoàng Nam",
                vaiTro: "Data Analyst & Fan Ngoại Hạng Anh",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Điểm mình ưng ý nhất ở IKNOWBALL là tính minh bạch. Họ công khai Brier Score và Log Loss chứ không 'nổ' tỷ lệ thắng 100% như các hội nhóm. Mô hình Elo tính sân nhà/khách cực kỳ sát thực tế.",
                tag: "Premier League",
                xepHang: 5,
              },
              {
                ten: "Nguyễn Minh Đức",
                vaiTro: "Chuyên đọc sách thể thao",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Thanh xác suất 3 màu phân tách Nhà - Hòa - Khách rất trực quan. Mình thường dùng chỉ số xác suất này để so sánh với Odds nhà cái, tìm ra các kèo Value Bet có kỳ vọng dương.",
                tag: "La Liga & UCL",
                xepHang: 5,
              },
              {
                ten: "Lê Quang Huy",
                vaiTro: "Người theo dõi NBA & Thể thao Mỹ",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Chuyển đổi giữa Bóng đá và Bóng rổ rất mượt. Dữ liệu các trận đấu NBA cập nhật chuẩn xác, giúp việc phân tích phong độ các đội trước giờ bóng lăn nhàn hơn rất nhiều.",
                tag: "NBA Basketball",
                xepHang: 5,
              },
              {
                ten: "Phạm Hải Đăng",
                vaiTro: "Kỹ sư phần mềm & Fan Serie A",
                avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Giao diện Dark Mode đẹp và tốc độ tải trang cực nhanh. Không có quảng cáo rác hay banner cá cược phiền toái, thuần túy là dữ liệu và thống kê sạch sẽ.",
                tag: "Serie A & Calcio",
                xepHang: 5,
              },
              {
                ten: "Vũ Bảo Ngọc",
                vaiTro: "Chuyên viên thống kê tài chính",
                avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Rất ấn tượng với cách giải thích Brier Score của website. Đây là tiêu chuẩn vàng trong xác suất dự báo thời tiết và tài chính, giờ được áp dụng cho thể thao rất chuẩn.",
                tag: "Data Science",
                xepHang: 5,
              },
              {
                ten: "Đỗ Quốc Cường",
                vaiTro: "Quản trị viên cộng đồng Bóng rổ",
                avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Theo dõi tỷ lệ dự đoán chuỗi trận Play-offs NBA từ mùa trước đến nay thấy mô hình dự đoán rất ổn định, đặc biệt là những trận derby căng thẳng.",
                tag: "Basketball Pro",
                xepHang: 5,
              },
              // Nhân đôi danh sách:
              {
                ten: "Trần Hoàng Nam",
                vaiTro: "Data Analyst & Fan Ngoại Hạng Anh",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Điểm mình ưng ý nhất ở IKNOWBALL là tính minh bạch. Họ công khai Brier Score và Log Loss chứ không 'nổ' tỷ lệ thắng 100% như các hội nhóm. Mô hình Elo tính sân nhà/khách cực kỳ sát thực tế.",
                tag: "Premier League",
                xepHang: 5,
              },
              {
                ten: "Nguyễn Minh Đức",
                vaiTro: "Bettor thể thao bán chuyên",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Thanh xác suất 3 màu phân tách Nhà - Hòa - Khách rất trực quan. Mình thường dùng chỉ số xác suất này để so sánh với Odds nhà cái, tìm ra các kèo Value Bet có kỳ vọng dương.",
                tag: "La Liga & UCL",
                xepHang: 5,
              },
              {
                ten: "Lê Quang Huy",
                vaiTro: "Người theo dõi NBA & Thể thao Mỹ",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Chuyển đổi giữa Bóng đá và Bóng rổ rất mượt. Dữ liệu các trận đấu NBA cập nhật chuẩn xác, giúp việc phân tích phong độ các đội trước giờ bóng lăn nhàn hơn rất nhiều.",
                tag: "NBA Basketball",
                xepHang: 5,
              },
              {
                ten: "Phạm Hải Đăng",
                vaiTro: "Kỹ sư phần mềm & Fan Serie A",
                avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Giao diện Dark Mode đẹp và tốc độ tải trang cực nhanh. Không có quảng cáo rác hay banner cá cược phiền toái, thuần túy là dữ liệu và thống kê sạch sẽ.",
                tag: "Serie A & Calcio",
                xepHang: 5,
              },
              {
                ten: "Vũ Bảo Ngọc",
                vaiTro: "Chuyên viên thống kê tài chính",
                avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
                noiDung:
                  "Rất ấn tượng với cách giải thích Brier Score của website. Đây là tiêu chuẩn vàng trong xác suất dự báo thời tiết và tài chính, giờ được áp dụng cho thể thao rất chuẩn.",
                tag: "Data Science",
                xepHang: 5,
              },
              {
                ten: "Đỗ Quốc Cường",
                vaiTro: "Quản trị viên cộng đồng Bóng rổ",
                avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
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
              href="/matches"
              className="w-full sm:w-auto rounded-md border px-7 py-3 text-sm font-medium transition-all duration-200 hover:bg-white/5 hover:border-white/40 text-center"
              style={{ borderColor: bangMau.border, color: bangMau.text }}
            >
              Xem lịch thi đấu
            </Link>
          </div>
        </div>
      </section>

      {/* Chân trang (Footer) dùng chung toàn hệ thống */}
      <Footer />
    </div>
  );
}
