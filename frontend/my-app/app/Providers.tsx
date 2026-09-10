"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SportProvider } from "./context/SportContext";
import { AuthProvider } from "./context/AuthContext";

/**
 * QueryClient tạo bằng useState (không phải module-level singleton) —
 * tránh chia sẻ cache giữa các request khác nhau khi chạy trên server.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider bọc ngoài cùng để mọi component đều truy cập được */}
      <AuthProvider>
        <SportProvider>{children}</SportProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}