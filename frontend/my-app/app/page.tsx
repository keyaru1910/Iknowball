import type { Metadata } from "next";
import LandingPage from "./components/LandingPage";

export const metadata: Metadata = {
  title: "iKnowBall — Dự đoán thể thao dựa trên dữ liệu",
  description: "Phân tích và dự đoán kết quả thể thao dựa trên Elo rating, phong độ và dữ liệu thực tế. Công khai sai số và độ chính xác mô hình.",
  icons: {
    icon: [
      { url: "/img/favicon.png", type: "image/png" },
    ],
    shortcut: "/img/favicon.png",
    apple: "/img/favicon.png",
  },
};

export default function Home() {
  return <LandingPage />;
}
