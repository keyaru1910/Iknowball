"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import SportSwitcher from "./SportSwitcher";
import { useMatches } from "../hooks/useMatches";
import { useSport } from "../context/SportContext";

// Hệ màu chủ đạo (Dark theme & Accent Green, Draw Neutral, Away Coral Red) dùng cho Landing Page
const bangMau = {
  bg: "#0B0E13",
  panel: "#12161D",
  panelAlt: "#161B23",
  border: "#232935",
  borderSoft: "#1B2029",
  text: "#EDEFF3",
  textMuted: "#8890A0",
  textFaint: "#565E6C",
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
      className="min-h-screen w-full font-sans antialiased overflow-x-hidden"
      style={{ backgroundColor: bangMau.bg, color: bangMau.text }}
    >
      {/* Thanh điều hướng dùng chung toàn ứng dụng */}
      <Navbar />

      {/* Phần Hero - Giới thiệu dịch vụ */}
      <section className="relative mx-auto max-w-7xl px-6 lg:px-20 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-[1fr_420px] items-center">
          {/* Cột bên trái: Tiêu đề & mô tả */}
          <div className="flex flex-col justify-center">
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
              Nhìn thể thao qua con số, không qua cảm xúc.
            </h1>
            <p
              className="mt-6 max-w-md text-[15px] leading-relaxed"
              style={{ color: bangMau.textMuted }}
            >
              Mỗi trận đấu được chấm điểm từ dữ liệu thật: phong độ gần đây, Elo
              rating, hiệu suất sân nhà/sân khách. Sai số của mô hình được đo và
              công khai rõ ràng.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/matches"
                className="relative z-20 rounded-sm px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: bangMau.accent, color: bangMau.bg }}
              >
                Xem trận hôm nay
              </Link>
              <a
                href="#accuracy"
                className="relative z-20 text-sm underline-offset-4 hover:underline"
                style={{ color: bangMau.textMuted }}
              >
                Xem độ chính xác mô hình
              </a>
            </div>
          </div>

          {/* Cột bên phải: cầu thủ đổi theo môn thể thao đang chọn. */}
          <div className="relative -translate-x-5 xl:-translate-x-9 transition-transform duration-300">
            {/* Cầu thủ bên trái chỉ vào bảng dự đoán. */}
            <div className="hidden lg:block absolute right-full bottom-1 mr-2 xl:mr-3 z-10 w-40 xl:w-44 pointer-events-none transition-transform duration-300 hover:scale-105">
              <img
                src={sport === "basketball" ? "/img/lebron.png" : "/img/messi.png"}
                alt={sport === "basketball" ? "LeBron James" : "Lionel Messi"}
                className="w-full h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* Bảng Danh sách trận sắp diễn ra */}
            <div
              className="relative z-20 min-h-[320px] rounded-sm border p-5 shadow-2xl backdrop-blur-sm"
              style={{ borderColor: bangMau.border, backgroundColor: bangMau.panel }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: bangMau.textMuted }}>
                  Trận sắp diễn ra
                </span>
                <span
                  className="flex items-center gap-1.5 text-[11px] font-mono"
                  style={{ color: bangMau.live }}
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full"
                    style={{ backgroundColor: bangMau.live }}
                  />
                  hôm nay
                </span>
              </div>

              {danhSachTranDauSapToi.length === 0 ? (
                <div className="flex min-h-[237px] items-center justify-center rounded-sm border border-dashed px-4 text-center text-sm" style={{ borderColor: bangMau.borderSoft, color: bangMau.textMuted }}>
                  Chưa có trận nào hôm nay
                </div>
              ) : (
                <div className="flex flex-col divide-y" style={{ borderColor: bangMau.borderSoft }}>
                  {danhSachTranDauSapToi.map((tranDau, idx) => (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0" style={{ borderColor: bangMau.borderSoft }}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: bangMau.textFaint }}>
                          {tranDau.league}
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: bangMau.textFaint }}>
                          {tranDau.time}
                        </span>
                      </div>
                      <div className="mb-2.5 flex items-center justify-between text-[14px]">
                        <span className="font-medium">{tranDau.home}</span>
                        <span className="text-xs" style={{ color: bangMau.textFaint }}>vs</span>
                        <span className="font-medium">{tranDau.away}</span>
                      </div>
                      <ThanhXacSuat home={tranDau.probHome} draw={tranDau.probDraw} away={tranDau.probAway} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cầu thủ bên phải chỉ vào bảng dự đoán. Curry rộng hơn để giữ tỷ lệ ảnh gốc. */}
            <div className={`hidden lg:block absolute left-full bottom-1 ml-2 xl:ml-3 z-10 pointer-events-none transition-transform duration-300 hover:scale-105 ${sport === "basketball" ? "w-56 xl:w-64" : "w-40 xl:w-44"}`}>
              <img
                src={sport === "basketball" ? "/img/curry.png" : "/img/ronaldo.png"}
                alt={sport === "basketball" ? "Stephen Curry" : "Cristiano Ronaldo"}
                className="w-full h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Phần Thống kê độ chính xác (Bổ sung Microcopy giải thích Brier Score) */}
      <section
        id="accuracy"
        className="border-y"
        style={{ borderColor: bangMau.borderSoft, backgroundColor: bangMau.panelAlt }}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3">
          {/* Thống kê 1 */}
          <div>
            <div className="font-mono text-3xl font-semibold" style={{ color: bangMau.accent }}>
              55.4%
            </div>
            <div className="mt-1.5 text-sm" style={{ color: bangMau.textMuted }}>
              Độ chính xác 36 ngày qua
            </div>
            <p className="mt-1 text-[12px]" style={{ color: bangMau.textFaint }}>
              Tỷ lệ dự đoán đúng kết quả (Thắng/Hòa/Thua) trong 1 tháng gần nhất.
            </p>
          </div>

          {/* Thống kê 2 - Brier Score có giải thích rõ ràng */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="font-mono text-3xl font-semibold" style={{ color: bangMau.accent }}>
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

            <div className="mt-1.5 flex items-center gap-1.5 text-sm" style={{ color: bangMau.textMuted }}>
              <span>Brier Score trung bình</span>
            </div>

            {/* Microcopy giải thích cực ngắn & rõ ràng */}
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: bangMau.textFaint }}>
              Đo lường sai số dự đoán (từ 0 đến 1). <strong className="text-emerald-400 font-normal">Càng thấp càng chính xác</strong> (dưới 0.25 là mô hình tốt).
            </p>

            {/* Popover/Tooltip chi tiết khi click nút (?) */}
            {hienGiaiThichBrier && (
              <div
                className="absolute top-12 left-0 z-30 w-72 rounded-sm border p-3 text-xs shadow-xl backdrop-blur-md"
                style={{ borderColor: bangMau.border, backgroundColor: bangMau.panel, color: bangMau.text }}
              >
                <div className="flex justify-between items-center mb-1 font-semibold text-emerald-400">
                  <span>💡 Brier Score là gì?</span>
                  <button onClick={() => setHienGiaiThichBrier(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <p className="leading-relaxed text-gray-300">
                  Brier Score đánh giá khoảng cách giữa xác suất dự đoán và kết quả thực tế. Điểm số 0 nghĩa là dự đoán hoàn hảo 100%, 0.21 chứng tỏ mô hình có độ tin cậy rất cao.
                </p>
              </div>
            )}
          </div>

          {/* Thống kê 3 */}
          <div>
            <div className="font-mono text-3xl font-semibold" style={{ color: bangMau.accent }}>
              1.240
            </div>
            <div className="mt-1.5 text-sm" style={{ color: bangMau.textMuted }}>
              Trận đấu đã theo dõi
            </div>
            <p className="mt-1 text-[12px]" style={{ color: bangMau.textFaint }}>
              Tổng số trận đấu được kiểm chứng và lưu trữ dữ liệu công khai.
            </p>
          </div>
        </div>
      </section>

      {/* Quy trình hoạt động (How it works) */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="max-w-lg text-2xl font-semibold tracking-tight md:text-3xl">
          Từ dữ liệu thô đến một con số xác suất
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {[
            {
              buoc: "1",
              tieuDe: "Thu thập dữ liệu thật",
              noiDung: "Đồng bộ tự động lịch thi đấu, kết quả và thống kê từ API-Football, chuẩn hóa về một định dạng chung.",
            },
            {
              buoc: "2",
              tieuDe: "Tính điểm sức mạnh",
              noiDung: "Elo rating được cập nhật sau mỗi trận, kết hợp phong độ gần đây và hiệu suất sân nhà/sân khách.",
            },
            {
              buoc: "3",
              tieuDe: "Dự đoán & đánh giá công khai",
              noiDung: "Mô hình đưa ra xác suất thắng/hòa/thua, sai số đo bằng Log Loss và Brier Score sau mỗi trận.",
            },
          ].map((buocXuly, idx) => (
            <div key={idx} className="border-t pt-5" style={{ borderColor: bangMau.border }}>
              <span className="font-mono text-xs" style={{ color: bangMau.accent }}>
                {buocXuly.buoc}
              </span>
              <h3 className="mt-3 text-[15px] font-medium">{buocXuly.tieuDe}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: bangMau.textMuted }}>
                {buocXuly.noiDung}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bảng xem trước lịch thi đấu (Bổ sung hiển thị Xác suất dự đoán vào từng dòng) */}
      <section id="matches" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Lịch thi đấu hôm nay</h2>
            <p className="text-xs mt-1" style={{ color: bangMau.textMuted }}>
              Tỷ lệ dự đoán xác suất Thắng - Hòa - Thua trực quan theo thời gian thực
            </p>
          </div>
          <Link href="/matches" className="text-sm hover:underline" style={{ color: bangMau.textMuted }}>
            Xem tất cả
          </Link>
        </div>

        <div className="border-t overflow-x-auto" style={{ borderColor: bangMau.border }}>
          {/* Header Bảng */}
          <div
            className="grid min-w-[650px] grid-cols-[70px_1.2fr_1.2fr_220px_100px] gap-4 border-b py-3 text-[11px] font-medium"
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
              className="grid min-w-[650px] grid-cols-[70px_1.2fr_1.2fr_220px_100px] items-center gap-4 border-b py-4 text-[14px] transition-colors hover:bg-white/[0.02]"
              style={{ borderColor: bangMau.borderSoft }}
            >
              <span className="font-mono text-[13px]" style={{ color: bangMau.textMuted }}>
                {tranDau.time}
              </span>
              <span className="font-medium">{tranDau.home}</span>
              <span className="font-medium">{tranDau.away}</span>
              {/* Tái sử dụng ThanhXacSuat trong từng dòng bảng */}
              <div>
                <ThanhXacSuat
                  home={tranDau.probHome}
                  draw={tranDau.probDraw}
                  away={tranDau.probAway}
                  hienThiChuGiai={true}
                />
              </div>
              <span className="text-right text-[12px]" style={{ color: bangMau.textFaint }}>
                {tranDau.league}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Bổ sung Banner Call-to-Action (CTA) phụ ở cuối trang trước Footer */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div
          className="relative overflow-hidden rounded-md border p-8 md:p-12 text-center"
          style={{ borderColor: bangMau.border, backgroundColor: bangMau.panel }}
        >
          {/* Vùng tạo hiệu ứng ánh sáng gradient làm điểm nhấn */}
          <div
            className="absolute -top-24 -left-24 h-64 w-64 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ backgroundColor: bangMau.accent }}
          />
          <div
            className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ backgroundColor: bangMau.probAway }}
          />

          <h2 className="relative z-10 text-2xl font-bold tracking-tight md:text-3xl max-w-2xl mx-auto leading-snug">
            Bắt đầu theo dõi dự đoán bóng đá bằng dữ liệu ngay hôm nay
          </h2>
          <p
            className="relative z-10 mx-auto mt-3 max-w-xl text-sm leading-relaxed"
            style={{ color: bangMau.textMuted }}
          >
            Trải nghiệm nền tảng phân tích thể thao chuẩn Data Science. Đăng ký tài khoản miễn phí để mở khóa toàn bộ số liệu và dự đoán chuyên sâu.
          </p>

          <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-sm px-6 py-3 text-sm font-semibold transition-all hover:opacity-90 shadow-md"
              style={{ backgroundColor: bangMau.accent, color: bangMau.bg }}
            >
              Tạo tài khoản miễn phí
            </Link>
            <Link
              href="/matches"
              className="rounded-sm border px-6 py-3 text-sm font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: bangMau.border, color: bangMau.text }}
            >
              Xem lịch thi đấu
            </Link>
          </div>
        </div>
      </section>

      {/* Chân trang (Footer) */}
      <footer className="border-t" style={{ borderColor: bangMau.borderSoft }}>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <img
              src="/img/fasvicon.png"
              alt="iKnowBall Logo"
              className="h-6 w-6 object-contain rounded-md"
            />
            <span style={{ color: bangMau.textMuted }}>iKnowBall — dự đoán dựa trên dữ liệu</span>
          </Link>
          <span style={{ color: bangMau.textFaint }}>Số liệu chỉ mang tính tham khảo</span>
        </div>
      </footer>
    </div>
  );
}
