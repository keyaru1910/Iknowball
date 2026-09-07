import type { Metadata } from "next";
import LandingPage from "./components/LandingPage";

export const metadata: Metadata = {
  title: "iKnowBall — Dự đoán bóng đá dựa trên dữ liệu",
  description: "Phân tích và dự đoán kết quả bóng đá dựa trên Elo rating, phong độ và dữ liệu thực tế. Công khai sai số và độ chính xác mô hình.",
  icons: {
    icon: "/img/fasvicon.png",
    shortcut: "/img/fasvicon.png",
    apple: "/img/fasvicon.png",
  },
};

export default function Home() {
  return <LandingPage />;
}
