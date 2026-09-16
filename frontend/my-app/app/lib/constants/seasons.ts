/**
 * Danh sách và logic tính toán mùa giải trên toàn bộ hệ thống iKnowBall
 * Hỗ trợ tự động tạo mùa giải mới:
 * - Bóng đá (Football): Bắt đầu mùa mới từ ngày 01/08 hàng năm (tháng 8)
 * - Bóng rổ (Basketball - NBA): Bắt đầu mùa mới từ ngày 20/10 hàng năm (20/10)
 */

export interface SeasonOption {
  /** Giá trị mùa giải chuẩn (dùng để truy vấn API, ví dụ: 2026-2027) */
  value: string;
  /** Nhãn hiển thị ngắn gọn (ví dụ: 26/27) */
  label: string;
  /** Tên đầy đủ của mùa giải (ví dụ: Mùa giải 2026 - 2027) */
  description: string;
}

/**
 * Tính toán mùa giải hiện tại dựa theo môn thể thao và mốc thời gian:
 * - Bóng đá: Từ tháng 8 năm Y đến tháng 7 năm Y+1 là mùa "Y-(Y+1)" (Ví dụ: 08/2026 -> 2026-2027)
 * - Bóng rổ: Từ 20/10 năm Y đến 19/10 năm Y+1 là mùa "Y-(Y+1)" (Ví dụ: trước 20/10/2026 vẫn là 2025-2026)
 * 
 * @param sport - 'football' | 'basketball'
 * @param mocThoiGian - Ngày cần tính (mặc định là thời điểm hiện tại)
 * @returns Chuỗi định dạng mùa giải chuẩn, ví dụ: "2026-2027"
 */
export function layMuaGiaiHienTai(
  sport: "football" | "basketball" = "football",
  mocThoiGian: Date = new Date()
): string {
  const namHienTai = mocThoiGian.getFullYear();
  const thangHienTai = mocThoiGian.getMonth() + 1; // 1-12
  const ngayHienTai = mocThoiGian.getDate(); // 1-31

  let namBatDauMua: number;

  if (sport === "basketball") {
    // Bóng rổ (NBA): Mùa giải mới bắt đầu từ ngày 20 tháng 10
    const daVaoMuaMoi = thangHienTai > 10 || (thangHienTai === 10 && ngayHienTai >= 20);
    namBatDauMua = daVaoMuaMoi ? namHienTai : namHienTai - 1;
  } else {
    // Bóng đá: Mùa giải mới bắt đầu từ ngày 01 tháng 08 (tháng 8)
    const daVaoMuaMoi = thangHienTai >= 8;
    namBatDauMua = daVaoMuaMoi ? namHienTai : namHienTai - 1;
  }

  const namKetThucMua = namBatDauMua + 1;
  return `${namBatDauMua}-${namKetThucMua}`;
}

/**
 * Tự động tạo danh sách các mùa giải để hiển thị trên bộ lọc (SeasonSelector)
 * Mặc định lấy từ mùa giải 2024-2025 đến mùa giải hiện tại
 * (Ví dụ năm 2026 sẽ có 24/25, 25/26, 26/27; khi bước sang tháng 8/2027 sẽ tự động có thêm 27/28)
 * 
 * @param sport - 'football' | 'basketball'
 * @param mocThoiGian - Ngày mốc
 * @param namKhoiDau - Mùa bắt đầu trong hệ thống (mặc định 2024)
 * @returns Danh sách SeasonOption
 */
export function taoDanhSachMuaGiai(
  sport: "football" | "basketball" = "football",
  mocThoiGian: Date = new Date(),
  namKhoiDau: number = 2024
): SeasonOption[] {
  const muaHienTai = layMuaGiaiHienTai(sport, mocThoiGian);
  const namKetThucHienTai = parseInt(muaHienTai.split("-")[0], 10);

  const danhSach: SeasonOption[] = [];

  for (let nam = namKhoiDau; nam <= namKetThucHienTai; nam++) {
    const namSau = nam + 1;
    const value = `${nam}-${namSau}`;
    const label = `${String(nam).slice(-2)}/${String(namSau).slice(-2)}`;
    danhSach.push({
      value,
      label,
      description: `Mùa giải ${nam} - ${namSau}`,
    });
  }

  return danhSach;
}

/** Mùa giải mặc định tính tự động theo thời điểm hiện tại */
export const DEFAULT_SEASON = layMuaGiaiHienTai("football");

/** Danh sách mùa giải bóng đá mặc định */
export const SUPPORTED_SEASONS: SeasonOption[] = taoDanhSachMuaGiai("football");

