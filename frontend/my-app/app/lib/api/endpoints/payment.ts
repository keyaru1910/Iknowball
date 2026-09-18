import { apiFetch } from "../client";

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
  mode: string;
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
