"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  Ban,
  CheckCircle,
  MoreVertical,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
  AdminUserItem,
} from "../../lib/api/endpoints/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionUser, setActionUser] = useState<AdminUserItem | null>(null);
  const [actionType, setActionType] = useState<"ban" | "unban" | "role" | null>(null);
  const [selectedRole, setSelectedRole] = useState("user");
  const [banReason, setBanReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers({
        page,
        limit: 15,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.data);
      if (res.meta?.totalPages) {
        setTotalPages(Number(res.meta.totalPages));
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi tải danh sách người dùng" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleConfirmAction = async () => {
    if (!actionUser || !actionType) return;
    try {
      setSubmitting(true);
      if (actionType === "ban") {
        await updateUserStatus(actionUser.id, "banned", banReason);
        setMessage({ type: "success", text: `Đã khóa tài khoản ${actionUser.email}` });
      } else if (actionType === "unban") {
        await updateUserStatus(actionUser.id, "active");
        setMessage({ type: "success", text: `Đã mở khóa tài khoản ${actionUser.email}` });
      } else if (actionType === "role") {
        await updateUserRole(actionUser.id, selectedRole);
        setMessage({ type: "success", text: `Đã đổi quyền ${actionUser.email} thành ${selectedRole}` });
      }
      setActionUser(null);
      setActionType(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Thao tác thất bại" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            Quản Lý Người Dùng
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Xem danh sách thành viên, cấp quyền truy cập Pro/Admin, và xử lý khóa tài khoản.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email hoặc họ tên..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-800/80 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-800/80 border border-neutral-700 text-sm text-neutral-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Tất cả Vai trò</option>
            <option value="user">User</option>
            <option value="premium">Premium / Pro</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-neutral-800/80 border border-neutral-700 text-sm text-neutral-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="active">Active (Hoạt động)</option>
            <option value="banned">Banned (Bị khóa)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Người Dùng</th>
                <th className="py-3.5 px-4">Vai Trò</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Gói Đăng Ký</th>
                <th className="py-3.5 px-4">Ngày Tạo</th>
                <th className="py-3.5 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Không tìm thấy người dùng phù hợp
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{u.fullName || "Chưa đặt tên"}</div>
                      <div className="text-xs text-neutral-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                          u.role?.name === "admin"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : u.role?.name === "premium"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        {u.role?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          Banned
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-300">
                      {u.subscriptions?.[0] ? (
                        <span className="text-emerald-400 font-medium">
                          {u.subscriptions[0].plan}
                        </span>
                      ) : (
                        <span className="text-neutral-500">Miễn phí</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Change Role Button */}
                        <button
                          onClick={() => {
                            setActionUser(u);
                            setActionType("role");
                            setSelectedRole(u.role?.name || "user");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
                        >
                          Phân Quyền
                        </button>

                        {/* Ban / Unban Button */}
                        {u.status === "active" ? (
                          <button
                            onClick={() => {
                              setActionUser(u);
                              setActionType("ban");
                              setBanReason("");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors"
                          >
                            Khóa
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActionUser(u);
                              setActionType("unban");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors"
                          >
                            Mở Khóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 disabled:opacity-40 hover:text-white"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 disabled:opacity-40 hover:text-white"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog for Actions */}
      {actionUser && actionType && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {actionType === "ban" && "Khóa Tài Khoản"}
                {actionType === "unban" && "Mở Khóa Tài Khoản"}
                {actionType === "role" && "Thay Đổi Quyền Hạn"}
              </h3>
              <button
                onClick={() => {
                  setActionUser(null);
                  setActionType(null);
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-300">
              Đang thực hiện cho: <span className="font-semibold text-white">{actionUser.email}</span>
            </p>

            {actionType === "ban" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400">Lý do khóa tài khoản:</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Nhập lý do (vi phạm điều khoản, spam, v.v.)..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            {actionType === "role" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400">Chọn vai trò mới:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="user">User (Thường)</option>
                  <option value="premium">Premium / Pro</option>
                  <option value="admin">Admin (Quản trị viên)</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => {
                  setActionUser(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-sm text-neutral-300 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-neutral-950 disabled:opacity-50 ${
                  actionType === "ban" ? "bg-rose-500 hover:bg-rose-400" : "bg-emerald-500 hover:bg-emerald-400"
                }`}
              >
                {submitting ? "Đang xử lý..." : "Xác Nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
