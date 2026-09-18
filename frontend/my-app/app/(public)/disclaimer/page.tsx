"use client";

import React from "react";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="border-b pb-6 space-y-2" style={{ borderColor: colors.borderSoft }}>
        <span className="text-xs font-mono font-medium text-amber-400 uppercase tracking-wider">
          Pháp Lý & Cảnh Báo Rủi Ro
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Tuyên Bố Miễn Trừ Trách Nhiệm (Disclaimer)
        </h1>
        <p className="text-xs text-neutral-400">
          Hiệu lực từ ngày 18 tháng 09 năm 2026 • Đọc kỹ trước khi sử dụng số liệu
        </p>
      </div>

      {/* Main Alert Banner */}
      <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
          <span>⚠️</span>
          <span>Khẳng Định Tính Chất Dịch Vụ & Cảnh Báo Hành Vi Cá Cược</span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed text-amber-100/90">
          <strong>iKnowBall</strong> là nền tảng nghiên cứu và phân tích số liệu bóng đá thuần túy. 
          Chúng tôi <u>TUYỆT ĐỐI KHÔNG KHUYẾN KHÍCH, KHÔNG TỔ CHỨC VÀ KHÔNG KÊU GỌI</u> người dùng tham gia cá cược, đánh bạc trực tuyến hoặc các hành vi vi phạm pháp luật hiện hành.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 text-sm leading-relaxed text-neutral-300">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Mục Đích Cung Cấp Thông Tin</h2>
          <p>
            Mọi nội dung, thuật toán xác suất, chỉ số xG (Bàn thắng kỳ vọng), Elo ratings, biểu đồ phân phối và báo cáo AI do iKnowBall cung cấp chỉ mang tính chất <strong>tham khảo thông tin thể thao, phục vụ học tập, nghiên cứu và giải trí</strong>.
          </p>
          <p>
            Các con số dự đoán được sinh ra tự động bởi các mô hình toán học và máy học (Machine Learning) dựa trên dữ liệu quá khứ. Bóng đá luôn chứa đựng yếu tố ngẫu nhiên và bất ngờ mà không có bất kỳ cỗ máy nào có thể dự đoán chính xác tuyệt đối 100%.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Không Phải Lời Khuyên Tài Chính Hoặc Đặt Cược</h2>
          <p>
            Không có bất kỳ dữ liệu nào trên website hoặc qua API của iKnowBall được xem là lời mời gọi, tư vấn tài chính hay bảo đảm cho bất kỳ kết quả trận đấu cụ thể nào.
          </p>
          <p className="text-xs text-neutral-400">
            Người dùng hoàn toàn tự chịu trách nhiệm về mọi hành động và quyết định cá nhân của mình khi tiếp cận các thông tin này. iKnowBall và đội ngũ phát triển không chịu bất kỳ trách nhiệm pháp lý hoặc tài chính nào đối với bất kỳ thiệt hại hoặc tổn thất nào phát sinh từ việc người dùng sử dụng dữ liệu sai mục đích.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Tính Độc Lập Hoàn Toàn Khỏi Nhà Cái</h2>
          <p>
            iKnowBall hoạt động hoàn toàn độc lập, không nhận tài trợ, không làm đại lý liên kết (affiliate) và không có bất kỳ thỏa thuận thương mại nào với các tổ chức cá cược thể thao hoặc nhà cái cờ bạc.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Độ Chính Xác Của Dữ Liệu Thời Gian Thực</h2>
          <p>
            Mặc dù iKnowBall luôn nỗ lực cập nhật dữ liệu từ các nhà cung cấp nguồn uy tín với độ trễ thấp nhất, chúng tôi không cam đoan về tính hoàn chỉnh tuyệt đối, không có sai sót hoặc tính liên tục không gián đoạn của dữ liệu trong các trường hợp bảo trì máy chủ hoặc sự cố từ nhà mạng trung gian.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Khuyến Cáo Người Dùng</h2>
          <p className="text-xs text-neutral-300">
            Hãy tiếp cận thể thao với tinh thần văn minh, lành mạnh và yêu mến nét đẹp chiến thuật của bóng đá. Hãy tuân thủ nghiêm chỉnh các quy định pháp luật của quốc gia nơi bạn sinh sống.
          </p>
        </section>
      </div>

      {/* Back to Home CTA */}
      <div className="pt-6 border-t border-white/10 flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1.5"
        >
          <span>← Quay lại Trang Chủ iKnowBall</span>
        </Link>
        <Link
          href="/terms"
          className="text-xs text-neutral-400 hover:text-white"
        >
          Xem Điều khoản dịch vụ →
        </Link>
      </div>
    </div>
  );
}
