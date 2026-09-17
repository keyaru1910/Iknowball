"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../lib/api/client";
import { colors } from "../lib/design-tokens";

interface ApiKeyItem {
  id: string;
  keyPrefix: string;
  name: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function VipApiKeyManager() {
  const { user } = useAuth();
  const isVip = user?.tier === "vip" || user?.role === "admin";

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ rawKey: string; name: string } | null>(null);
  const [keyNameInput, setKeyNameInput] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    if (!isVip) return;
    setIsLoading(true);
    try {
      const { data } = await apiFetch<ApiKeyItem[]>("/users/api-keys");
      setKeys(data || []);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [isVip]);

  const handleGenerateKey = async () => {
    try {
      const { data } = await apiFetch<{ id: string; name: string; apiKey: string; keyPrefix: string }>(
        "/users/api-keys",
        {
          method: "POST",
          body: JSON.stringify({ name: keyNameInput || "VIP Personal Access Key" }),
        }
      );
      setNewKeyData({ rawKey: data.apiKey, name: data.name });
      setKeyNameInput("");
      fetchKeys();
    } catch (err: any) {
      alert(err?.message || "Không thể tạo API Key");
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Bạn có chắc muốn thu hồi API Key này? Các ứng dụng sử dụng key sẽ không thể truy cập API.")) return;
    try {
      await apiFetch(`/users/api-keys/${id}`, { method: "DELETE" });
      fetchKeys();
    } catch (err: any) {
      alert(err?.message || "Không thể thu hồi API Key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isVip) {
    return (
      <div
        className="rounded-2xl border p-6 text-center relative overflow-hidden"
        style={{
          borderColor: "rgba(245, 158, 11, 0.3)",
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(18, 22, 29, 0.9) 100%)",
        }}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-2xl mb-3">
          👑
        </div>
        <h3 className="text-base font-bold text-white mb-2">
          iKnowBall Developer API (VIP Exclusive)
        </h3>
        <p className="text-xs text-neutral-300 max-w-md mx-auto mb-5 leading-relaxed">
          Tích hợp trực tiếp dữ liệu dự đoán Machine Learning, tỷ lệ xác suất và lịch sử hiệu năng vào ứng dụng cá nhân hoặc bot phân tích của bạn với hạn mức 500 requests/ngày.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-lg hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            color: "#0B0E13",
          }}
        >
          <span>👑 Nâng cấp gói VIP để nhận API Key</span>
          <span>→</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-6 shadow-xl"
      style={{ borderColor: colors.border, backgroundColor: colors.panel }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b" style={{ borderColor: colors.borderSoft }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">👑</span>
            <h3 className="text-base font-bold text-white">Quản Lý Developer API Key (VIP)</h3>
          </div>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            Sử dụng API Key qua header <code className="font-mono text-emerald-400">X-API-Key</code> để truy vấn dữ liệu dự đoán.
          </p>
        </div>

        {/* Generate Key Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tên gợi nhớ (ví dụ: Python Bot)..."
            value={keyNameInput}
            onChange={(e) => setKeyNameInput(e.target.value)}
            className="rounded-xl border px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400 transition-colors"
            style={{ borderColor: colors.border, backgroundColor: colors.panelAlt, color: colors.text }}
          />
          <button
            type="button"
            onClick={handleGenerateKey}
            className="rounded-xl px-4 py-1.5 text-xs font-bold text-black transition-all hover:scale-105 shrink-0"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
          >
            + Tạo API Key
          </button>
        </div>
      </div>

      {/* Modal / Banner for newly created key */}
      {newKeyData && (
        <div
          className="mb-6 rounded-xl border border-amber-500/40 p-4 relative"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300">
              🔑 Khóa bí mật API mới vừa được tạo thành công!
            </span>
            <button
              type="button"
              onClick={() => setNewKeyData(null)}
              className="text-neutral-400 hover:text-white text-xs"
            >
              ✕ Đóng
            </button>
          </div>
          <p className="text-[11px] text-neutral-300 mb-3">
            Hãy sao chép ngay bây giờ. Vì lý do bảo mật, bạn sẽ không thể xem lại toàn bộ chuỗi ký tự này lần thứ hai.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={newKeyData.rawKey}
              className="w-full rounded-lg border px-3 py-2 font-mono text-xs text-amber-300 select-all focus:outline-none"
              style={{ borderColor: "rgba(245, 158, 11, 0.4)", backgroundColor: colors.bg }}
            />
            <button
              type="button"
              onClick={() => copyToClipboard(newKeyData.rawKey)}
              className="rounded-lg px-4 py-2 text-xs font-bold transition-colors shrink-0"
              style={{ backgroundColor: colors.accent, color: colors.bg }}
            >
              {copied ? "✓ Đã chép" : "Sao chép"}
            </button>
          </div>
        </div>
      )}

      {/* List of Keys */}
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      ) : keys.length === 0 ? (
        <div className="rounded-xl border p-6 text-center text-xs" style={{ borderColor: colors.borderSoft, color: colors.textMuted }}>
          Bạn chưa tạo API Key nào. Hãy nhấn nút "+ Tạo API Key" để kích hoạt quyền truy cập lập trình viên.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead style={{ color: colors.textMuted }}>
              <tr className="border-b" style={{ borderColor: colors.borderSoft }}>
                <th className="pb-3 font-semibold uppercase">Tên</th>
                <th className="pb-3 font-semibold uppercase">Tiền tố Key</th>
                <th className="pb-3 font-semibold uppercase">Ngày tạo</th>
                <th className="pb-3 font-semibold uppercase">Dùng gần nhất</th>
                <th className="pb-3 font-semibold uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: colors.borderSoft }}>
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-medium text-white">{k.name}</td>
                  <td className="py-3 font-mono text-amber-300">{k.keyPrefix}</td>
                  <td className="py-3 font-mono text-neutral-400">{new Date(k.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="py-3 font-mono text-neutral-400">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("vi-VN") : "Chưa sử dụng"}
                  </td>
                  <td className="py-3 text-right">
                    {k.revokedAt ? (
                      <span className="text-rose-400 font-mono text-[11px]">Đã thu hồi</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-rose-400 hover:underline text-[11px] font-semibold"
                      >
                        Thu hồi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Code Snippet Example */}
      <div className="mt-6 pt-5 border-t" style={{ borderColor: colors.borderSoft }}>
        <h4 className="text-xs font-bold text-white mb-2">💻 Ví dụ tích hợp cURL:</h4>
        <pre
          className="p-3 rounded-xl border text-[11px] font-mono text-emerald-300 overflow-x-auto"
          style={{ borderColor: colors.borderSoft, backgroundColor: colors.bg }}
        >
          {`curl -X GET "http://localhost:4000/api/v1/predictions" \\
  -H "X-API-Key: ikb_live_your_key_here"`}
        </pre>
      </div>
    </div>
  );
}
