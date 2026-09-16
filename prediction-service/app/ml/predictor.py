"""
predictor.py – Giao diện suy luận chính (Prediction Facade) cho toàn bộ prediction-service.

Chức năng:
  - Tiếp nhận yêu cầu dự đoán từ API handler.
  - Điều phối và chuyển giao việc tính toán cho mô hình Machine Learning phù hợp.
  - Đảm bảo tính toán độc lập, an toàn và có cơ chế dự phòng (Fallback) nếu xảy ra ngoại lệ.
"""

from typing import Any, Dict, Literal, Optional
from app.ml.logistic_model import MoHinhLogisticDuDoan, PHIEN_BAN_MO_HINH
from app.models.elo_model import predict as elo_predict

MODEL_VERSION: str = PHIEN_BAN_MO_HINH

# Singleton instance của mô hình Logistic
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
    model_type: str = "logistic",
) -> Dict[str, Any]:
    """
    Hàm suy luận dự đoán kết quả trận đấu.

    Tham số:
      - sport: "football" hoặc "basketball"
      - home_elo, away_elo: Điểm Elo của hai đội
      - home_recent_form, away_recent_form: Phong độ 5 trận gần nhất [0.0 - 1.0]
      - home_win_rate, away_win_rate: Tỷ lệ thắng toàn mùa [0.0 - 1.0]
      - h2h_matches: Số trận đối đầu lịch sử
      - model_type: "logistic" (mặc định) hoặc "elo"

    Trả về:
      Dict chứa: homeWinProb, drawProb, awayWinProb, predictedOutcome, explanation
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
        )
    except Exception as e:
        # Fallback an toàn sang elo_predict nếu có sự cố
        print(f"[du_doan_tran_dau] Error during Logistic prediction ({e}), fallback to Elo.")
        return elo_predict(
            sport=sport,
            home_elo=home_elo,
            away_elo=away_elo,
            home_recent_form=home_recent_form,
            away_recent_form=away_recent_form,
            h2h_matches=h2h_matches,
        )
