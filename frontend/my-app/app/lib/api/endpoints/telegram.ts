import { apiFetch } from "../client";

export interface TelegramStatus {
  isConnected: boolean;
  telegramChatId: string | null;
  telegramUsername: string | null;
  telegramConnectedAt: string | null;
  botUsername: string;
  vipGroupInviteLink: string;
  hasPendingToken: boolean;
}

export interface TelegramConnectTokenResponse {
  token: string;
  botUsername: string;
  deepLink: string;
  qrCodeUrl: string;
}

export async function getTelegramStatus(): Promise<TelegramStatus> {
  const { data } = await apiFetch<TelegramStatus>("/telegram/status", {
    method: "GET",
  });
  return data;
}

export async function generateTelegramConnectToken(): Promise<TelegramConnectTokenResponse> {
  const { data } = await apiFetch<TelegramConnectTokenResponse>("/telegram/connect-token", {
    method: "POST",
  });
  return data;
}

export async function disconnectTelegram(): Promise<{ success: boolean; message: string }> {
  const { data } = await apiFetch<{ success: boolean; message: string }>("/telegram/disconnect", {
    method: "POST",
  });
  return data;
}

export async function sendTelegramTestNotification(): Promise<{ success: boolean; message: string }> {
  const { data } = await apiFetch<{ success: boolean; message: string }>("/telegram/test-notification", {
    method: "POST",
  });
  return data;
}

export async function simulateTelegramConnect(telegramUsername?: string): Promise<any> {
  const { data } = await apiFetch<any>("/telegram/simulate-connect", {
    method: "POST",
    body: JSON.stringify({ telegramUsername }),
  });
  return data;
}
