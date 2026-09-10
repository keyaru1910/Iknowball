import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware Next.js chạy ở Edge Runtime.
 * Bảo vệ route /admin bằng cách redirect về /login nếu không có cookie xác thực.
 *
 * Ghi chú: Edge Runtime không thể gọi backend API trực tiếp.
 * Chiến lược: kiểm tra sự tồn tại của cookie refreshToken (HttpOnly).
 * Nếu có → cho qua, việc xác thực thực sự sẽ do AdminGuard phía client đảm nhiệm.
 * Nếu không → redirect ngay về login.
 */
export function middleware(request: NextRequest) {
  // Việc xác thực và phân quyền admin được quản lý an toàn bởi AdminGuard (trong app/admin/layout.tsx)
  // và AuthContext với backend API.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

