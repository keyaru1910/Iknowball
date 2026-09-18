"use client";

import React from "react";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="border-b pb-6 space-y-2" style={{ borderColor: colors.borderSoft }}>
        <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">
          Pháp Lý & Bảo Mật
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Chính Sách Bảo Mật (Privacy Policy)
        </h1>
        <p className="text-xs text-neutral-400">
          Cập nhật lần cuối: Ngày 18 tháng 09 năm 2026 • Tuân thủ các nguyên tắc bảo vệ dữ liệu cá nhân
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm leading-relaxed text-neutral-300">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Cam Kết Quyền Riêng Tư Của iKnowBall</h2>
          <p>
            Tại iKnowBall, chúng tôi coi trọng sự riêng tư và bảo mật dữ liệu của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của bạn khi bạn sử dụng nền tảng của chúng tôi.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Các Dữ Liệu Chúng Tôi Thu Thập</h2>
          <div className="space-y-2 text-xs sm:text-sm">
            <p><strong>a. Thông tin bạn cung cấp trực tiếp:</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li>Địa chỉ email, tên hiển thị khi tạo tài khoản người dùng hoặc đăng ký gói VIP.</li>
              <li>Thông tin thanh toán (được xử lý trực tiếp và mã hóa an toàn qua đối tác cổng thanh toán được cấp phép, chúng tôi không lưu giữ thông tin thẻ ngân hàng của bạn).</li>
            </ul>

            <p className="pt-2"><strong>b. Thông tin tự động thu thập (Log Data & Cookies):</strong></p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li>Địa chỉ IP, loại trình duyệt, hệ điều hành, thời gian truy cập các trang dự đoán thể thao.</li>
              <li>Lịch sử tương tác API và tần suất gửi yêu cầu để kiểm soát giới hạn Rate Limits.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Mục Đích Sử Dụng Thông Tin</h2>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>Cung cấp, duy trì và cải thiện độ chính xác của các thuật toán dự đoán AI.</li>
            <li>Xác thực quyền truy cập các tính năng VIP Insights và cấp phát API Key.</li>
            <li>Gửi thông báo cập nhật hệ thống, cảnh báo tỷ số hoặc bản tin phân tích thể thao (bạn có thể hủy đăng ký bất kỳ lúc nào).</li>
            <li>Phát hiện và ngăn chặn các hành vi tấn công DDoS, gian lận hoặc lạm dụng tài nguyên máy chủ.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Chia Sẻ Thông Tin Với Bên Thứ Ba</h2>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs leading-relaxed">
            <strong>CAM KẾT TUYỆT ĐỐI:</strong> Chúng tôi <u>KHÔNG BAO GIỜ</u> bán, trao đổi hoặc cho thuê thông tin cá nhân của bạn cho bất kỳ công ty quảng cáo hoặc bên thứ ba nào vì mục đích thương mại.
          </div>
          <p className="text-xs text-neutral-400">
            Thông tin chỉ được chia sẻ trong phạm vi cần thiết cho các nhà cung cấp hạ tầng tin cậy (như Cloudflare, AWS, đơn vị gửi email giao dịch) nhằm mục đích vận hành kỹ thuật.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Quyền Của Bạn Đối Với Dữ Liệu Cá Nhân</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li><strong>Quyền truy cập và chỉnh sửa:</strong> Bạn có thể xem và cập nhật hồ sơ cá nhân trong trang cài đặt.</li>
            <li><strong>Quyền xóa dữ liệu (Right to be Forgotten):</strong> Bạn có quyền yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan khỏi cơ sở dữ liệu của chúng tôi bằng cách gửi yêu cầu đến email hỗ trợ.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Bảo Mật Dữ Liệu</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Chúng tôi áp dụng các tiêu chuẩn bảo mật hàng đầu ngành, bao gồm mã hóa đường truyền HTTPS/TLS 1.3, mã hóa một chiều mật khẩu với thuật toán Bcrypt, xác thực JWT an toàn và phân quyền kiểm soát nghiêm ngặt đối với cơ sở dữ liệu.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Liên Hệ Bộ Phận Bảo Mật Dữ Liệu</h2>
          <p className="text-xs">
            Nếu bạn có bất kỳ câu hỏi hoặc khiếu nại nào về chính sách bảo mật, xin vui lòng liên hệ Ban Quản Trị iKnowBall tại: <span className="text-emerald-400 font-mono">privacy@iknowball.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
