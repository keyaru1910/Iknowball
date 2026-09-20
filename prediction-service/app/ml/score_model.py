"""
score_model.py – Mô hình dự đoán tỷ số & các thị trường chuyên sâu (Scoreline, Over/Under, BTTS, Point Spread).

Bao gồm:
  1. Bóng đá: Mô hình phân phối Poisson / Dixon-Coles để tính ma trận xác suất tỷ số,
     Tài/Xỉu (Over/Under 2.5), Cả 2 đội ghi bàn (BTTS).
  2. Bóng rổ: Mô hình dự đoán điểm số kỳ vọng (Expected Points), Kèo chấp điểm (Point Spread),
     Tài/Xỉu tổng điểm trận (Game Total Over/Under).
"""

import math
from typing import Any, Dict, List, Literal, Tuple
import numpy as np


def tinh_poisson(k: int, lamb: float) -> float:
    """Tính xác suất P(X = k) theo phân phối Poisson với kỳ vọng lamb."""
    if lamb <= 0:
        return 1.0 if k == 0 else 0.0
    return (lamb ** k * math.exp(-lamb)) / math.factorial(k)


def du_doan_ty_so_bong_da(
    home_elo: float,
    away_elo: float,
    home_goals_avg: float = 1.5,
    away_goals_avg: float = 1.2,
    home_conceded_avg: float = 1.1,
    away_conceded_avg: float = 1.4,
    home_advantage: float = 0.25,
) -> Dict[str, Any]:
    """
    Dự đoán tỷ số và các thị trường bàn thắng cho trận bóng đá.
    
    Kỳ vọng bàn thắng (Expected Goals - xG):
      - lambda_home = (home_attack / league_avg) * (away_defense / league_avg) * base_home_goals + home_advantage
      - mu_away     = (away_attack / league_avg) * (home_defense / league_avg) * base_away_goals
    """
    elo_diff = home_elo - away_elo
    elo_factor = elo_diff / 400.0  # Tăng/giảm xG dựa trên thực lực Elo

    # Ước lượng lambda (Home) và mu (Away)
    base_home_xg = max(0.4, min(3.8, (home_goals_avg + away_conceded_avg) / 2.0 + home_advantage + elo_factor * 0.4))
    base_away_xg = max(0.3, min(3.5, (away_goals_avg + home_conceded_avg) / 2.0 - elo_factor * 0.4))

    max_goals = 6
    score_matrix = np.zeros((max_goals + 1, max_goals + 1))

    over_25_prob = 0.0
    under_25_prob = 0.0
    btts_yes_prob = 0.0
    btts_no_prob = 0.0

    scores_list: List[Dict[str, Any]] = []

    for h in range(max_goals + 1):
        p_h = tinh_poisson(h, base_home_xg)
        for a in range(max_goals + 1):
            p_a = tinh_poisson(a, base_away_xg)
            prob = p_h * p_a
            score_matrix[h, a] = prob

            if (h + a) > 2.5:
                over_25_prob += prob
            else:
                under_25_prob += prob

            if h > 0 and a > 0:
                btts_yes_prob += prob
            else:
                btts_no_prob += prob

            scores_list.append({
                "score": f"{h}-{a}",
                "homeGoals": h,
                "awayGoals": a,
                "probability": round(float(prob), 4),
            })

    # Sắp xếp lấy Top 3 tỷ số có khả năng xảy ra cao nhất
    scores_list.sort(key=lambda x: x["probability"], reverse=True)
    top_scores = scores_list[:3]

    # Chuẩn hóa Over/Under và BTTS
    total_ou = over_25_prob + under_25_prob
    if total_ou > 0:
        over_25_prob = round(over_25_prob / total_ou, 4)
        under_25_prob = round(1.0 - over_25_prob, 4)

    total_btts = btts_yes_prob + btts_no_prob
    if total_btts > 0:
        btts_yes_prob = round(btts_yes_prob / total_btts, 4)
        btts_no_prob = round(1.0 - btts_yes_prob, 4)

    return {
        "expectedGoalsHome": round(base_home_xg, 2),
        "expectedGoalsAway": round(base_away_xg, 2),
        "projectedTotalGoals": round(base_home_xg + base_away_xg, 2),
        "predictedScore": top_scores[0]["score"] if top_scores else "2-1",
        "topLikelyScores": top_scores,
        "overUnder25": {
            "threshold": 2.5,
            "overProb": over_25_prob,
            "underProb": under_25_prob,
        },
        "bothTeamsToScore": {
            "yesProb": btts_yes_prob,
            "noProb": btts_no_prob,
        },
    }


def du_doan_diem_so_bong_ro(
    home_elo: float,
    away_elo: float,
    home_points_avg: float = 112.0,
    away_points_avg: float = 110.0,
    home_conceded_avg: float = 110.0,
    away_conceded_avg: float = 112.0,
    is_home_b2b: bool = False,
    is_away_b2b: bool = False,
    home_court_advantage_pts: float = 3.2,
) -> Dict[str, Any]:
    """
    Dự đoán điểm số và Kèo chấp (Point Spread) / Tài Xỉu (Over/Under) cho Bóng rổ (NBA).
    """
    elo_diff = home_elo - away_elo
    elo_pts_diff = (elo_diff / 400.0) * 12.0  # 400 Elo chênh lệch ~ 12 điểm bóng rổ

    # Ảnh hưởng của Back-to-Back (mệt mỏi thể lực làm giảm ~2.5 điểm)
    b2b_penalty_home = 2.5 if is_home_b2b else 0.0
    b2b_penalty_away = 2.5 if is_away_b2b else 0.0

    # Dự đoán điểm số 2 đội
    home_exp_pts = (
        (home_points_avg + away_conceded_avg) / 2.0
        + home_court_advantage_pts / 2.0
        + elo_pts_diff / 2.0
        - b2b_penalty_home
    )
    away_exp_pts = (
        (away_points_avg + home_conceded_avg) / 2.0
        - home_court_advantage_pts / 2.0
        - elo_pts_diff / 2.0
        - b2b_penalty_away
    )

    projected_home_pts = round(max(85.0, min(140.0, home_exp_pts)), 1)
    projected_away_pts = round(max(85.0, min(140.0, away_exp_pts)), 1)

    projected_total = round(projected_home_pts + projected_away_pts, 1)
    projected_spread = round(projected_away_pts - projected_home_pts, 1)  # Kèo chấp đội nhà (âm nếu đội nhà chấp)

    # Dự đoán tỷ số làm tròn
    score_home_int = int(round(projected_home_pts))
    score_away_int = int(round(projected_away_pts))
    if score_home_int == score_away_int:
        score_home_int += 1  # Không có hòa trong bóng rổ

    return {
        "projectedHomePoints": projected_home_pts,
        "projectedAwayPoints": projected_away_pts,
        "projectedTotalPoints": projected_total,
        "projectedSpread": projected_spread,  # VD: -4.5 (Home chấp 4.5)
        "predictedScore": f"{score_home_int}-{score_away_int}",
        "overUnderThreshold": projected_total,
        "overProb": 0.50,
        "underProb": 0.50,
        "b2bFactors": {
            "homeIsBackToBack": is_home_b2b,
            "awayIsBackToBack": is_away_b2b,
            "b2bFatiguePenalty": 2.5,
        },
    }
