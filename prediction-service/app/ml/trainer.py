"""
trainer.py – Module huấn luyện (Training) và đánh giá (Evaluation) mô hình Logistic Regression.

Chức năng:
  - Nhận tập dữ liệu trận đấu (danh sách snapshot hoặc pandas DataFrame).
  - Chuẩn hóa đặc trưng và huấn luyện mô hình LogisticRegression với bộ tham số tối ưu (L2 regularization, solver L-BFGS).
  - Đánh giá trên tập kiểm thử (Test / Validation set): Accuracy, Log Loss, Brier Score.
  - Lưu trữ mô hình vào thư mục artifact `app/ml/saved_models/`.
"""

from typing import Any, Dict, List, Literal, Tuple
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import log_loss, accuracy_score, brier_score_loss
from sklearn.model_selection import train_test_split

from app.ml.features import trich_xuat_vector_dac_trung
from app.ml.logistic_model import MoHinhLogisticDuDoan


def chuan_bi_tap_du_lieu(
    danh_sach_tran_dau: List[Dict[str, Any]],
    sport: Literal["football", "basketball"],
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Chuyển đổi danh sách snapshot trận đấu thành ma trận đặc trưng X và nhãn y.
    
    Nhãn quy ước:
      - Bóng đá: 0: HOME_WIN, 1: DRAW, 2: AWAY_WIN
      - Bóng rổ: 0: HOME_WIN, 1: AWAY_WIN
    """
    X_list: List[np.ndarray] = []
    y_list: List[int] = []

    nhan_bong_da = {"HOME_WIN": 0, "DRAW": 1, "AWAY_WIN": 2}
    nhan_bong_ro = {"HOME_WIN": 0, "AWAY_WIN": 1}

    mapping = nhan_bong_da if sport == "football" else nhan_bong_ro

    for tran in danh_sach_tran_dau:
        ket_qua = tran.get("actualOutcome") or tran.get("outcome")
        if ket_qua not in mapping:
            continue

        vector, _ = trich_xuat_vector_dac_trung(
            sport=sport,
            home_elo=tran.get("homeElo", 1500.0),
            away_elo=tran.get("awayElo", 1500.0),
            home_recent_form=tran.get("homeRecentForm", 0.5),
            away_recent_form=tran.get("awayRecentForm", 0.5),
            home_win_rate=tran.get("homeWinRate", 0.5),
            away_win_rate=tran.get("awayWinRate", 0.5),
            h2h_matches=tran.get("h2hMatches", 0),
        )

        X_list.append(vector)
        y_list.append(mapping[ket_qua])

    if not X_list:
        raise ValueError("Không có dữ liệu hợp lệ để huấn luyện mô hình.")

    return np.array(X_list, dtype=np.float64), np.array(y_list, dtype=np.int64)


def huan_luyen_mo_hinh(
    danh_sach_tran_dau: List[Dict[str, Any]],
    sport: Literal["football", "basketball"] = "football",
    c_regularization: float = 1.0,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Huấn luyện mô hình Logistic Regression và tính toán các chỉ số đánh giá.

    Trả về:
      - Dictionary chứa các chỉ số: accuracy, log_loss, brier_score, sample_size.
    """
    X, y = chuan_bi_tap_du_lieu(danh_sach_tran_dau, sport)

    # Chia tập train và test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y if len(np.unique(y)) > 1 else None
    )

    # Chuẩn hóa đặc trưng
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Huấn luyện mô hình
    if sport == "football":
        model = LogisticRegression(
            C=c_regularization,
            solver="lbfgs",
            max_iter=1000,
            random_state=random_state,
        )
    else:
        model = LogisticRegression(
            C=c_regularization,
            solver="lbfgs",
            max_iter=1000,
            random_state=random_state,
        )

    model.fit(X_train_scaled, y_train)

    # Đánh giá trên tập test
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)

    acc = accuracy_score(y_test, y_pred)
    loss = log_loss(y_test, y_prob)

    # Cập nhật và lưu vào MoHinhLogisticDuDoan
    quan_ly_mo_hinh = MoHinhLogisticDuDoan()
    quan_ly_mo_hinh.cap_nhat_mo_hinh(sport, model, scaler)

    return {
        "sport": sport,
        "sampleSize": len(X),
        "trainSize": len(X_train),
        "testSize": len(X_test),
        "accuracy": round(float(acc), 4),
        "logLoss": round(float(loss), 4),
        "modelVersion": quan_ly_mo_hinh.phien_ban,
    }
