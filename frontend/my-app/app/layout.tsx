import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Pacifico, Outfit } from "next/font/google";
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

const pacifico = Pacifico({
  weight: "400",
  variable: "--font-logo",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-navbar",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

import Script from "next/script";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iknowball.com";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "iKnowBall — Dự đoán bóng đá & Thể thao bằng AI & Elo Rating",
    template: "%s | iKnowBall",
  },
  description: "Nền tảng phân tích thể thao và dự đoán bóng đá thông minh dựa trên dữ liệu thật, mô hình Poisson và bảng xếp hạng Elo chuẩn xác.",
  keywords: ["dự đoán bóng đá", "kèo bóng đá", "soi kèo AI", "thống kê bóng đá", "Elo rating", "iKnowBall", "phân tích thể thao"],
  authors: [{ name: "iKnowBall Team", url: baseUrl }],
  creator: "iKnowBall",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: baseUrl,
    siteName: "iKnowBall",
    title: "iKnowBall — Nền Tảng Dự Đoán Thể Thao Dựa Trên Dữ Liệu",
    description: "Phân tích số liệu chuyên sâu, dự đoán xác suất trận đấu thời gian thực bằng trí tuệ nhân tạo và mô hình Elo.",
    images: [
      {
        url: "/img/favicon.png",
        width: 512,
        height: 512,
        alt: "iKnowBall Sports Analytics Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "iKnowBall — Dự đoán bóng đá AI & Elo Rating",
    description: "Phân tích số liệu chuyên sâu và dự đoán xác suất trận đấu thời gian thực.",
    images: ["/img/favicon.png"],
  },
  icons: {
    icon: [
      { url: "/img/favicon.png", type: "image/png" },
    ],
    shortcut: "/img/favicon.png",
    apple: "/img/favicon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} ${pacifico.variable} ${outfit.variable} h-full antialiased`}
    >
      <head>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#0B0E13] text-[#EDEFF3]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

