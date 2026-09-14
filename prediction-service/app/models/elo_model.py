"""
elo_model.py – Triển khai Model Elo-v1 có thể giải thích (Phase 1 Explainable Model).

Mô hình kết hợp 3 yếu tố:
  1. Chênh lệch Elo rating (Elo Difference)
  2. Lợi thế sân nhà (Home Advantage: +65 điểm Elo mặc định)
  3. Phong độ gần đây (Recent Form: dựa trên thống kê 5 trận gần nhất)

Tất cả xác suất được tính từ phân phối Logistic + điều chỉnh xác suất hòa
cho bóng đá (Gaussian decay). Bóng rổ không có DRAW, dùng phân phối 2 chiều.

Ghi chú:
  - Hàm này KHÔNG truy cập database hay dịch vụ ngoài, chỉ nhận snapshot thuần số.
  - Đây là hàm thuần (pure function), không có side-effect.
"""

import math
from typing import Literal

OutcomeLabel = Literal["HOME_WIN", "DRAW", "AWAY_WIN"]

# --- Hằng số cấu hình mô hình ---
HOME_ADVANTAGE: float = 65.0   # Điểm lợi thế sân nhà (tương đương ~65 Elo)
ELO_SCALE: float = 400.0       # Tham số scale của phân phối Logistic (chuẩn Elo)
DRAW_BASE: float = 0.28        # Xác suất hòa cơ bản cho bóng đá (tỷ lệ lịch sử trung bình)
FORM_WEIGHT: float = 40.0      # Ảnh hưởng của phong độ gần đây (điểm Elo tương đương)
MIN_ELO: float = 800.0         # Ngưỡng Elo tối thiểu (clamp)
MAX_ELO: float = 2200.0        # Ngưỡng Elo tối đa (clamp)
MODEL_VERSION: str = "elo-v1"


def _expected_home_win_two_way(home_elo: float, away_elo: float, home_advantage: float = HOME_ADVANTAGE) -> float:
    """Tính xác suất thắng home trong trường hợp 2 kết quả (không tính hòa)."""
    adjusted_diff = home_elo - away_elo + home_advantage
    return 1.0 / (1.0 + 10.0 ** (-adjusted_diff / ELO_SCALE))


def predict(
    sport: Literal["football", "basketball"],
    home_elo: float,
    away_elo: float,
    home_recent_form: float = 0.5,
    away_recent_form: float = 0.5,
    h2h_matches: int = 0,
    home_advantage: float = HOME_ADVANTAGE,
) -> dict:
    """
    Tính toán xác suất dự đoán và giải thích các yếu tố đóng góp.

    Args:
        sport: "football" hoặc "basketball"
        home_elo: Elo rating hiện tại của đội nhà (sẽ được clamp trong [800, 2200])
        away_elo: Elo rating hiện tại của đội khách (sẽ được clamp trong [800, 2200])
        home_recent_form: Tỷ lệ thắng 5 trận gần nhất đội nhà (0.0 – 1.0)
        away_recent_form: Tỷ lệ thắng 5 trận gần nhất đội khách (0.0 – 1.0)
        h2h_matches: Số lượng trận đối đầu lịch sử
        home_advantage: Điểm Elo lợi thế sân nhà

    Returns:
        dict chứa: homeWinProb, drawProb, awayWinProb, predictedOutcome, explanation
    """
    # 1. Clamp Elo rating trong khoảng an toàn [MIN_ELO, MAX_ELO]
    clamped_home_elo = max(MIN_ELO, min(MAX_ELO, float(home_elo)))
    clamped_away_elo = max(MIN_ELO, min(MAX_ELO, float(away_elo)))

    # 2. Tính chênh lệch điều chỉnh (Elo diff + home advantage + form)
    elo_diff = clamped_home_elo - clamped_away_elo
    form_adjustment = (home_recent_form - away_recent_form) * FORM_WEIGHT

    adjusted_diff = elo_diff + home_advantage + form_adjustment
    home_two_way = _expected_home_win_two_way(clamped_home_elo, clamped_away_elo, home_advantage + form_adjustment)

    if sport == "basketball":
        # Bóng rổ: không có hòa, phân phối 2 chiều được scale chuẩn
        home_prob = home_two_way
        away_prob = 1.0 - home_two_way
        draw_prob = None
        
        # Scale chuẩn hóa xác suất
        total_p = home_prob + away_prob
        scaled_home_prob = round(home_prob / total_p, 5)
        scaled_away_prob = round(1.0 - scaled_home_prob, 5)
        scaled_draw_prob = None
    else:
        # Bóng đá: xác suất hòa giảm dần theo khoảng cách Elo (Gaussian decay)
        raw_draw_prob = DRAW_BASE * math.exp(-abs(adjusted_diff) / ELO_SCALE)
        remaining = 1.0 - raw_draw_prob
        raw_home_prob = remaining * home_two_way
        raw_away_prob = remaining * (1.0 - home_two_way)

        # Scale chuẩn hóa tổng 3 xác suất chính xác = 1.0
        total_p = raw_home_prob + raw_draw_prob + raw_away_prob
        scaled_home_prob = round(raw_home_prob / total_p, 5)
        scaled_draw_prob = round(raw_draw_prob / total_p, 5)
        scaled_away_prob = round(1.0 - scaled_home_prob - scaled_draw_prob, 5)

    # Xác định kết quả dự đoán
    probs: dict[OutcomeLabel, float] = {
        "HOME_WIN": scaled_home_prob,
        "DRAW": scaled_draw_prob if scaled_draw_prob is not None else 0.0,
        "AWAY_WIN": scaled_away_prob,
    }
    predicted_outcome: OutcomeLabel = max(probs, key=lambda k: probs[k])  # type: ignore[arg-type]

    # Giải thích chi tiết các yếu tố đóng góp
    explanation = {
        "eloDiff": round(elo_diff, 2),
        "homeAdvantage": round(home_advantage, 2),
        "formAdjustment": round(form_adjustment, 2),
        "totalAdjustedDiff": round(adjusted_diff, 2),
        "homeTwoWayProb": round(home_two_way, 4),
        "dominantFactor": (
            "elo_difference" if abs(elo_diff) >= abs(form_adjustment)
            else "recent_form"
        ),
        "h2hMatchesConsidered": h2h_matches,
        "modelVersion": MODEL_VERSION,
    }

    return {
        "homeWinProb": scaled_home_prob,
        "drawProb": scaled_draw_prob,
        "awayWinProb": scaled_away_prob,
        "predictedOutcome": predicted_outcome,
        "explanation": explanation,
    }
