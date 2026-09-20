"""
features.py – Trích xuất và chuẩn hóa vector đặc trưng (Feature Engineering) cho mô hình ML.

Hỗ trợ đầy đủ cho cả Football (Bóng đá) và Basketball (Bóng rổ NBA):
  - Football: Elo, Lợi thế sân nhà, Phong độ 5 trận, Phong độ sân nhà/sân khách riêng,
    Hiệu suất bàn thắng ghi được / thủng lưới, Chênh lệch ngày nghỉ (Rest days),
    Chênh lệch điểm số BXH (Standings gap), Tỷ lệ thắng đối đầu H2H.
  - Basketball: Elo, Lợi thế sân nhà, Phong độ 5 trận, Back-to-back (B2B fatigue),
    Số ngày nghỉ ngơi, Điểm số ghi được / thủng lưới trung bình mùa giải.
"""

from typing import Any, Dict, List, Literal, Optional, Tuple
import numpy as np

# Danh sách tên các đặc trưng sử dụng trong mô hình bóng đá
TEN_DAC_TRUNG_BONG_DA: List[str] = [
    "chenh_lech_elo",
    "loi_the_san_nha",
    "chenh_lech_phong_do",
    "chenh_lech_ty_le_thang",
    "so_tran_doi_dau",
    "ty_le_thang_doi_dau",
    "chenh_lech_ban_thang",
    "chenh_lech_ban_thua",
    "phong_do_san_nha_rieng",
    "phong_do_san_khach_rieng",
    "chenh_lech_ngay_nghi",
    "chenh_lech_diem_bxh",
]

# Danh sách tên các đặc trưng sử dụng trong mô hình bóng rổ
TEN_DAC_TRUNG_BONG_RO: List[str] = [
    "chenh_lech_elo",
    "loi_the_san_nha",
    "chenh_lech_phong_do",
    "chenh_lech_ty_le_thang",
    "so_tran_doi_dau",
    "ty_le_thang_doi_dau",
    "chenh_lech_diem_ghi_duoc",
    "chenh_lech_diem_thung_luoi",
    "doi_nha_back_to_back",
    "doi_khach_back_to_back",
    "chenh_lech_ngay_nghi",
]

# Giá trị mặc định và giới hạn an toàn
ELO_MAC_DINH: float = 1500.0
ELO_TOI_THIEU: float = 800.0
ELO_TOI_DA: float = 2200.0
LOI_THE_SAN_NHA_BONG_DA: float = 65.0  # Tương đương ~65 điểm Elo
LOI_THE_SAN_NHA_BONG_RO: float = 75.0  # Tương đương ~75 điểm Elo


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
    h2h_home_win_rate: float = 0.5,
    # Chỉ số bóng đá mở rộng
    home_goals_avg: float = 1.5,
    away_goals_avg: float = 1.2,
    home_conceded_avg: float = 1.1,
    away_conceded_avg: float = 1.4,
    home_specific_form: float = 0.5,
    away_specific_form: float = 0.5,
    home_rest_days: int = 4,
    away_rest_days: int = 4,
    standings_points_diff: int = 0,
    # Chỉ số bóng rổ mở rộng
    home_points_avg: float = 112.0,
    away_points_avg: float = 110.0,
    home_points_against_avg: float = 110.0,
    away_points_against_avg: float = 112.0,
    is_home_b2b: bool = False,
    is_away_b2b: bool = False,
) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Trích xuất vector đặc trưng số học cho 1 trận đấu (Football hoặc Basketball).
    """
    elo_nha = kep_khoang_elo(home_elo)
    elo_khach = kep_khoang_elo(away_elo)

    # Chênh lệch Elo cơ bản
    chenh_lech_elo = elo_nha - elo_khach
    loi_the_san_nha = 1.0

    # Chênh lệch phong độ gần đây
    phong_do_nha = max(0.0, min(1.0, float(home_recent_form if home_recent_form is not None else 0.5)))
    phong_do_khach = max(0.0, min(1.0, float(away_recent_form if away_recent_form is not None else 0.5)))
    chenh_lech_phong_do = phong_do_nha - phong_do_khach

    # Chênh lệch tỷ lệ thắng mùa giải
    ty_le_thang_nha = max(0.0, min(1.0, float(home_win_rate if home_win_rate is not None else 0.5)))
    ty_le_thang_khach = max(0.0, min(1.0, float(away_win_rate if away_win_rate is not None else 0.5)))
    chenh_lech_ty_le_thang = ty_le_thang_nha - ty_le_thang_khach

    # Đối đầu
    so_tran_h2h = max(0, int(h2h_matches or 0))
    ty_le_h2h = max(0.0, min(1.0, float(h2h_home_win_rate if h2h_home_win_rate is not None else 0.5)))

    # Chênh lệch ngày nghỉ
    rest_diff = float((home_rest_days or 4) - (away_rest_days or 4))

    if sport == "football":
        # Bóng đá
        chenh_lech_ban_thang = float((home_goals_avg or 1.5) - (away_goals_avg or 1.2))
        chenh_lech_ban_thua = float((away_conceded_avg or 1.4) - (home_conceded_avg or 1.1))
        home_spec = max(0.0, min(1.0, float(home_specific_form if home_specific_form is not None else 0.5)))
        away_spec = max(0.0, min(1.0, float(away_specific_form if away_specific_form is not None else 0.5)))
        pts_diff = float(standings_points_diff or 0)

        danh_sach_gia_tri = [
            chenh_lech_elo,
            loi_the_san_nha,
            chenh_lech_phong_do,
            chenh_lech_ty_le_thang,
            float(so_tran_h2h),
            ty_le_h2h,
            chenh_lech_ban_thang,
            chenh_lech_ban_thua,
            home_spec,
            away_spec,
            rest_diff,
            pts_diff,
        ]
        ten_dac_trung = TEN_DAC_TRUNG_BONG_DA
    else:
        # Bóng rổ
        chenh_lech_pts_ghi = float((home_points_avg or 112.0) - (away_points_avg or 110.0))
        chenh_lech_pts_thung = float((away_points_against_avg or 112.0) - (home_points_against_avg or 110.0))
        home_b2b_val = 1.0 if is_home_b2b else 0.0
        away_b2b_val = 1.0 if is_away_b2b else 0.0

        danh_sach_gia_tri = [
            chenh_lech_elo,
            loi_the_san_nha,
            chenh_lech_phong_do,
            chenh_lech_ty_le_thang,
            float(so_tran_h2h),
            ty_le_h2h,
            chenh_lech_pts_ghi,
            chenh_lech_pts_thung,
            home_b2b_val,
            away_b2b_val,
            rest_diff,
        ]
        ten_dac_trung = TEN_DAC_TRUNG_BONG_RO

    bang_dac_trung = {ten: val for ten, val in zip(ten_dac_trung, danh_sach_gia_tri)}
    return np.array(danh_sach_gia_tri, dtype=np.float64), bang_dac_trung
