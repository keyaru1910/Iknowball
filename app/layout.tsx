import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iknowball - AI Sports Predictions",
  description: "Live scores and AI-powered sports predictions for football, basketball, and e-sports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
