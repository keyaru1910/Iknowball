import { apiFetch } from "../client";

export interface DashboardStats {
  users: {
    total: number;
    banned: number;
    premium: number;
  };
  billing: {
    activeSubscriptions: number;
    totalRevenue: number;
    totalTransactions: number;
  };
  system: {
    recentSyncLogs: Array<{
      id: string;
      jobName: string;
      status: string;
      startedAt: string;
      recordsProcessed: number;
      errorMessage?: string | null;
    }>;
    latestModelPerformance: {
      id: string;
      modelVersion: string;
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
      avgLogLoss: number;
      avgBrierScore: number;
      sampleSize: number;
      createdAt: string;
    } | null;
  };
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  status: "active" | "banned";
  role: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  subscriptions: Array<{
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: string;
  }>;
  _count: {
    payments: number;
    predictionViews: number;
  };
}

export interface AdminPaymentItem {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  user: { id: string; email: string; fullName: string | null };
  subscription?: { id: string; plan: string; status: string } | null;
}

export interface AdminSubscriptionItem {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  user: { id: string; email: string; fullName: string | null };
}

export interface AdminSyncLogItem {
  id: string;
  jobName: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  startedAt: string;
  finishedAt: string | null;
  recordsProcessed: number;
  errorMessage: string | null;
}

export interface AdminModelPerformanceItem {
  id: string;
  modelVersion: string;
  leagueId: string | null;
  periodStart: string;
  periodEnd: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  avgLogLoss: number;
  avgBrierScore: number;
  sampleSize: number;
  createdAt: string;
  league?: { id: string; name: string; season: string } | null;
}

export interface AdminAuditLogItem {
  id: string;
  actorId: string | null;
  targetUserId: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor?: { id: string; email: string; fullName: string | null } | null;
  targetUser?: { id: string; email: string; fullName: string | null } | null;
}

export async function getAdminDashboardStats() {
  return apiFetch<DashboardStats>("/admin/dashboard");
}

export async function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiFetch<AdminUserItem[]>(`/admin/users${qs ? `?${qs}` : ""}`);
}

export async function updateUserStatus(userId: string, status: "active" | "banned", reason?: string) {
  return apiFetch<AdminUserItem>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

export async function updateUserRole(userId: string, role: string) {
  return apiFetch<AdminUserItem>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function getAdminPayments(params?: { page?: number; limit?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiFetch<AdminPaymentItem[]>(`/admin/payments${qs ? `?${qs}` : ""}`);
}

export async function getAdminSubscriptions(params?: { page?: number; limit?: number; status?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiFetch<AdminSubscriptionItem[]>(`/admin/subscriptions${qs ? `?${qs}` : ""}`);
}

export async function getAdminSyncLogs(params?: { page?: number; limit?: number; jobName?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.jobName) query.set("jobName", params.jobName);

  const qs = query.toString();
  return apiFetch<AdminSyncLogItem[]>(`/admin/sync-logs${qs ? `?${qs}` : ""}`);
}

export async function getAdminModelPerformance(params?: { leagueId?: string; modelVersion?: string }) {
  const query = new URLSearchParams();
  if (params?.leagueId) query.set("leagueId", params.leagueId);
  if (params?.modelVersion) query.set("modelVersion", params.modelVersion);

  const qs = query.toString();
  return apiFetch<AdminModelPerformanceItem[]>(`/admin/model-performance${qs ? `?${qs}` : ""}`);
}

export async function getAdminAuditLogs(params?: { page?: number; limit?: number; action?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.action) query.set("action", params.action);

  const qs = query.toString();
  return apiFetch<AdminAuditLogItem[]>(`/admin/audit-logs${qs ? `?${qs}` : ""}`);
}
