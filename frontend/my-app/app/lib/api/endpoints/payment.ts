import { apiFetch } from "../client";

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
  mode: string;
}

export interface VietQrPaymentResponse {
  paymentId: string;
  orderCode: string;
  plan: string;
  planName: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  bankName: string;
  bankBin: string;
  bankAccountNo: string;
  bankAccountName: string;
  transferContent: string;
  qrCodeUrl: string;
  expiresAt: string;
  checkoutUrl: string;
}

export interface VietQrStatusResponse {
  orderCode: string;
  status: string;
  isPaid: boolean;
  amount: number;
  currency: string;
  plan: string | null;
  paidAt: string | null;
}

export interface UserSubscriptionData {
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

/**
 * Khởi tạo đơn thanh toán VietQR Ngân hàng nội địa
 */
export async function createVietQrPayment(plan: string, returnUrl?: string) {
  return apiFetch<VietQrPaymentResponse>("/payments/vietqr/create", {
    method: "POST",
    body: JSON.stringify({ plan, returnUrl }),
  });
}

/**
 * Tra cứu trạng thái thanh toán VietQR theo mã đơn
 */
export async function checkVietQrPaymentStatus(orderCode: string) {
  return apiFetch<VietQrStatusResponse>(`/payments/vietqr/status/${orderCode}`, {
    method: "GET",
  });
}

/**
 * Giả lập / Xác nhận thanh toán VietQR thủ công (môi trường test/demo)
 */
export async function manualConfirmVietQrPayment(orderCode: string, plan?: string) {
  return apiFetch<{ success: boolean; message: string; data?: any }>("/payments/vietqr/manual-confirm", {
    method: "POST",
    body: JSON.stringify({ orderCode, plan }),
  });
}

/**
 * Khởi tạo Stripe Checkout Session (backward compatibility)
 */
export async function createCheckoutSession(plan: string, successUrl?: string, cancelUrl?: string) {
  return apiFetch<CheckoutSessionResponse>("/payments/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({ plan, successUrl, cancelUrl }),
  });
}

export async function createCustomerPortalSession() {
  return apiFetch<{ url: string }>("/payments/customer-portal", {
    method: "POST",
  });
}

export async function getUserSubscription() {
  return apiFetch<UserSubscriptionData>("/payments/subscription", {
    method: "GET",
  });
}

export async function confirmCheckoutSession(sessionId: string, plan?: string) {
  return apiFetch<{
    success: boolean;
    message: string;
    subscription?: any;
    plan?: string;
  }>("/payments/confirm-session", {
    method: "POST",
    body: JSON.stringify({ sessionId, plan }),
  });
}
