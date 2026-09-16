"""
features.py – Trích xuất và chuẩn hóa vector đặc trưng (Feature Engineering) cho mô hình ML.

Chức năng:
  - Tiếp nhận thông số đầu vào từ snapshot (Elo, phong độ 5 trận, đối đầu H2H, lợi thế sân nhà).
  - Chuẩn hóa và xây dựng vector đặc trưng số học (Feature Vector) sẵn sàng cho mô hình Logistic Regression.
  - Đảm bảo tính toán hoàn toàn độc lập (Pure Functions), không rò rỉ dữ liệu (Zero Data Leakage).
"""

from typing import Any, Dict, List, Literal, Tuple
import numpy as np

# Danh sách tên các đặc trưng sử dụng trong mô hình bóng đá
TEN_DAC_TRUNG_BONG_DA: List[str] = [
    "chenh_lech_elo",            # (home_elo - away_elo)
    "loi_the_san_nha",           # 1.0 nếu là đội nhà, đại diện cho ưu thế sân bãi
    "chenh_lech_phong_do",       # (home_recent_form - away_recent_form)
    "chenh_lech_ty_le_thang",    # (home_win_rate - away_win_rate)
    "so_tran_doi_dau",           # Số trận hai đội từng gặp nhau
]

# Danh sách tên các đặc trưng sử dụng trong mô hình bóng rổ
TEN_DAC_TRUNG_BONG_RO: List[str] = [
    "chenh_lech_elo",
    "loi_the_san_nha",
    "chenh_lech_phong_do",
    "chenh_lech_ty_le_thang",
    "so_tran_doi_dau",
]

# Giá trị mặc định và giới hạn an toàn
ELO_MAC_DINH: float = 1500.0
ELO_TOI_THIEU: float = 800.0
ELO_TOI_DA: float = 2200.0
LOI_THE_SAN_NHA_BONG_DA: float = 65.0  # Tương đương ~65 điểm Elo
LOI_THE_SAN_NHA_BONG_RO: float = 75.0  # Bóng rổ lợi thế sân nhà cao hơn một chút


def kep_khoang_elo(gia_tri_elo: float) -> float:
    """Kẹp giá trị Elo trong khoảng an toàn [800, 2200]."""
    try:
        val = float(gia_tri_elo)
    except (ValueError, TypeError):
        val = ELO_MAC_DINH
    return max(ELO_TOI_THIEU, min(ELO_TOI_DA, val))


def trich_xuat_vector_dac_trung(
    sport: Literal["football", "basketball"],
    home_elo: float,
    away_elo: float,
    home_recent_form: float = 0.5,
    away_recent_form: float = 0.5,
    home_win_rate: float = 0.5,
    away_win_rate: float = 0.5,
    h2h_matches: int = 0,
) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Trích xuất vector đặc trưng số học cho 1 trận đấu.

    Tham số:
      - sport: "football" hoặc "basketball"
      - home_elo: Elo của đội nhà
      - away_elo: Elo của đội khách
      - home_recent_form: Tỷ lệ phong độ 5 trận gần nhất đội nhà [0.0 - 1.0]
      - away_recent_form: Tỷ lệ phong độ 5 trận gần nhất đội khách [0.0 - 1.0]
      - home_win_rate: Tỷ lệ thắng toàn mùa đội nhà [0.0 - 1.0]
      - away_win_rate: Tỷ lệ thắng toàn mùa đội khách [0.0 - 1.0]
      - h2h_matches: Số trận đối đầu trong lịch sử

    Trả về:
      - Vector numpy 1D các giá trị đặc trưng.
      - Dictionary ánh xạ tên đặc trưng sang giá trị thô để phục vụ Explainability.
    """
    elo_nha = kep_khoang_elo(home_elo)
    elo_khach = kep_khoang_elo(away_elo)

    # Chênh lệch Elo cơ bản
    chenh_lech_elo = elo_nha - elo_khach

    # Lợi thế sân nhà theo môn thể thao
    loi_the_san_nha = 1.0

    # Chênh lệch phong độ gần đây
    phong_do_nha = max(0.0, min(1.0, float(home_recent_form if home_recent_form is not None else 0.5)))
    phong_do_khach = max(0.0, min(1.0, float(away_recent_form if away_recent_form is not None else 0.5)))
    chenh_lech_phong_do = phong_do_nha - phong_do_khach

    # Chênh lệch tỷ lệ thắng mùa giải
    ty_le_thang_nha = max(0.0, min(1.0, float(home_win_rate if home_win_rate is not None else 0.5)))
    ty_le_thang_khach = max(0.0, min(1.0, float(away_win_rate if away_win_rate is not None else 0.5)))
    chenh_lech_ty_le_thang = ty_le_thang_nha - ty_le_thang_khach

    # Số trận đối đầu
    so_tran_h2h = max(0, int(h2h_matches or 0))

    danh_sach_gia_tri: List[float] = [
        chenh_lech_elo,
        loi_the_san_nha,
        chenh_lech_phong_do,
        chenh_lech_ty_le_thang,
        float(so_tran_h2h),
    ]

    ten_dac_trung = TEN_DAC_TRUNG_BONG_DA if sport == "football" else TEN_DAC_TRUNG_BONG_RO
    bang_dac_trung = {ten: val for ten, val in zip(ten_dac_trung, danh_sach_gia_tri)}

    return np.array(danh_sach_gia_tri, dtype=np.float64), bang_dac_trung
