"use client";

import React, { useState } from "react";
import { 
  Bot, 
  Sparkles, 
  Play, 
  Send, 
  RotateCcw, 
  Activity, 
  Cpu, 
  BarChart3
} from "lucide-react";
import { colors } from "../lib/design-tokens";

interface SimulationResult {
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  over25Pct: number;
  under25Pct: number;
  bttsYesPct: number;
  bttsNoPct: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  topScores: { score: string; count: number; pct: number }[];
  totalSimulations: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
  badge?: string;
  quickStats?: { label: string; value: string; color?: string }[];
}

export default function VipAiCopilotSimulator() {
  const [activeSubTab, setActiveSubTab] = useState<"simulator" | "copilot">("simulator");

  // State Simulator
  const [homeTeam, setHomeTeam] = useState("Arsenal");
  const [awayTeam, setAwayTeam] = useState("Chelsea");
  const [homeElo, setHomeElo] = useState<number>(1860);
  const [awayElo, setAwayElo] = useState<number>(1780);
  const [homeXg, setHomeXg] = useState<number>(1.85);
  const [awayXg, setAwayXg] = useState<number>(1.15);
  const [iterations, setIterations] = useState<number>(10000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  // Quick preset matches
  const matchPresets = [
    { home: "Arsenal", away: "Chelsea", homeElo: 1860, awayElo: 1780, homeXg: 1.85, awayXg: 1.15 },
    { home: "Man City", away: "Liverpool", homeElo: 1940, awayElo: 1910, homeXg: 2.10, awayXg: 1.70 },
    { home: "Real Madrid", away: "Barcelona", homeElo: 1920, awayElo: 1890, homeXg: 1.95, awayXg: 1.65 },
    { home: "Bayern Munich", away: "Dortmund", homeElo: 1880, awayElo: 1810, homeXg: 2.40, awayXg: 1.30 },
  ];

  // Run Poisson random generator
  const runPoisson = (lambda: number) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimResult(null);

    setTimeout(() => {
      let homeWins = 0;
      let draws = 0;
      let awayWins = 0;
      let over25 = 0;
      let btts = 0;
      let totalHomeGoals = 0;
      let totalAwayGoals = 0;
      const scoreMap: Record<string, number> = {};

      // Adjust xG slightly based on Elo difference
      const eloDiff = homeElo - awayElo;
      const adjustedHomeLambda = Math.max(0.4, homeXg + (eloDiff / 400) * 0.35);
      const adjustedAwayLambda = Math.max(0.3, awayXg - (eloDiff / 400) * 0.25);

      for (let i = 0; i < iterations; i++) {
        const hg = runPoisson(adjustedHomeLambda);
        const ag = runPoisson(adjustedAwayLambda);

        totalHomeGoals += hg;
        totalAwayGoals += ag;

        if (hg > ag) homeWins++;
        else if (hg === ag) draws++;
        else awayWins++;

        if (hg + ag > 2.5) over25++;
        if (hg > 0 && ag > 0) btts++;

        const scoreKey = `${hg} - ${ag}`;
        scoreMap[scoreKey] = (scoreMap[scoreKey] || 0) + 1;
      }

      const topScores = Object.entries(scoreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([score, count]) => ({
          score,
          count,
          pct: parseFloat(((count / iterations) * 100).toFixed(1)),
        }));

      setSimResult({
        homeWinPct: parseFloat(((homeWins / iterations) * 100).toFixed(1)),
        drawPct: parseFloat(((draws / iterations) * 100).toFixed(1)),
        awayWinPct: parseFloat(((awayWins / iterations) * 100).toFixed(1)),
        over25Pct: parseFloat(((over25 / iterations) * 100).toFixed(1)),
        under25Pct: parseFloat((((iterations - over25) / iterations) * 100).toFixed(1)),
        bttsYesPct: parseFloat(((btts / iterations) * 100).toFixed(1)),
        bttsNoPct: parseFloat((((iterations - btts) / iterations) * 100).toFixed(1)),
        avgHomeGoals: parseFloat((totalHomeGoals / iterations).toFixed(2)),
        avgAwayGoals: parseFloat((totalAwayGoals / iterations).toFixed(2)),
        topScores,
        totalSimulations: iterations,
      });

      setIsSimulating(false);
    }, 600);
  };

  // State Copilot Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Xin chào Quý Hội Viên VIP! Tôi là Trợ lý AI Copilot của iKnowBall. Tôi được huấn luyện trên 500.000+ dữ liệu trận đấu, thuật toán Monte Carlo và chỉ số Poisson xG. Bạn muốn tôi phân tích chuyên sâu trận đấu hoặc quét kèo +EV nào hôm nay?",
      time: "Vừa xong",
      badge: "AI Match Analyst",
      quickStats: [
        { label: "Mô hình", value: "Ensemble Poisson + GBDT", color: "text-amber-400" },
        { label: "Độ tin cậy", value: "94.8% Backtested", color: "text-emerald-400" },
      ],
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    "🔥 Quét 3 kèo có chỉ số +EV cao nhất hôm nay",
    "📊 Phân tích kịch bản Arsenal vs Chelsea khi vắng trụ cột",
    "⚽ Dự báo phân phối bàn thắng Over/Under 2.5 Man City vs Liverpool",
    "🎯 Giải thích cách mô hình nhận diện dòng tiền Odds sụt giảm",
  ];

  const handleSendMessage = (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: prompt,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "";
      let quickStats: any = undefined;

      if (prompt.includes("+EV") || prompt.includes("kèo")) {
        reply = `**Báo cáo Quét Kèo Giá Trị (+EV Radar VIP):**\n\n1. **Arsenal vs Chelsea**: Xác suất AI tính toán Thắng Chủ Nhà là **58.4%**, trong khi Odds thị trường là **1.92** (tương đương 52.1% ngầm định) ➔ **Kỳ vọng dương +EV đạt +12.1%**.\n2. **Real Madrid vs Barcelona**: Kèo **Over 2.75 bàn** có tỷ lệ nổ kịch bản **66.2%** nhờ chỉ số xG gộp đạt 3.42 ➔ Đạt chuẩn Value Bet.\n3. **Lời khuyên phân bổ vốn**: Áp dụng công thức Kelly Criterion tỉ lệ 2.5% ngân sách.`;
        quickStats = [
          { label: "Cơ hội tìm thấy", value: "3 Value Bets", color: "text-amber-400" },
          { label: "Biên lợi thế TB", value: "+10.4% EV", color: "text-emerald-400" },
        ];
      } else if (prompt.includes("Arsenal") || prompt.includes("Chelsea")) {
        reply = `**Phân tích Chiến thuật Chuyên sâu AI:**\n- **Đội hình & Trụ cột:** Khả năng kiểm soát khu trung tuyến của Arsenal duy trì ở mức 61% xT (Expected Threat). Khi Chelsea chuyển đổi trạng thái phản công, khoảng trống nách trung vệ có thể bị khai thác.\n- **Kịch bản bàn thắng:** Phút 30-45 và 75-90 là hai khung giờ có tỷ lệ ghi bàn mô phỏng cao nhất.\n- **Dự đoán tỷ số trọng tâm:** 2 - 1 (18.4%) hoặc 2 - 0 (14.2%).`;
      } else {
        reply = `Dựa trên dữ liệu định lượng thời gian thực và mô hình Machine Learning:\n- Chỉ số phong độ Elo phản ánh xu hướng ổn định trong 8 trận gần nhất.\n- Tỷ lệ sụt giảm Odds (Dropping Odds) cho thấy dòng tiền thông minh (Smart Money) đang đổ dồn vào cửa Chủ nhà trước giờ bóng lăn.\n- Hệ thống khuyến nghị theo dõi sát danh sách đăng ký thi đấu chính thức 60 phút trước trận.`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: reply,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        badge: "AI Deep Insights",
        quickStats,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs selector */}
      <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 w-fit">
        <button
          onClick={() => setActiveSubTab("simulator")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "simulator"
              ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Giả Lập Monte Carlo (10.000 Kịch Bản)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("copilot")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "copilot"
              ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Trợ Lý AI Copilot 1-1 Chuyên Sâu</span>
        </button>
      </div>

      {/* ================= TAB 1: MONTE CARLO SIMULATOR ================= */}
      {activeSubTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel (5 cols) */}
          <div
            className="lg:col-span-5 rounded-3xl border p-6 flex flex-col justify-between space-y-6"
            style={{ backgroundColor: colors.panel, borderColor: "rgba(245, 158, 11, 0.25)" }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Cấu Hình Mô Phỏng Poisson</h3>
                    <p className="text-[11px] text-neutral-400">Điều chỉnh biến số định lượng để giả lập</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">
                  VIP Exclusive
                </span>
              </div>

              {/* Match Presets */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-neutral-400 mb-2">Trận đấu mẫu nổi bật:</label>
                <div className="grid grid-cols-2 gap-2">
                  {matchPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setHomeTeam(preset.home);
                        setAwayTeam(preset.away);
                        setHomeElo(preset.homeElo);
                        setAwayElo(preset.awayElo);
                        setHomeXg(preset.homeXg);
                        setAwayXg(preset.awayXg);
                      }}
                      className="text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-neutral-300 text-xs transition-all"
                    >
                      <div className="font-semibold text-white truncate">{preset.home} vs {preset.away}</div>
                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Elo: {preset.homeElo} / {preset.awayElo}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Teams & Inputs */}
              <div className="space-y-4 text-xs">
                {/* Home team */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">Đội Chủ Nhà (Home)</span>
                    <input
                      type="text"
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white text-right w-36 font-semibold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-1">Elo Rating:</span>
                      <input
                        type="number"
                        value={homeElo}
                        onChange={(e) => setHomeElo(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-1">Kỳ vọng bàn thắng (xG):</span>
                      <input
                        type="number"
                        step="0.05"
                        value={homeXg}
                        onChange={(e) => setHomeXg(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Away team */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-300 uppercase tracking-wider text-[11px]">Đội Khách (Away)</span>
                    <input
                      type="text"
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white text-right w-36 font-semibold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-1">Elo Rating:</span>
                      <input
                        type="number"
                        value={awayElo}
                        onChange={(e) => setAwayElo(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-1">Kỳ vọng bàn thắng (xG):</span>
                      <input
                        type="number"
                        step="0.05"
                        value={awayXg}
                        onChange={(e) => setAwayXg(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Iterations selector */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-neutral-400 text-xs">Số kịch bản mô phỏng:</span>
                  <div className="flex items-center gap-1.5">
                    {[1000, 5000, 10000].map((count) => (
                      <button
                        key={count}
                        onClick={() => setIterations(count)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          iterations === count
                            ? "bg-amber-400 text-neutral-950"
                            : "bg-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {count.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSimulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Đang giả lập {iterations.toLocaleString()} kịch bản...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-neutral-950" />
                  <span>Chạy Giả Lập Monte Carlo ({iterations.toLocaleString()} Kịch Bản)</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display (7 cols) */}
          <div
            className="lg:col-span-7 rounded-3xl border p-6 flex flex-col justify-between"
            style={{ backgroundColor: colors.panel, borderColor: colors.borderSoft }}
          >
            {simResult ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: colors.borderSoft }}>
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase font-mono font-bold tracking-widest">
                      Kết Quả Mô Phỏng {simResult.totalSimulations.toLocaleString()} Lần
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {homeTeam} <span className="text-neutral-500 font-normal">vs</span> {awayTeam}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase block font-semibold">xG Mô Phỏng TB:</span>
                    <span className="text-sm font-mono font-bold text-white">
                      {simResult.avgHomeGoals} - {simResult.avgAwayGoals}
                    </span>
                  </div>
                </div>

                {/* 1X2 Probabilities Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-400 font-bold">{homeTeam} Thắng ({simResult.homeWinPct}%)</span>
                    <span className="text-neutral-400">Hòa ({simResult.drawPct}%)</span>
                    <span className="text-cyan-400 font-bold">{awayTeam} Thắng ({simResult.awayWinPct}%)</span>
                  </div>

                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-neutral-950 border border-neutral-800 p-0.5">
                    <div
                      style={{ width: `${simResult.homeWinPct}%` }}
                      className="h-full bg-emerald-500 rounded-l-full transition-all duration-700"
                    />
                    <div
                      style={{ width: `${simResult.drawPct}%` }}
                      className="h-full bg-neutral-600 transition-all duration-700"
                    />
                    <div
                      style={{ width: `${simResult.awayWinPct}%` }}
                      className="h-full bg-cyan-500 rounded-r-full transition-all duration-700"
                    />
                  </div>
                </div>

                {/* Secondary Probabilities */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-neutral-400 block font-semibold">Tài 2.5 (Over)</span>
                    <span className="text-base font-bold font-mono text-amber-400 mt-1 block">{simResult.over25Pct}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-neutral-400 block font-semibold">Xỉu 2.5 (Under)</span>
                    <span className="text-base font-bold font-mono text-neutral-300 mt-1 block">{simResult.under25Pct}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-neutral-400 block font-semibold">Cả 2 Đội Ghi Bàn</span>
                    <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">{simResult.bttsYesPct}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-neutral-400 block font-semibold">Giữ Sạch Lưới</span>
                    <span className="text-base font-bold font-mono text-cyan-400 mt-1 block">{simResult.bttsNoPct}%</span>
                  </div>
                </div>

                {/* Top 5 Most Probable Correct Scores */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Top 5 Kịch Bản Tỷ Số Xuất Hiện Nhiều Nhất</span>
                  </h4>
                  <div className="space-y-2">
                    {simResult.topScores.map((scoreItem, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="w-14 font-mono font-bold text-white bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-lg text-center">
                          {scoreItem.score}
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, scoreItem.pct * 4)}%` }}
                          />
                        </div>
                        <span className="w-14 text-right font-mono font-semibold text-amber-300">
                          {scoreItem.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-white">Chưa chạy mô phỏng kịch bản</h4>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Chọn các thông số bên trái và bấm <strong>"Chạy Giả Lập Monte Carlo"</strong> để máy tính tính toán phân phối Poisson và xác suất hàng vạn trận đấu tức thì.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: AI COPILOT 1-1 CHAT ================= */}
      {activeSubTab === "copilot" && (
        <div
          className="rounded-3xl border p-6 flex flex-col h-[620px]"
          style={{ backgroundColor: colors.panel, borderColor: "rgba(245, 158, 11, 0.25)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: colors.borderSoft }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">AI Match Copilot VIP</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold border border-emerald-500/30">
                    Online 24/7
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">Trợ lý định lượng & cố vấn chiến thuật thể thao cá nhân</p>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: "1",
                    sender: "ai",
                    text: "Đã làm mới cuộc trò chuyện. Tôi sẵn sàng hỗ trợ phân tích trận đấu mới cho bạn!",
                    time: "Vừa xong",
                    badge: "AI Match Analyst",
                  },
                ]);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Làm mới chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Chat message list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* Sender badge */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  {msg.sender === "ai" ? (
                    <>
                      <span className="text-[10px] font-bold text-amber-400">{msg.badge || "AI Copilot"}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{msg.time}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-neutral-500 font-mono">{msg.time}</span>
                      <span className="text-[10px] font-bold text-cyan-400">Bạn (VIP Member)</span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl max-w-2xl text-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-amber-500 text-neutral-950 font-medium rounded-tr-none shadow-md"
                      : "bg-neutral-900/90 border border-neutral-800 text-neutral-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}

                  {/* Optional Quick Stats Card */}
                  {msg.quickStats && (
                    <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                      {msg.quickStats.map((stat, sIdx) => (
                        <div key={sIdx} className="p-2 rounded-lg bg-black/40 text-[11px]">
                          <span className="text-neutral-400 block text-[10px]">{stat.label}</span>
                          <span className={`font-bold font-mono ${stat.color || "text-white"}`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 w-fit text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>AI Copilot đang phân tích số liệu...</span>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 transition-all font-medium"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2 border-t border-neutral-800"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Đặt câu hỏi phân tích kèo, xác suất, biến động chiến thuật..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-all font-normal"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isTyping}
              className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
