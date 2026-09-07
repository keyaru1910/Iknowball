import { colors } from "../lib/design-tokens";

/**
 * Component chân trang (Footer) dùng chung
 */
export default function Footer() {
  return (
    <footer
      className="mt-auto border-t"
      style={{ borderColor: colors.borderSoft, backgroundColor: colors.bg }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row text-xs">
        <div className="flex items-center gap-2">
          <img
            src="/img/fasvicon.png"
            alt="iKnowBall Logo"
            className="h-5 w-5 rounded object-contain"
          />
          <span style={{ color: colors.textMuted }}>
            © {new Date().getFullYear()} iKnowBall — Nền tảng phân tích & dự đoán xác suất thể thao
          </span>
        </div>

        <div className="flex items-center gap-6" style={{ color: colors.textFaint }}>
          <span>Dữ liệu thời gian thực từ Sports API</span>
          <span>•</span>
          <span>Không khuyến khích cá cược</span>
        </div>
      </div>
    </footer>
  );
}
