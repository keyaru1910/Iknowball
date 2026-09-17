"use client";

import React from "react";
import FluctuationAlertFeed from "../../components/FluctuationAlertFeed";

export default function AlertsPage() {
  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <FluctuationAlertFeed
        limit={30}
        showFilterTabs={true}
        showSettingsButton={true}
        showScanButton={true}
        title="Cảnh Báo Biến Động Odds & Tín Hiệu AI"
        subtitle="Hệ thống quét dữ liệu và tỷ lệ nhà cái liên tục, cảnh báo sớm các chuyển động bất thường và kèo thơm Value Bet."
      />
    </div>
  );
}
