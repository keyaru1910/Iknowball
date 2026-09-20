'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Chỉ ghi log lỗi khi ở dev
    if (process.env.NODE_ENV !== 'production') {
      console.error('Next.js Page Error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="relative mb-8">
        <div className="text-8xl md:text-9xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-500 select-none opacity-90">
          500
        </div>
        <div className="absolute inset-0 flex items-center justify-center blur-2xl opacity-20 bg-red-500 -z-10" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Đã Xảy Ra Lỗi Hệ Thống
      </h1>
      <p className="text-gray-400 max-w-md mb-8 text-sm md:text-base">
        Máy chủ tạm thời không thể hoàn thành yêu cầu của bạn. Hệ thống đã ghi nhận sự cố để đội ngũ kỹ thuật xử lý.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-sm hover:opacity-95 transition-all shadow-lg shadow-red-500/20 active:scale-95"
        >
          🔄 Thử lại ngay
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-semibold text-sm transition-all active:scale-95"
        >
          Trang chủ
        </Link>
      </div>
    </div>
  );
}
