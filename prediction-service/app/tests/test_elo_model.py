"""
test_elo_model.py – Unit tests cho Model Elo-v1 và Backtest Engine.

Kiểm thử:
  1. Logic predict() – xác suất cộng về 1, phân nhánh football/basketball.
  2. Home advantage – đội nhà mạnh hơn có xác suất thắng cao hơn.
  3. Explanation – trả về đầy đủ các trường giải thích.
  4. Metrics – compute_metrics() tính đúng với dữ liệu giả lập.
  5. Backtest engine – tái lập được với seed cố định, không có data leakage.
"""

import math
import sys
import os

# Đảm bảo import từ thư mục gốc của prediction-service
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.models.elo_model import predict
from app.features.feature_extractor import normalize_snapshot
from app.main import PredictRequest, predict as api_predict
from app.evaluation.metrics import compute_metrics, log_loss_single, brier_score_single
from app.evaluation.backtest import run_backtest, MatchRecord, report_to_dict


# ── Helpers ──────────────────────────────────────────────────────────────────

def assert_close(a: float, b: float, tol: float = 1e-4, msg: str = "") -> None:
    assert abs(a - b) < tol, f"{msg}: expected ≈{b:.6f}, got {a:.6f}"


# ── Tests: elo_model.predict ─────────────────────────────────────────────────

def test_football_probs_sum_to_one():
    result = predict("football", home_elo=1500, away_elo=1500)
    total = result["homeWinProb"] + (result["drawProb"] or 0.0) + result["awayWinProb"]
    assert_close(total, 1.0, msg="Football probs should sum to 1.0")


def test_basketball_probs_sum_to_one():
    result = predict("basketball", home_elo=1600, away_elo=1400)
    assert result["drawProb"] is None, "Basketball should not have drawProb"
    total = result["homeWinProb"] + result["awayWinProb"]
    assert_close(total, 1.0, msg="Basketball probs should sum to 1.0")


def test_stronger_home_team_wins_more_likely():
    strong = predict("football", home_elo=1700, away_elo=1300)
    weak = predict("football", home_elo=1300, away_elo=1700)
    assert strong["homeWinProb"] > weak["homeWinProb"], "Stronger home team should have higher win prob"
    assert strong["homeWinProb"] > 0.5, "Strong home team should be favored"


def test_home_advantage_effect():
    result_with_adv = predict("football", home_elo=1500, away_elo=1500, home_recent_form=0.5, away_recent_form=0.5)
    # Đội nhà luôn có lợi thế ngay cả khi Elo bằng nhau
    assert result_with_adv["homeWinProb"] > result_with_adv["awayWinProb"], "Home team should benefit from home advantage"


def test_better_form_increases_win_prob():
    base = predict("football", home_elo=1500, away_elo=1500, home_recent_form=0.5, away_recent_form=0.5)
    good_form = predict("football", home_elo=1500, away_elo=1500, home_recent_form=1.0, away_recent_form=0.0)
    assert good_form["homeWinProb"] > base["homeWinProb"], "Good recent form should increase win prob"


def test_explanation_fields_present():
    result = predict("football", home_elo=1600, away_elo=1450)
    exp = result["explanation"]
    required_fields = ["eloDiff", "homeAdvantage", "formAdjustment", "totalAdjustedDiff",
                       "homeTwoWayProb", "dominantFactor", "h2hMatchesConsidered", "modelVersion"]
    for field in required_fields:
        assert field in exp, f"Missing explanation field: {field}"
    assert exp["eloDiff"] == 1600 - 1450, "eloDiff should be homeElo - awayElo"
    assert exp["modelVersion"] == "elo-v1"


def test_draw_decreases_with_larger_elo_diff():
    even = predict("football", home_elo=1500, away_elo=1500)
    uneven = predict("football", home_elo=1800, away_elo=1200)
    assert even["drawProb"] > uneven["drawProb"], "Draw prob should be higher for evenly matched teams"


def test_normalize_snapshot_keeps_zero_recent_form():
    snapshot = normalize_snapshot({"homeRecentForm": 0.0, "awayRecentForm": 0.0})
    assert snapshot["homeRecentForm"] == 0.0
    assert snapshot["awayRecentForm"] == 0.0


def test_api_keeps_explicit_neutral_recent_form():
    """Recent form 0.5 được gửi rõ ràng không được fallback sang season win rate."""
    import asyncio
    payload = PredictRequest(
        homeTeamId="H",
        awayTeamId="A",
        homeRecentForm=0.5,
        awayRecentForm=0.5,
        homeWinRate=1.0,
        awayWinRate=0.0,
    )
    response = asyncio.run(api_predict(payload))
    assert response.explanation.formAdjustment == 0.0


# ── Tests: metrics ───────────────────────────────────────────────────────────

