/**
 * Danh sách các mùa giải được hỗ trợ trên toàn bộ hệ thống iKnowBall
 * Dùng cho cả Bóng đá (Football) và Bóng rổ (Basketball)
 */

export interface SeasonOption {
  /** Giá trị mùa giải chuẩn (dùng để truy vấn API) */
  value: string;
  /** Nhãn hiển thị ngắn gọn (ví dụ: 24/25) */
  label: string;
  /** Tên đầy đủ của mùa giải (ví dụ: Mùa giải 2024/2025) */
  description: string;
}

export const SUPPORTED_SEASONS: SeasonOption[] = [
  {
    value: "2024-2025",
    label: "24/25",
    description: "Mùa giải 2024 - 2025",
  },
  {
    value: "2025-2026",
    label: "25/26",
    description: "Mùa giải 2025 - 2026",
  },
  {
    value: "2026-2027",
    label: "26/27",
    description: "Mùa giải 2026 - 2027",
  },
];

export const DEFAULT_SEASON = "2025-2026";
