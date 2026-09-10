"""
metrics.py – Các hàm tính toán độ đo đánh giá mô hình dự đoán.

Tất cả hàm đều thuần hàm (pure function), không có side-effect.
Ghi chú:
  - Macro-averaging: tính đều trọng số cho mỗi lớp (HOME_WIN, DRAW, AWAY_WIN).
  - Log-loss dùng clipping 1e-7 để tránh log(0).
  - Brier Score chia cho số lớp để chuẩn hóa về [0, 1].
"""

import math
from typing import Literal, Sequence

OutcomeLabel = Literal["HOME_WIN", "DRAW", "AWAY_WIN"]
LABELS: list[OutcomeLabel] = ["HOME_WIN", "DRAW", "AWAY_WIN"]


def log_loss_single(probs: dict[OutcomeLabel, float], actual: OutcomeLabel) -> float:
    """Log-loss cho một trận đấu đơn lẻ (phối xác suất 3 lớp)."""
    p = max(probs.get(actual, 0.0), 1e-7)
    return -math.log(p)


def brier_score_single(probs: dict[OutcomeLabel, float], actual: OutcomeLabel) -> float:
    """Brier Score cho một trận đấu (chuẩn hóa theo số lớp)."""
    total = sum((probs.get(label, 0.0) - (1.0 if label == actual else 0.0)) ** 2 for label in LABELS)
    return total / len(LABELS)


def compute_metrics(
    predictions: Sequence[OutcomeLabel],
    actuals: Sequence[OutcomeLabel],
    probs_list: Sequence[dict[OutcomeLabel, float]],
) -> dict:
    """
    Tính toán toàn bộ các độ đo đánh giá từ tập kết quả.

    Trả về:
        accuracy, macro_precision, macro_recall, macro_f1,
        avg_log_loss, avg_brier_score, sample_size.
    """
    n = len(predictions)
    if n == 0:
        return {
            "accuracy": 0.0,
            "macro_precision": 0.0,
            "macro_recall": 0.0,
            "macro_f1": 0.0,
            "avg_log_loss": 0.0,
            "avg_brier_score": 0.0,
            "sample_size": 0,
        }

    correct = sum(1 for pred, actual in zip(predictions, actuals) if pred == actual)

    # Macro-average P/R/F1
    per_class: list[dict] = []
    for label in LABELS:
        tp = sum(1 for pred, actual in zip(predictions, actuals) if pred == label and actual == label)
        fp = sum(1 for pred, actual in zip(predictions, actuals) if pred == label and actual != label)
        fn = sum(1 for pred, actual in zip(predictions, actuals) if pred != label and actual == label)
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        per_class.append({"precision": precision, "recall": recall, "f1": f1})

    def macro(key: str) -> float:
        return sum(c[key] for c in per_class) / len(per_class)

    total_log_loss = sum(log_loss_single(probs, actual) for probs, actual in zip(probs_list, actuals))
    total_brier = sum(brier_score_single(probs, actual) for probs, actual in zip(probs_list, actuals))

    return {
        "accuracy": correct / n,
        "macro_precision": macro("precision"),
        "macro_recall": macro("recall"),
        "macro_f1": macro("f1"),
        "avg_log_loss": total_log_loss / n,
        "avg_brier_score": total_brier / n,
        "sample_size": n,
    }
