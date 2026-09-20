import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Không tìm thấy trang | iKnowBall',
  description: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.',
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="relative mb-8">
        <div className="text-8xl md:text-9xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-500 select-none opacity-90 animate-pulse">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center blur-2xl opacity-20 bg-emerald-500 -z-10" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Không Tìm Thấy Trang Yêu Cầu
      </h1>
      <p className="text-gray-400 max-w-md mb-8 text-sm md:text-base">
        Đường dẫn bạn truy cập có thể đã thay đổi hoặc không tồn tại trong hệ thống phân tích dữ liệu iKnowBall.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm hover:opacity-95 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          ⚽ Quay về Trang chủ
        </Link>
        <Link
          href="/predictions"
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-semibold text-sm transition-all active:scale-95"
        >
          📊 Xem Dự Đoán AI
        </Link>
      </div>
    </div>
  );
}
