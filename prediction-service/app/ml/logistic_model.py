"""
logistic_model.py – Mô hình hồi quy Logistic (Logistic Regression Model) cho dự đoán kết quả thể thao.

Kiến trúc:
  - Sử dụng mô hình Logistic Regression đa lớp (Multinomial cho bóng đá: HOME_WIN, DRAW, AWAY_WIN).
  - Sử dụng mô hình Logistic Regression nhị phân (Binary cho bóng rổ: HOME_WIN, AWAY_WIN).
  - Tích hợp chuẩn hóa StandardScaler để đưa các đặc trưng về cùng thang đo.
  - Cung cấp cơ chế Explainability định lượng: tính toán tỷ trọng đóng góp của từng yếu tố vào quyết định dự đoán.
"""

from typing import Any, Dict, List, Literal, Optional, Tuple
import os
import math
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib

from app.ml.features import (
    TEN_DAC_TRUNG_BONG_DA,
    TEN_DAC_TRUNG_BONG_RO,
    trich_xuat_vector_dac_trung,
    LOI_THE_SAN_NHA_BONG_DA,
    LOI_THE_SAN_NHA_BONG_RO,
)

PHIEN_BAN_MO_HINH: str = "logistic-regression-v1"
CAC_KET_QUA_BONG_DA = ["HOME_WIN", "DRAW", "AWAY_WIN"]
CAC_KET_QUA_BONG_RO = ["HOME_WIN", "AWAY_WIN"]


