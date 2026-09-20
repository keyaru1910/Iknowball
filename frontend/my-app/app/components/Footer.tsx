import Link from "next/link";
import { colors } from "../lib/design-tokens";

// Icon mạng xã hội cho Footer
function IconFacebook() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

/**
 * Component chân trang (Footer) nâng cấp toàn diện cho toàn bộ hệ thống iKnowBall
 */
export default function Footer() {
  return (
    <footer
      className="mt-auto border-t"
      style={{ borderColor: colors.borderSoft, backgroundColor: colors.bg }}
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Phần 1: Hệ thống cột (Grid 4 cột) */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Cột 1: Logo & Brand Statement (chiếm 2 cột trên màn hình lớn) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-90">
              <img
                src="/img/favicon.png"
                alt="iKnowBall Logo"
                className="h-8 w-8 rounded-lg object-contain shadow-sm"
              />
              <span className="text-xl font-bold tracking-tight text-white">
                iKnow<span style={{ color: colors.accent }}>Ball</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-sm" style={{ color: colors.textMuted }}>
              iKnowBall — Nền tảng phân tích và dự đoán bóng đá dựa trên mô hình Data Science chuyên sâu. Cung cấp dữ liệu xác suất khách quan, loại bỏ cảm tính cá nhân.
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs" style={{ color: colors.textFaint }}>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống dự đoán AI hoạt động 24/7</span>
            </div>
          </div>

          {/* Cột 2: Sản phẩm / Tính năng */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Sản phẩm
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/predictions"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Dự đoán hôm nay
                </Link>
              </li>
              <li>
                <Link
                  href="/predictions/performance"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Hiệu năng mô hình AI
                </Link>
              </li>
              <li>
                <Link
                  href="/news"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Tin tức & Nhận định
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Gói dịch vụ Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Tài nguyên / Phương pháp */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Tài nguyên
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/api-data"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  API Data
                </Link>
              </li>
              <li>
                <Link
                  href="/brier-score"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Brier Score là gì?
                </Link>
              </li>
              <li>
                <Link
                  href="/log-loss"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Thuật toán Log Loss
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Blog phân tích
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Chính sách & Pháp lý */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Pháp lý
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="transition-colors hover:text-white"
                  style={{ color: colors.textMuted }}
                >
                  Miễn trừ trách nhiệm
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Phần 2: Phân cách & Bottom Bar */}
        <div
          className="mt-12 flex flex-col items-start justify-between gap-6 border-t pt-8 sm:flex-row sm:items-center text-xs"
          style={{ borderColor: colors.borderSoft }}
        >
          {/* Bản quyền & Cảnh báo */}
          <div className="space-y-1.5">
            <p style={{ color: colors.textMuted }}>
              © 2026 <span className="font-medium text-white">iKnowBall</span>. Số liệu chỉ mang tính tham khảo.
            </p>
            <p className="text-amber-500/90 font-medium">
              Cảnh báo: Không khuyến khích cá cược dưới mọi hình thức.
            </p>
          </div>

          {/* Nhóm icon mạng xã hội */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/lam.keyaru"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md transition-all duration-200 hover:bg-white/5 hover:scale-110"
              style={{ color: colors.textFaint }}
              title="Facebook"
              aria-label="Theo dõi iKnowBall trên Facebook"
            >
              <span className="hover:text-[#1877F2] transition-colors"><IconFacebook /></span>
            </a>
            <a
              href="https://x.com/keyaru_tran"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md transition-all duration-200 hover:bg-white/5 hover:scale-110"
              style={{ color: colors.textFaint }}
              title="X (Twitter)"
              aria-label="Theo dõi iKnowBall trên X"
            >
              <span className="hover:text-white transition-colors"><IconX /></span>
            </a>
            <a
              href="https://github.com/keyaru1910/Iknowball"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md transition-all duration-200 hover:bg-white/5 hover:scale-110"
              style={{ color: colors.textFaint }}
              title="GitHub"
              aria-label="Xem mã nguồn trên GitHub"
            >
              <span className="hover:text-white transition-colors"><IconGitHub /></span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
