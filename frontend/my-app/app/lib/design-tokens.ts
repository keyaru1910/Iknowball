/**
 * Design tokens dùng chung cho toàn bộ frontend.
 * Giữ màu sắc ở một chỗ duy nhất — component không tự định nghĩa màu riêng.
 */
export const colors = {
  bg: "#0B0E13",
  panel: "#12161D",
  panelAlt: "#161B23",
  border: "#232935",
  borderSoft: "#1B2029",
  text: "#EDEFF3",
  textMuted: "#8890A0",
  textFaint: "#565E6C",

  // Accent chính — dùng cho CTA, số liệu nổi bật, kết quả thắng
  accent: "#2FD98C",
  accentDim: "#1E9A63",

  // Trạng thái "live"
  live: "#F2A93B",

  // Form W/D/L — màu mang thông tin (thắng/hòa/thua), không phải trang trí
  win: "#2FD98C",
  draw: "#565E6C",
  loss: "#E5484D",
} as const;

export type FormResult = "W" | "D" | "L";
export type MatchStatus = "upcoming" | "live" | "finished" | "postponed" | "canceled";
