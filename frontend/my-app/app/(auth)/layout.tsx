import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập — iKnowBall",
  description: "Đăng nhập vào iKnowBall để truy cập dự đoán bóng đá thông minh.",
};

/**
 * Layout tối giản cho các trang xác thực (login / register).
 * Không có Navbar hoặc Footer — giúp người dùng tập trung vào form.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07090E] text-[#EDEFF3] flex items-center justify-center relative overflow-hidden">
      {/* Hình nền gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(47,217,140,0.12) 0%, transparent 60%)",
        }}
      />
      {/* Lưới dot pattern mờ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
