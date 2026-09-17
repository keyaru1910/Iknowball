"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Bell,
  Sliders,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  getAlertPreferences,
  updateAlertPreferences,
  type AlertPreferences,
} from "../lib/api/endpoints/alerts";
import { useAuth } from "../hooks/useAuth";

interface AlertPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertPreferencesModal({
  isOpen,
  onClose,
}: AlertPreferencesModalProps) {
  const { isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState<AlertPreferences>({
    oddsAlertEnabled: true,
    predictionShiftEnabled: true,
    minThresholdPercent: 5,
    notifyInApp: true,
    notifyTelegram: true,
    notifyEmail: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setLoading(true);
      getAlertPreferences()
        .then((data) => {
          if (data) setPrefs(data);
        })
        .catch((err) => console.error("Lỗi khi tải preferences:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      await updateAlertPreferences(prefs);
      setStatusMsg({ text: "Đã lưu tùy chọn cảnh báo thành công!", type: "success" });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Lỗi lưu tùy chọn", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">Cài Đặt Cảnh Báo Biến Động</h3>
              <p className="text-xs text-neutral-400">Tùy chỉnh ngưỡng & kênh nhận tín hiệu từ AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/15 border border-red-500/30 text-red-300"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">Đang tải cài đặt...</div>
        ) : (
          <div className="space-y-5 text-sm">
            {/* 1. Ngưỡng biến động */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Ngưỡng biến động tối thiểu để kích hoạt thông báo:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 8, 10, 15].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPrefs({ ...prefs, minThresholdPercent: val })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      prefs.minThresholdPercent === val
                        ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                        : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    ≥ {val}%
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5">
                {prefs.minThresholdPercent <= 5
                  ? "Nhận tất cả biến động odds và xác suất AI mức vừa và lớn."
                  : "Chỉ nhận các biến động mang tính bước ngoặt và tín hiệu Value Bet mạnh."}
              </p>
            </div>

            {/* 2. Loại cảnh báo */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Loại sự kiện theo dõi:
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 cursor-pointer hover:border-neutral-700">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Biến động Odds Châu Á & Châu Âu</p>
                    <p className="text-[11px] text-neutral-400">Dòng tiền và tỷ lệ chấp thay đổi trước trận</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.oddsAlertEnabled}
                  onChange={(e) => setPrefs({ ...prefs, oddsAlertEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-neutral-900 border-neutral-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 cursor-pointer hover:border-neutral-700">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Xác Suất AI Đột Biến (Probability Spike)</p>
                    <p className="text-[11px] text-neutral-400">Mô hình Machine Learning điều chỉnh dự đoán</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.predictionShiftEnabled}
                  onChange={(e) => setPrefs({ ...prefs, predictionShiftEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-neutral-900 border-neutral-700"
                />
              </label>
            </div>

            {/* 3. Kênh nhận thông báo */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Kênh nhận thông báo:
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, notifyInApp: !prefs.notifyInApp })}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    prefs.notifyInApp
                      ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                      : "bg-neutral-950 text-neutral-500 border border-neutral-800"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Web App</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, notifyTelegram: !prefs.notifyTelegram })}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    prefs.notifyTelegram
                      ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300"
                      : "bg-neutral-950 text-neutral-500 border border-neutral-800"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram Bot</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, notifyEmail: !prefs.notifyEmail })}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    prefs.notifyEmail
                      ? "bg-purple-500/15 border border-purple-500/40 text-purple-300"
                      : "bg-neutral-950 text-neutral-500 border border-neutral-800"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu Cài Đặt"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
