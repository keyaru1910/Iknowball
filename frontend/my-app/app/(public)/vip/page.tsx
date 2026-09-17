"use client";

import React from "react";
import TelegramVipLounge from "../../components/TelegramVipLounge";
import FluctuationAlertFeed from "../../components/FluctuationAlertFeed";

export default function VipHubPage() {
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Telegram VIP Lounge */}
      <TelegramVipLounge />

      {/* Fluctuation Alert Feed Section */}
      <div className="pt-8 border-t border-neutral-800">
        <FluctuationAlertFeed
          limit={12}
          title="Bảng Tin Biến Động Kèo Trực Tiếp"
          subtitle="Tín hiệu Value Bet và chênh lệch xác suất thời gian thực dành cho thành viên VIP"
        />
      </div>
    </div>
  );
}