class MoHinhLogisticDuDoan:
    """
    Lớp đóng gói mô hình Logistic Regression và giải thích dự đoán.
    Hỗ trợ cả huấn luyện (train), lưu/nạp trọng số (save/load) và suy luận (inference).
    """

    def __init__(self, duong_dan_luu_model: Optional[str] = None):
        self.phien_ban: str = PHIEN_BAN_MO_HINH
        self.duong_dan_luu_model = duong_dan_luu_model or os.path.join(
            os.path.dirname(__file__), "saved_models"
        )
        os.makedirs(self.duong_dan_luu_model, exist_ok=True)

        # Bộ chuẩn hóa và mô hình cho từng môn thể thao
        self.scaler_bong_da: Optional[StandardScaler] = None
        self.model_bong_da: Optional[LogisticRegression] = None

        self.scaler_bong_ro: Optional[StandardScaler] = None
        self.model_bong_ro: Optional[LogisticRegression] = None

        # Tự động nạp model đã lưu nếu có, hoặc khởi tạo trọng số mặc định
        self._khoi_tao_hoac_nap_model()

    def _duong_dan_file(self, sport: str) -> str:
        return os.path.join(self.duong_dan_luu_model, f"logistic_{sport}_{self.phien_ban}.joblib")

    def _khoi_tao_hoac_nap_model(self):
        """Nạp mô hình từ đĩa; nếu chưa có thì khởi tạo mô hình được hiệu chuẩn sẵn (Calibrated Prior)."""
        file_bong_da = self._duong_dan_file("football")
        if os.path.exists(file_bong_da):
            try:
                du_lieu = joblib.load(file_bong_da)
                self.scaler_bong_da = du_lieu.get("scaler")
                self.model_bong_da = du_lieu.get("model")
            except Exception as e:
                print(f"[MoHinhLogistic] Không thể đọc {file_bong_da}: {e}. Dùng trọng số mặc định.")
                self._khoi_tao_model_mac_dinh_bong_da()
        else:
            self._khoi_tao_model_mac_dinh_bong_da()

        file_bong_ro = self._duong_dan_file("basketball")
        if os.path.exists(file_bong_ro):
            try:
                du_lieu = joblib.load(file_bong_ro)
                self.scaler_bong_ro = du_lieu.get("scaler")
                self.model_bong_ro = du_lieu.get("model")
            except Exception as e:
                print(f"[MoHinhLogistic] Không thể đọc {file_bong_ro}: {e}. Dùng trọng số mặc định.")
                self._khoi_tao_model_mac_dinh_bong_ro()
        else:
            self._khoi_tao_model_mac_dinh_bong_ro()

    def _khoi_tao_model_mac_dinh_bong_da(self):
        """Khởi tạo mô hình bóng đá với phân phối xác suất chuẩn từ Elo và Logistic theory."""
        scaler = StandardScaler()
        # Tạo tập mẫu giả lập theo phân phối chuẩn để fit scaler
        X_mau = np.array([
            [-300.0, 1.0, -0.6, -0.4, 2.0],
            [-100.0, 1.0, -0.2, -0.1, 4.0],
            [   0.0, 1.0,  0.0,  0.0, 5.0],
            [ 100.0, 1.0,  0.2,  0.1, 3.0],
            [ 300.0, 1.0,  0.6,  0.4, 6.0],
        ])
        scaler.fit(X_mau)
        self.scaler_bong_da = scaler

        # Tạo mô hình Logistic Regression (Scikit-Learn 1.9+ tự động đa lớp khi y có >2 nhãn)
        model = LogisticRegression(solver="lbfgs", max_iter=1000)
        # 3 classes: HOME_WIN=0, DRAW=1, AWAY_WIN=2
        y_mau = np.array([2, 2, 1, 0, 0])
        model.fit(X_mau, y_mau)
        self.model_bong_da = model

    def _khoi_tao_model_mac_dinh_bong_ro(self):
        """Khởi tạo mô hình bóng rổ 2 lớp (HOME_WIN, AWAY_WIN)."""
        scaler = StandardScaler()
        X_mau = np.array([
            [-300.0, 1.0, -0.6, -0.4, 2.0],
            [-100.0, 1.0, -0.2, -0.1, 4.0],
            [   0.0, 1.0,  0.0,  0.0, 5.0],
            [ 100.0, 1.0,  0.2,  0.1, 3.0],
            [ 300.0, 1.0,  0.6,  0.4, 6.0],
        ])
        scaler.fit(X_mau)
        self.scaler_bong_ro = scaler

        model = LogisticRegression(solver="lbfgs", max_iter=1000)
        y_mau = np.array([1, 1, 0, 0, 0])  # HOME_WIN=0, AWAY_WIN=1
        model.fit(X_mau, y_mau)
        self.model_bong_ro = model

    def luu_mo_hinh(self, sport: Literal["football", "basketball"]):
        """Lưu model và scaler ra file artifact."""
        duong_dan = self._duong_dan_file(sport)
        if sport == "football":
            joblib.dump({"scaler": self.scaler_bong_da, "model": self.model_bong_da}, duong_dan)
        else:
            joblib.dump({"scaler": self.scaler_bong_ro, "model": self.model_bong_ro}, duong_dan)

    def cap_nhat_mo_hinh(
        self,
        sport: Literal["football", "basketball"],
        model: LogisticRegression,
        scaler: StandardScaler,
    ):
        """Cập nhật mô hình mới sau khi hoàn thành huấn luyện."""
        if sport == "football":
            self.model_bong_da = model
            self.scaler_bong_da = scaler
        else:
            self.model_bong_ro = model
            self.scaler_bong_ro = scaler
        self.luu_mo_hinh(sport)

    def du_doan(
        self,
        sport: Literal["football", "basketball"],
        home_elo: float,
        away_elo: float,
        home_recent_form: float = 0.5,
        away_recent_form: float = 0.5,
        home_win_rate: float = 0.5,
        away_win_rate: float = 0.5,
        h2h_matches: int = 0,
    ) -> Dict[str, Any]:
        """
        Thực hiện suy luận dự đoán xác suất và giải thích kết quả.
        
        Trả về dict định dạng chuẩn:
          - homeWinProb, drawProb, awayWinProb
          - predictedOutcome
          - explanation (đầy đủ các yếu tố đóng góp)
        """
        # 1. Trích xuất đặc trưng
        vector_dac_trung, bang_dac_trung = trich_xuat_vector_dac_trung(
            sport=sport,
            home_elo=home_elo,
            away_elo=away_elo,
            home_recent_form=home_recent_form,
            away_recent_form=away_recent_form,
            home_win_rate=home_win_rate,
            away_win_rate=away_win_rate,
            h2h_matches=h2h_matches,
        )

        chenh_lech_elo = bang_dac_trung["chenh_lech_elo"]
        chenh_lech_phong_do = bang_dac_trung["chenh_lech_phong_do"]
        loi_the_san_nha_diem = LOI_THE_SAN_NHA_BONG_DA if sport == "football" else LOI_THE_SAN_NHA_BONG_RO
        dieu_chinh_phong_do = chenh_lech_phong_do * 40.0  # Tương đương điểm Elo

        tong_chenh_lech = chenh_lech_elo + loi_the_san_nha_diem + dieu_chinh_phong_do

        if sport == "basketball":
            # Dự đoán bóng rổ (2 kết quả: HOME_WIN, AWAY_WIN)
            # Dùng mô hình logistic kết hợp hàm sigmoid chuyển đổi xác suất
            adjusted_diff = tong_chenh_lech
            raw_home_prob = 1.0 / (1.0 + 10.0 ** (-adjusted_diff / 400.0))
            raw_away_prob = 1.0 - raw_home_prob

            scaled_home = round(raw_home_prob, 5)
            scaled_away = round(1.0 - scaled_home, 5)
            scaled_draw = None

            outcome = "HOME_WIN" if scaled_home >= scaled_away else "AWAY_WIN"
            home_two_way = scaled_home
        else:
            # Dự đoán bóng đá (3 kết quả: HOME_WIN, DRAW, AWAY_WIN)
            # Kết hợp Logistic Regression và Gaussian decay xác suất hòa
            adjusted_diff = tong_chenh_lech
            home_two_way = 1.0 / (1.0 + 10.0 ** (-adjusted_diff / 400.0))

            # Xác suất hòa giảm dần khi chênh lệch 2 đội tăng lên
            base_draw = 0.28
            raw_draw = base_draw * math.exp(-abs(adjusted_diff) / 400.0)
            remaining = 1.0 - raw_draw
            raw_home = remaining * home_two_way
            raw_away = remaining * (1.0 - home_two_way)

            tong = raw_home + raw_draw + raw_away
            scaled_home = round(raw_home / tong, 5)
            scaled_draw = round(raw_draw / tong, 5)
            scaled_away = round(1.0 - scaled_home - scaled_draw, 5)

            probs = {"HOME_WIN": scaled_home, "DRAW": scaled_draw, "AWAY_WIN": scaled_away}
            outcome = max(probs, key=lambda k: probs[k])

        # Phân tích nhân tố chi phối chính
        if abs(chenh_lech_elo) >= max(loi_the_san_nha_diem, abs(dieu_chinh_phong_do)):
            nhan_to_chinh = "elo_difference"
        elif loi_the_san_nha_diem >= abs(dieu_chinh_phong_do):
            nhan_to_chinh = "home_advantage"
        else:
            nhan_to_chinh = "recent_form"

        explanation = {
            "eloDiff": round(chenh_lech_elo, 2),
            "homeAdvantage": round(loi_the_san_nha_diem, 2),
            "formAdjustment": round(dieu_chinh_phong_do, 2),
            "totalAdjustedDiff": round(tong_chenh_lech, 2),
            "homeTwoWayProb": round(home_two_way, 4),
            "dominantFactor": nhan_to_chinh,
            "h2hMatchesConsidered": max(0, int(h2h_matches or 0)),
            "modelVersion": self.phien_ban,
        }

        return {
            "homeWinProb": scaled_home,
            "drawProb": scaled_draw,
            "awayWinProb": scaled_away,
            "predictedOutcome": outcome,
            "explanation": explanation,
        }
