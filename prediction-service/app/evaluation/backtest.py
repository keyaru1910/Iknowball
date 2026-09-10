"""
backtest.py – Engine Backtest Walk-Forward tái lập được cho iKnowBall.

Mục tiêu:
  - Mô phỏng dự đoán theo trình tự thời gian lịch sử (walk-forward).
  - So sánh 3 phương pháp: Model Elo-v1 | Random Baseline | Higher-Elo Baseline.
  - Chống Data Leakage tuyệt đối: mỗi trận chỉ thấy thông tin TRƯỚC thời điểm matchDate.
  - Có thể chạy độc lập qua CLI hoặc được gọi bởi Backend API.

Cách chạy CLI:
  python -m app.evaluation.backtest --demo
  python -m app.evaluation.backtest --matches-json matches.json
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
from dataclasses import dataclass, field
from typing import Literal

from app.evaluation.metrics import compute_metrics, OutcomeLabel, LABELS
from app.models.elo_model import predict as elo_predict, HOME_ADVANTAGE, ELO_SCALE

# ── Hằng số ──────────────────────────────────────────────────────────────────
DEFAULT_ELO = 1500.0
K_FACTOR_HIGH = 32.0   # K-factor cho đội mới (< 30 trận)
K_FACTOR_LOW = 20.0    # K-factor cho đội cựu (>= 30 trận)
ELO_THRESHOLD = 30     # Ngưỡng số trận để chuyển K-factor


# ── Data Structures ───────────────────────────────────────────────────────────
@dataclass
class MatchRecord:
    """Một bản ghi trận đấu lịch sử (đã có kết quả thực tế)."""
    match_id: str
    match_date: str          # ISO 8601 string – dùng để sắp xếp thứ tự
    league_id: str
    home_team_id: str
    away_team_id: str
    home_score: int
    away_score: int
    sport: Literal["football", "basketball"] = "football"


@dataclass
class TeamEloState:
    """Trạng thái Elo của một đội tại một thời điểm."""
    elo: float = DEFAULT_ELO
    matches_played: int = 0
    recent_results: list[float] = field(default_factory=list)  # 1.0=win, 0.5=draw, 0.0=loss

    def recent_form(self, n: int = 5) -> float:
        """Tỷ lệ thắng trung bình của n trận gần nhất."""
        recent = self.recent_results[-n:]
        return sum(recent) / len(recent) if recent else 0.5

    def k_factor(self) -> float:
        return K_FACTOR_HIGH if self.matches_played < ELO_THRESHOLD else K_FACTOR_LOW


@dataclass
class SingleMatchResult:
    """Kết quả dự đoán và thực tế của một trận đấu trong Backtest."""
    match_id: str
    match_date: str
    league_id: str
    actual: OutcomeLabel
    # Model
    model_prediction: OutcomeLabel
    model_probs: dict[OutcomeLabel, float]
    # Baseline: Random
    random_prediction: OutcomeLabel
    random_probs: dict[OutcomeLabel, float]
    # Baseline: Higher-Elo
    higher_elo_prediction: OutcomeLabel
    higher_elo_probs: dict[OutcomeLabel, float]


@dataclass
class BacktestReport:
    """Báo cáo tổng hợp của một phiên Backtest."""
    total_matches: int
    model_metrics: dict
    random_baseline_metrics: dict
    higher_elo_baseline_metrics: dict
    improvement_over_random: dict      # model - random (chênh lệch)
    improvement_over_higher_elo: dict  # model - higher_elo (chênh lệch)
    per_match: list[SingleMatchResult]


# ── Core Engine ───────────────────────────────────────────────────────────────

def _actual_outcome(home_score: int, away_score: int) -> OutcomeLabel:
    if home_score > away_score:
        return "HOME_WIN"
    elif home_score < away_score:
        return "AWAY_WIN"
    return "DRAW"


def _update_elo(
    home_state: TeamEloState,
    away_state: TeamEloState,
    actual: OutcomeLabel,
) -> tuple[float, float]:
    """Cập nhật Elo sau trận. Trả về (new_home_elo, new_away_elo)."""
    k = max(home_state.k_factor(), away_state.k_factor())
    expected_home = 1.0 / (1.0 + 10.0 ** (-(home_state.elo - away_state.elo + HOME_ADVANTAGE) / ELO_SCALE))
    result_val = {"HOME_WIN": 1.0, "DRAW": 0.5, "AWAY_WIN": 0.0}[actual]
    delta = k * (result_val - expected_home)
    return round(home_state.elo + delta, 2), round(away_state.elo - delta, 2)


def _random_prediction(sport: Literal["football", "basketball"]) -> tuple[OutcomeLabel, dict[OutcomeLabel, float]]:
    """Baseline ngẫu nhiên đồng đều (Random Guessing)."""
    if sport == "basketball":
        prob = random.random()
        return ("HOME_WIN" if prob > 0.5 else "AWAY_WIN", {"HOME_WIN": prob, "DRAW": 0.0, "AWAY_WIN": 1 - prob})
    p_h = random.random()
    p_d = random.random() * (1 - p_h)
    p_a = 1 - p_h - p_d
    outcome = max({"HOME_WIN": p_h, "DRAW": p_d, "AWAY_WIN": p_a}, key=lambda k: {"HOME_WIN": p_h, "DRAW": p_d, "AWAY_WIN": p_a}[k])
    return outcome, {"HOME_WIN": p_h, "DRAW": p_d, "AWAY_WIN": p_a}  # type: ignore[return-value]


def _higher_elo_prediction(
    home_elo: float,
    away_elo: float,
    sport: Literal["football", "basketball"],
) -> tuple[OutcomeLabel, dict[OutcomeLabel, float]]:
    """
    Baseline 'Đội Elo cao hơn luôn thắng'.
    Vẫn dùng xác suất Elo cơ bản không có Form, nhưng quyết định dựa trên Elo thuần túy.
    """
    raw_home_prob = 1.0 / (1.0 + 10.0 ** (-(home_elo - away_elo + HOME_ADVANTAGE) / ELO_SCALE))
    if sport == "basketball":
        outcome: OutcomeLabel = "HOME_WIN" if raw_home_prob >= 0.5 else "AWAY_WIN"
        return outcome, {"HOME_WIN": raw_home_prob, "DRAW": 0.0, "AWAY_WIN": 1 - raw_home_prob}
    draw_p = 0.28 * math.exp(-abs(home_elo - away_elo + HOME_ADVANTAGE) / ELO_SCALE)
    remaining = 1.0 - draw_p
    home_p = remaining * raw_home_prob
    away_p = remaining * (1.0 - raw_home_prob)
    probs = {"HOME_WIN": home_p, "DRAW": draw_p, "AWAY_WIN": away_p}
    outcome = max(probs, key=lambda k: probs[k])  # type: ignore[arg-type]
    return outcome, probs  # type: ignore[return-value]


def run_backtest(
    matches: list[MatchRecord],
    seed: int = 42,
) -> BacktestReport:
    """
    Chạy backtest walk-forward trên danh sách trận đấu đã có kết quả.

    Quy trình:
      1. Sắp xếp trận theo `match_date` (tăng dần) và `match_id` để đảm bảo tái lập được.
      2. Tại mỗi trận, snapshot Elo TRƯỚC trận, rồi tạo dự đoán.
      3. Sau đó mới cập nhật Elo theo kết quả thực tế (chống data leakage).

    Args:
        matches: Danh sách MatchRecord đã có kết quả.
        seed: Seed ngẫu nhiên cho Baseline Random (tái lập được).
    """
    random.seed(seed)
    matches_sorted = sorted(matches, key=lambda m: (m.match_date, m.match_id))

    elo_states: dict[str, TeamEloState] = {}

    per_match_results: list[SingleMatchResult] = []
    model_preds: list[OutcomeLabel] = []
    model_probs_list: list[dict] = []
    random_preds: list[OutcomeLabel] = []
    random_probs_list: list[dict] = []
    higher_preds: list[OutcomeLabel] = []
    higher_probs_list: list[dict] = []
    actuals: list[OutcomeLabel] = []

    for match in matches_sorted:
        home_state = elo_states.setdefault(match.home_team_id, TeamEloState())
        away_state = elo_states.setdefault(match.away_team_id, TeamEloState())

        # --- SNAPSHOT TRƯỚC TRẬN (không rò rỉ dữ liệu) ---
        home_elo_snapshot = home_state.elo
        away_elo_snapshot = away_state.elo
        home_form_snapshot = home_state.recent_form()
        away_form_snapshot = away_state.recent_form()

        # --- Model Elo-v1 Prediction ---
        model_result = elo_predict(
            sport=match.sport,
            home_elo=home_elo_snapshot,
            away_elo=away_elo_snapshot,
            home_recent_form=home_form_snapshot,
            away_recent_form=away_form_snapshot,
            h2h_matches=0,
        )
        model_pred: OutcomeLabel = model_result["predictedOutcome"]  # type: ignore[assignment]
        model_prob = {
            "HOME_WIN": model_result["homeWinProb"],
            "DRAW": model_result["drawProb"] or 0.0,
            "AWAY_WIN": model_result["awayWinProb"],
        }

        # --- Baseline Random ---
        rand_pred, rand_prob = _random_prediction(match.sport)

        # --- Baseline Higher-Elo ---
        higher_pred, higher_prob = _higher_elo_prediction(home_elo_snapshot, away_elo_snapshot, match.sport)

        # --- Kết quả thực tế ---
        actual = _actual_outcome(match.home_score, match.away_score)

        per_match_results.append(SingleMatchResult(
            match_id=match.match_id,
            match_date=match.match_date,
            league_id=match.league_id,
            actual=actual,
            model_prediction=model_pred,
            model_probs=model_prob,
            random_prediction=rand_pred,
            random_probs=rand_prob,
            higher_elo_prediction=higher_pred,
            higher_elo_probs=higher_prob,
        ))
        model_preds.append(model_pred)
        model_probs_list.append(model_prob)
        random_preds.append(rand_pred)
        random_probs_list.append(rand_prob)
        higher_preds.append(higher_pred)
        higher_probs_list.append(higher_prob)
        actuals.append(actual)

        # --- Cập nhật Elo SAU TRẬN (walk-forward) ---
        new_home_elo, new_away_elo = _update_elo(home_state, away_state, actual)
        home_state.elo = new_home_elo
        away_state.elo = new_away_elo
        result_val = {"HOME_WIN": 1.0, "DRAW": 0.5, "AWAY_WIN": 0.0}[actual]
        home_state.recent_results.append(result_val)
        away_state.recent_results.append(1.0 - result_val if actual != "DRAW" else 0.5)
        home_state.matches_played += 1
        away_state.matches_played += 1

    # --- Tổng hợp Metrics ---
    model_metrics = compute_metrics(model_preds, actuals, model_probs_list)
    random_metrics = compute_metrics(random_preds, actuals, random_probs_list)
    higher_metrics = compute_metrics(higher_preds, actuals, higher_probs_list)

    def improvement(model_m: dict, baseline_m: dict) -> dict:
        keys = ["accuracy", "macro_precision", "macro_recall", "macro_f1"]
        return {k: round(model_m[k] - baseline_m[k], 5) for k in keys}

    return BacktestReport(
        total_matches=len(matches_sorted),
        model_metrics=model_metrics,
        random_baseline_metrics=random_metrics,
        higher_elo_baseline_metrics=higher_metrics,
        improvement_over_random=improvement(model_metrics, random_metrics),
        improvement_over_higher_elo=improvement(model_metrics, higher_metrics),
        per_match=per_match_results,
    )


def report_to_dict(report: BacktestReport) -> dict:
    """Chuyển BacktestReport sang dict JSON-serializable."""
    return {
        "totalMatches": report.total_matches,
        "model": report.model_metrics,
        "randomBaseline": report.random_baseline_metrics,
        "higherEloBaseline": report.higher_elo_baseline_metrics,
        "improvementOverRandom": report.improvement_over_random,
        "improvementOverHigherElo": report.improvement_over_higher_elo,
        "perMatch": [
            {
                "matchId": r.match_id,
                "matchDate": r.match_date,
                "leagueId": r.league_id,
                "actual": r.actual,
                "model": {"prediction": r.model_prediction, "probs": r.model_probs},
                "random": {"prediction": r.random_prediction, "probs": r.random_probs},
                "higherElo": {"prediction": r.higher_elo_prediction, "probs": r.higher_elo_probs},
            }
            for r in report.per_match
        ],
    }


# ── CLI Demo ──────────────────────────────────────────────────────────────────
def _generate_demo_matches(n: int = 50, seed: int = 42) -> list[MatchRecord]:
    """Tạo n trận đấu mẫu ngẫu nhiên để kiểm thử CLI."""
    rng = random.Random(seed)
    teams = [f"TEAM_{i:02d}" for i in range(8)]
    matches = []
    for i in range(n):
        home, away = rng.sample(teams, 2)
        home_score = rng.randint(0, 4)
        away_score = rng.randint(0, 4)
        date = f"2025-{(i // 4 + 1):02d}-{(i % 28 + 1):02d}T15:00:00Z"
        matches.append(MatchRecord(
            match_id=f"DEMO_{i:04d}",
            match_date=date,
            league_id="LEAGUE_DEMO",
            home_team_id=home,
            away_team_id=away,
            home_score=home_score,
            away_score=away_score,
        ))
    return matches


def _cli_main() -> None:
    parser = argparse.ArgumentParser(description="iKnowBall Backtest Engine")
    parser.add_argument("--demo", action="store_true", help="Chạy demo với dữ liệu giả lập 50 trận")
    parser.add_argument("--matches-json", type=str, help="Đường dẫn tới file JSON danh sách trận đấu")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (mặc định: 42)")
    args = parser.parse_args()

    if args.demo:
        matches = _generate_demo_matches(seed=args.seed)
    elif args.matches_json:
        with open(args.matches_json, "r", encoding="utf-8") as f:
            raw = json.load(f)
        matches = [MatchRecord(**m) for m in raw]
    else:
        parser.print_help()
        sys.exit(1)

    report = run_backtest(matches, seed=args.seed)
    result = report_to_dict(report)
    # In tóm tắt
    print("\n" + "=" * 60)
    print(f"  iKnowBall Backtest Report  |  Seed: {args.seed}")
    print("=" * 60)
    print(f"  Tổng số trận đã backtest: {result['totalMatches']}")
    print()
    headers = ["Phương pháp", "Accuracy", "Macro F1", "Log Loss", "Brier"]
    rows = [
        ("Model Elo-v1", result["model"]),
        ("Random Baseline", result["randomBaseline"]),
        ("Higher-Elo Baseline", result["higherEloBaseline"]),
    ]
    print(f"  {'Phương pháp':<22} {'Accuracy':>9} {'Macro F1':>9} {'Log Loss':>9} {'Brier':>8}")
    print("  " + "-" * 62)
    for name, m in rows:
        print(f"  {name:<22} {m['accuracy']:>8.3f}  {m['macro_f1']:>8.3f}  {m['avg_log_loss']:>8.3f}  {m['avg_brier_score']:>7.3f}")
    print()
    print("  Cải thiện so với Random Baseline:")
    impr = result["improvementOverRandom"]
    print(f"    Accuracy: {impr['accuracy']:+.4f}  |  Macro F1: {impr['macro_f1']:+.4f}")
    print("  Cải thiện so với Higher-Elo Baseline:")
    impr2 = result["improvementOverHigherElo"]
    print(f"    Accuracy: {impr2['accuracy']:+.4f}  |  Macro F1: {impr2['macro_f1']:+.4f}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    _cli_main()
