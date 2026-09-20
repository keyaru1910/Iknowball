"""
predictor.py – Giao diện suy luận chính (Prediction Facade) cho toàn bộ prediction-service.

Chức năng:
  - Tiếp nhận yêu cầu dự đoán từ API handler.
  - Điều phối và chuyển giao việc tính toán cho mô hình Machine Learning phù hợp.
  - Hỗ trợ đầy đủ tham số Football & Basketball (Back-to-back, bàn thắng/điểm số TB, Poisson scoreline, Point spread).
"""

from typing import Any, Dict, Literal, Optional
from app.ml.logistic_model import MoHinhLogisticDuDoan, PHIEN_BAN_MO_HINH
from app.models.elo_model import predict as elo_predict

MODEL_VERSION: str = PHIEN_BAN_MO_HINH

_mo_hinh_logistic_instance: Optional[MoHinhLogisticDuDoan] = None


def lay_instance_mo_hinh() -> MoHinhLogisticDuDoan:
    """Khởi tạo hoặc lấy đối tượng Singleton của mô hình Logistic."""
    global _mo_hinh_logistic_instance
    if _mo_hinh_logistic_instance is None:
        _mo_hinh_logistic_instance = MoHinhLogisticDuDoan()
    return _mo_hinh_logistic_instance


def du_doan_tran_dau(
    sport: Literal["football", "basketball"],
    home_elo: float,
    away_elo: float,
    home_recent_form: float = 0.5,
    away_recent_form: float = 0.5,
    home_win_rate: float = 0.5,
    away_win_rate: float = 0.5,
    h2h_matches: int = 0,
    h2h_home_win_rate: float = 0.5,
    # Bóng đá
    home_goals_avg: float = 1.5,
    away_goals_avg: float = 1.2,
    home_conceded_avg: float = 1.1,
    away_conceded_avg: float = 1.4,
    home_specific_form: float = 0.5,
    away_specific_form: float = 0.5,
    home_rest_days: int = 4,
    away_rest_days: int = 4,
    standings_points_diff: int = 0,
    # Bóng rổ
    home_points_avg: float = 112.0,
    away_points_avg: float = 110.0,
    home_points_against_avg: float = 110.0,
    away_points_against_avg: float = 112.0,
    is_home_b2b: bool = False,
    is_away_b2b: bool = False,
    model_type: str = "logistic",
) -> Dict[str, Any]:
    """
    Hàm suy luận dự đoán kết quả trận đấu đa môn thể thao.
    """
    if model_type == "elo":
        return elo_predict(
            sport=sport,
            home_elo=home_elo,
            away_elo=away_elo,
            home_recent_form=home_recent_form,
            away_recent_form=away_recent_form,
            h2h_matches=h2h_matches,
        )

    try:
        mo_hinh = lay_instance_mo_hinh()
        return mo_hinh.du_doan(
            sport=sport,
            home_elo=home_elo,
            away_elo=away_elo,
            home_recent_form=home_recent_form,
            away_recent_form=away_recent_form,
            home_win_rate=home_win_rate,
            away_win_rate=away_win_rate,
            h2h_matches=h2h_matches,
            h2h_home_win_rate=h2h_home_win_rate,
            home_goals_avg=home_goals_avg,
            away_goals_avg=away_goals_avg,
            home_conceded_avg=home_conceded_avg,
            away_conceded_avg=away_conceded_avg,
            home_specific_form=home_specific_form,
            away_specific_form=away_specific_form,
            home_rest_days=home_rest_days,
            away_rest_days=away_rest_days,
            standings_points_diff=standings_points_diff,
            home_points_avg=home_points_avg,
            away_points_avg=away_points_avg,
            home_points_against_avg=home_points_against_avg,
            away_points_against_avg=away_points_against_avg,
            is_home_b2b=is_home_b2b,
            is_away_b2b=is_away_b2b,
        )
    except Exception as e:
        print(f"[du_doan_tran_dau] Error during Logistic prediction ({e}), fallback to Elo.")
        return elo_predict(
            sport=sport,
            home_elo=home_elo,
            away_elo=away_elo,
            home_recent_form=home_recent_form,
            away_recent_form=away_recent_form,
            h2h_matches=h2h_matches,
        )