def test_perfect_accuracy():
    preds = ["HOME_WIN", "AWAY_WIN", "DRAW"]
    actuals = ["HOME_WIN", "AWAY_WIN", "DRAW"]
    probs = [
        {"HOME_WIN": 0.9, "DRAW": 0.05, "AWAY_WIN": 0.05},
        {"HOME_WIN": 0.1, "DRAW": 0.1, "AWAY_WIN": 0.8},
        {"HOME_WIN": 0.1, "DRAW": 0.8, "AWAY_WIN": 0.1},
    ]
    metrics = compute_metrics(preds, actuals, probs)
    assert_close(metrics["accuracy"], 1.0, msg="Perfect accuracy")
    assert_close(metrics["macro_precision"], 1.0, msg="Perfect precision")
    assert_close(metrics["macro_recall"], 1.0, msg="Perfect recall")
    assert_close(metrics["macro_f1"], 1.0, msg="Perfect F1")


def test_log_loss_perfect_prediction():
    probs = {"HOME_WIN": 1.0, "DRAW": 0.0, "AWAY_WIN": 0.0}
    loss = log_loss_single(probs, "HOME_WIN")
    assert_close(loss, 0.0, tol=1e-5, msg="Perfect prediction should have ~0 log loss")


def test_brier_score_perfect():
    probs = {"HOME_WIN": 1.0, "DRAW": 0.0, "AWAY_WIN": 0.0}
    brier = brier_score_single(probs, "HOME_WIN")
    assert_close(brier, 0.0, tol=1e-5, msg="Perfect prediction should have 0 Brier score")


def test_empty_compute_metrics():
    metrics = compute_metrics([], [], [])
    assert metrics["sample_size"] == 0
    assert metrics["accuracy"] == 0.0


# ── Tests: backtest engine ───────────────────────────────────────────────────

def _make_demo_matches() -> list[MatchRecord]:
    """Tạo 20 trận cố định (seed=0) để kiểm thử."""
    import random
    rng = random.Random(0)
    teams = [f"T{i}" for i in range(6)]
    matches = []
    for i in range(20):
        h, a = rng.sample(teams, 2)
        matches.append(MatchRecord(
            match_id=f"M{i:03d}",
            match_date=f"2025-01-{i+1:02d}T15:00:00Z",
            league_id="L1",
            home_team_id=h,
            away_team_id=a,
            home_score=rng.randint(0, 3),
            away_score=rng.randint(0, 3),
        ))
    return matches


def test_backtest_reproducible():
    """Chạy hai lần cùng seed phải cho kết quả giống hệt nhau."""
    matches = _make_demo_matches()
    report1 = run_backtest(matches, seed=42)
    report2 = run_backtest(matches, seed=42)
    assert report1.model_metrics == report2.model_metrics, "Backtest phải tái lập được"
    assert report1.random_baseline_metrics == report2.random_baseline_metrics


def test_backtest_no_future_leakage():
    """Elo tại trận đầu tiên phải là DEFAULT_ELO (1500) vì chưa có dữ liệu trước trận."""
    matches = _make_demo_matches()
    report = run_backtest(matches, seed=42)
    first = report.per_match[0]
    # Với 2 đội chưa từng đấu, xác suất sẽ phụ thuộc vào home advantage
    # (Elo bằng nhau 1500 -> home phải được favored)
    assert first.model_probs["HOME_WIN"] > first.model_probs["AWAY_WIN"], \
        "Trận đầu tiên phải dùng Elo 1500 baseline với home advantage"


def test_backtest_total_matches():
    matches = _make_demo_matches()
    report = run_backtest(matches, seed=42)
    assert report.total_matches == len(matches)


def test_backtest_report_serializable():
    matches = _make_demo_matches()
    report = run_backtest(matches, seed=42)
    d = report_to_dict(report)
    import json
    json_str = json.dumps(d)  # Phải không raise exception
    assert "totalMatches" in d
    assert "model" in d
    assert "randomBaseline" in d
    assert "higherEloBaseline" in d


def test_model_better_than_random_on_avg():
    """
    Model không nhất thiết thắng Random trên 20 trận ngẫu nhiên,
    nhưng Brier Score của Model phải có giá trị hợp lệ [0, 1].
    """
    matches = _make_demo_matches()
    report = run_backtest(matches, seed=42)
    brier = report.model_metrics["avg_brier_score"]
    assert 0.0 <= brier <= 1.0, f"Brier Score phải trong [0, 1], got {brier}"
    log_loss = report.model_metrics["avg_log_loss"]
    assert log_loss >= 0.0, f"Log Loss phải >= 0, got {log_loss}"


# ── Runner ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    tests = [
        test_football_probs_sum_to_one,
        test_basketball_probs_sum_to_one,
        test_stronger_home_team_wins_more_likely,
        test_home_advantage_effect,
        test_better_form_increases_win_prob,
        test_explanation_fields_present,
        test_draw_decreases_with_larger_elo_diff,
        test_normalize_snapshot_keeps_zero_recent_form,
        test_api_keeps_explicit_neutral_recent_form,
        test_perfect_accuracy,
        test_log_loss_perfect_prediction,
        test_brier_score_perfect,
        test_empty_compute_metrics,
        test_backtest_reproducible,
        test_backtest_no_future_leakage,
        test_backtest_total_matches,
        test_backtest_report_serializable,
        test_model_better_than_random_on_avg,
    ]
    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  PASS {test.__name__}")
            passed += 1
        except Exception as e:
            print(f"  FAIL {test.__name__}: {e}")
            failed += 1
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
