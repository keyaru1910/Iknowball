"use client";

import React, { useState } from "react";
import Link from "next/link";
import { colors } from "../../lib/design-tokens";

// Các đoạn mã mẫu cho các ngôn ngữ lập trình
const codeSamples = {
  curl: `curl -X GET "https://iknowball.com/api/v1/predictions?league=PL&limit=5" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`,
  python: `import requests

url = "https://iknowball.com/api/v1/predictions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Accept": "application/json"
}
params = {
    "league": "PL",
    "limit": 5
}

response = requests.get(url, headers=headers, params=params)
data = response.json()
print("Kết quả dự đoán:", data)`,
  javascript: `const axios = require('axios');

async function getPredictions() {
  const response = await axios.get('https://iknowball.com/api/v1/predictions', {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Accept': 'application/json'
    },
    params: {
      league: 'PL',
      limit: 5
    }
  });
  console.log('Dữ liệu AI:', response.data);
}

getPredictions();`,
};

export default function ApiDataPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "javascript">("curl");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          iKnowBall Data Platform v1.2
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          API Data & Dữ Liệu Thể Thao AI
        </h1>
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: colors.textMuted }}>
          Cung cấp dữ liệu thời gian thực (Real-time Feeds), xác suất dự đoán Machine Learning,
          chỉ số Elo động, mô hình xG và thống kê chuyên sâu cho các nhà phát triển, chuyên gia dữ liệu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/developer"
            className="px-6 py-2.5 rounded-xl font-medium text-sm text-neutral-900 bg-emerald-400 hover:bg-emerald-300 transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <span>Lấy API Key ngay</span>
            <span>→</span>
          </Link>
          <a
            href="#endpoints"
            className="px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
          >
            Khám phá Endpoints
          </a>
        </div>
      </div>

      {/* Grid tính năng nổi bật */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="p-6 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-2xl mb-3">⚡</div>
          <h3 className="text-base font-bold text-white mb-2">Độ trễ thấp (&lt; 80ms)</h3>
          <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
            Hệ thống phân tán toàn cầu qua CDN Edge, đảm bảo phân phối dữ liệu tỷ lệ, xác suất tức thời trước trận đấu.
          </p>
        </div>

        <div
          className="p-6 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-2xl mb-3">🧠</div>
          <h3 className="text-base font-bold text-white mb-2">Mô hình AI đa chiều</h3>
          <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
            Tổng hợp thuật toán Poisson Regression, Gradient Boosting (LightGBM) và mạng nơ-ron phân tích phong độ cầu thủ.
          </p>
        </div>

        <div
          className="p-6 rounded-2xl border"
          style={{ borderColor: colors.border, backgroundColor: colors.panel }}
        >
          <div className="text-2xl mb-3">📊</div>
          <h3 className="text-base font-bold text-white mb-2">Định dạng chuẩn REST & JSON</h3>
          <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
            Dễ dàng tích hợp với mọi ngôn ngữ (Python, TypeScript, Go, Java, R) hoặc xuất thẳng ra file CSV/Parquet.
          </p>
        </div>
      </div>

      {/* Code Demo & Authentication */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: colors.border, backgroundColor: colors.panel }}
      >
        <div
          className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.panelAlt }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Mã mẫu tích hợp</span>
            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-neutral-400 font-mono">
              GET /api/v1/predictions
            </span>
          </div>

          {/* Tab selector */}
          <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/5">
            {(["curl", "python", "javascript"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative p-6 font-mono text-xs overflow-x-auto bg-[#0A0D12]">
          <pre className="text-neutral-300 leading-relaxed">
            {codeSamples[activeTab]}
          </pre>
          <button
            onClick={() => handleCopy(codeSamples[activeTab])}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition-all"
          >
            {copied ? "✓ Đã chép" : "Sao chép"}
          </button>
        </div>
      </div>

      {/* Endpoints List */}
      <div id="endpoints" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Danh Sách REST Endpoints</h2>
            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
              Tất cả request cần đính kèm header <code className="text-emerald-400">Authorization: Bearer &lt;API_KEY&gt;</code>
            </p>
          </div>
          <Link
            href="/developer"
            className="text-xs font-medium text-emerald-400 hover:underline"
          >
            Quản lý API Key & Quota →
          </Link>
        </div>

        <div className="space-y-4">
          {/* Endpoint 1 */}
          <div
            className="p-5 rounded-xl border space-y-3"
            style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-emerald-500/20 text-emerald-300">
                GET
              </span>
              <code className="font-mono text-sm text-white font-semibold">
                /api/v1/predictions
              </code>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Public / Free Quota
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
              Truy vấn danh sách trận đấu và xác suất dự đoán (Thắng sân nhà, Hòa, Thắng sân khách). Hỗ trợ lọc theo giải đấu (<code>league</code>), ngày thi đấu (<code>date</code>) và phân trang.
            </p>
            <div className="rounded-lg bg-black/40 p-3 font-mono text-xs text-neutral-300 border border-white/5">
              <span className="text-neutral-500">// Response 200 OK</span>
              <br />
              {`{ "success": true, "data": [{ "matchId": "PL_2425_01", "homeTeam": "Arsenal", "awayTeam": "Chelsea", "probHome": 0.54, "probDraw": 0.26, "probAway": 0.20, "confidence": 0.82 }] }`}
            </div>
          </div>

          {/* Endpoint 2 */}
          <div
            className="p-5 rounded-xl border space-y-3"
            style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-emerald-500/20 text-emerald-300">
                GET
              </span>
              <code className="font-mono text-sm text-white font-semibold">
                /api/v1/predictions/:matchId/vip-report
              </code>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                👑 VIP Insights Only
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
              Toàn bộ bài phân tích nhận định tự động (LLM Reasoning + Tactical Heatmap) do mô hình Gemini AI kết hợp các chỉ số nội bộ tạo ra.
            </p>
          </div>

          {/* Endpoint 3 */}
          <div
            className="p-5 rounded-xl border space-y-3"
            style={{ borderColor: colors.borderSoft, backgroundColor: colors.panel }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-emerald-500/20 text-emerald-300">
                GET
              </span>
              <code className="font-mono text-sm text-white font-semibold">
                /api/v1/analytics/elo-history
              </code>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Data Science
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
              Lịch sử biến động chỉ số Elo Rating của các câu lạc bộ bóng đá hàng đầu qua các vòng đấu, tính toán theo thuật toán Elo hiệu chỉnh bàn thắng.
            </p>
          </div>
        </div>
      </div>

      {/* Rate Limits & SLA */}
      <div
        className="p-6 rounded-2xl border"
        style={{ borderColor: colors.border, backgroundColor: colors.panelAlt }}
      >
        <h3 className="text-base font-bold text-white mb-3">Chính sách giới hạn (Rate Limits) & SLA</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-neutral-400">Gói Miễn Phí (Free)</span>
            <p className="text-lg font-bold text-white">60 req / phút</p>
            <p className="text-[11px] text-neutral-500">Tối đa 1,000 req/ngày</p>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-emerald-500/20 space-y-1">
            <span className="text-emerald-400 font-semibold">Gói VIP Insights</span>
            <p className="text-lg font-bold text-emerald-300">600 req / phút</p>
            <p className="text-[11px] text-neutral-500">Không giới hạn theo ngày</p>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <span className="text-neutral-400">Enterprise / Đối tác</span>
            <p className="text-lg font-bold text-white">Custom SLA</p>
            <p className="text-[11px] text-neutral-500">Dedicated webhook & WebSocket stream</p>
          </div>
        </div>
      </div>
    </div>
  );
}
