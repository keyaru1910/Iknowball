import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "iKnowBall — Dự đoán bóng đá bằng dữ liệu",
  description: "Hệ thống phân tích và dự đoán thể thao thông minh dựa trên dữ liệu thật và Elo rating.",
  icons: {
    icon: "/img/fasvicon.png",
    shortcut: "/img/fasvicon.png",
    apple: "/img/fasvicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0B0E13] text-[#EDEFF3]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

