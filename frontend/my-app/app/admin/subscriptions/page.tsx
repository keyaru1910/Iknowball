"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  getAdminPayments,
  getAdminSubscriptions,
  AdminPaymentItem,
  AdminSubscriptionItem,
} from "../../lib/api/endpoints/admin";

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<"subscriptions" | "payments">("subscriptions");
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([]);
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (tab === "subscriptions") {
          const res = await getAdminSubscriptions({ page, limit: 15 });
          setSubscriptions(res.data);
          if (res.meta?.totalPages) setTotalPages(Number(res.meta.totalPages));
        } else {
          const res = await getAdminPayments({ page, limit: 15 });
          setPayments(res.data);
          if (res.meta?.totalPages) setTotalPages(Number(res.meta.totalPages));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tab, page]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-emerald-400" />
          Quản Lý Thanh Toán & Gói Dịch Vụ
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Theo dõi các giao dịch Stripe Checkout, gói Pro/VIP và tình trạng gia hạn của khách hàng.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => {
            setTab("subscriptions");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === "subscriptions"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Gói Đăng Ký (Subscriptions)
        </button>
        <button
          onClick={() => {
            setTab("payments");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === "payments"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Lịch Sử Giao Dịch (Payments)
        </button>
      </div>

      {/* Table Content */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "subscriptions" ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Gói</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4">Hạn Gói Hiện Tại</th>
                  <th className="py-3.5 px-4">Stripe Customer ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      Đang tải dữ liệu đăng ký...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      Chưa có khách hàng đăng ký gói trả phí
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{sub.user?.fullName || "Khách Hàng"}</div>
                        <div className="text-xs text-neutral-400">{sub.user?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">
                        {sub.plan}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                            sub.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-300">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-500">
                        {sub.stripeCustomerId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Số Tiền</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4">Phương Thức</th>
                  <th className="py-3.5 px-4">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      Đang tải giao dịch...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      Chưa có giao dịch thanh toán
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{p.user?.fullName || "Khách Hàng"}</div>
                        <div className="text-xs text-neutral-400">{p.user?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        ${p.amount.toFixed(2)} <span className="text-xs font-normal uppercase text-neutral-400">{p.currency}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                            p.status === "SUCCEEDED"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-400 uppercase font-mono">
                        {p.paymentMethod || "card"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-400">
                        {new Date(p.createdAt).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
