"use client";

import React from "react";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="border-b pb-6 space-y-2" style={{ borderColor: colors.borderSoft }}>
        <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">
          Pháp Lý & Điều Khoản
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Điều Khoản Dịch Vụ (Terms of Service)
        </h1>
        <p className="text-xs text-neutral-400">
          Cập nhật lần cuối: Ngày 18 tháng 09 năm 2026 • Phiên bản 2.1
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-sm leading-relaxed text-neutral-300">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Chấp Nhận Điều Khoản</h2>
          <p>
            Chào mừng bạn đến với <strong>iKnowBall</strong> (“chúng tôi”, “hệ thống”, “nền tảng”). Bằng việc truy cập, tạo tài khoản hoặc sử dụng bất kỳ tính năng, công cụ hay dịch vụ API nào của iKnowBall, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý chịu sự ràng buộc của các Điều khoản Dịch vụ này cùng Chính sách Bảo mật của chúng tôi.
          </p>
          <p>
            Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng ngừng sử dụng dịch vụ của chúng tôi ngay lập tức.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Bản Chất Dịch Vụ Của iKnowBall</h2>
          <p>
            iKnowBall là một nền tảng công nghệ cung cấp công cụ phân tích dữ liệu, thống kê xác suất thể thao và mô phỏng Machine Learning.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
            <strong>LƯU Ý QUAN TRỌNG:</strong> iKnowBall <u>KHÔNG PHẢI</u> là nhà cái, trang cá cược, sòng bạc trực tuyến hay đơn vị tổ chức/môi giới đánh bạc dưới mọi hình thức. Mọi thông tin, chỉ số xác suất, dự báo tỷ số và nhận định AI được cung cấp hoàn toàn phục vụ mục đích học thuật, nghiên cứu khoa học dữ liệu và giải trí cho người hâm mộ thể thao.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Tài Khoản Người Dùng & Bảo Mật</h2>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>Bạn có trách nhiệm bảo mật mật khẩu, API Key và mọi hoạt động diễn ra dưới tài khoản của bạn.</li>
            <li>Bạn phải cung cấp thông tin email chính xác và cập nhật khi đăng ký tài khoản.</li>
            <li>Nghiêm cấm chia sẻ chung tài khoản hoặc bán lại API Key cho bên thứ ba khi chưa có sự đồng ý bằng văn bản của iKnowBall.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Gói Dịch Vụ VIP Insights & Thanh Toán</h2>
          <p>
            Một số tính năng nâng cao (như nhận định chuyên sâu từ Gemini AI, xuất dữ liệu CSV/API không giới hạn) yêu cầu nâng cấp gói <strong>VIP Insights</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li><strong>Thanh toán:</strong> Phí dịch vụ được tính định kỳ (hàng tháng hoặc hàng năm) theo biểu giá công bố tại trang <Link href="/pricing" className="text-emerald-400 hover:underline">Bảng Giá</Link>.</li>
            <li><strong>Chính sách hoàn tiền:</strong> Do tính chất dữ liệu số được cung cấp tức thời, iKnowBall hỗ trợ hoàn tiền trong vòng 48 giờ đầu tiên kể từ thời điểm nâng cấp nếu hệ thống phát sinh lỗi kỹ thuật nghiêm trọng không thể khắc phục.</li>
            <li><strong>Hủy gói:</strong> Bạn có thể hủy gia hạn gói VIP bất cứ lúc nào trong trang Cài Đặt Tài Khoản.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Quyền Sở Hữu Trí Tuệ & Hành Vi Nghiêm Cấm</h2>
          <p>
            Toàn bộ mã nguồn, thuật toán mô hình toán học (Brier Score calibration, Poisson weights, Dynamic Elo), giao diện và nội dung phân tích thuộc sở hữu trí tuệ độc quyền của iKnowBall.
          </p>
          <p className="text-xs text-neutral-400">Bạn đồng ý KHÔNG thực hiện các hành vi sau:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-400">
            <li>Sử dụng bot tự động (crawler/scraper) để trích xuất dữ liệu quy mô lớn gây nghẽn máy chủ.</li>
            <li>Dịch ngược (reverse engineer) mã nguồn hoặc các mô hình AI độc quyền.</li>
            <li>Sử dụng dữ liệu của iKnowBall để phát triển dịch vụ cạnh tranh trực tiếp mà không có thỏa thuận đối tác.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Giới Hạn Trách Nhiệm Pháp Lý</h2>
          <p>
            Dữ liệu dự đoán thể thao mang tính bất định tự nhiên. iKnowBall và các thành viên sáng lập không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hoặc do hậu quả phát sinh từ việc bạn dựa vào các thông tin, dự đoán hoặc thống kê trên hệ thống để đưa ra các quyết định cá nhân.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Liên Hệ & Hỗ Trợ Pháp Lý</h2>
          <p className="text-xs">
            Mọi câu hỏi liên quan đến Điều khoản Dịch vụ, vui lòng liên hệ với ban quản trị qua email: <span className="text-emerald-400 font-mono">support@iknowball.com</span> hoặc gửi yêu cầu tại trang hỗ trợ.
          </p>
        </section>
      </div>
    </div>
  );
}
