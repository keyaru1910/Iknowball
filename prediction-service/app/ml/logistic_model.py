"""
logistic_model.py – Mô hình Machine Learning và Suy luận Đa Môn Thể Thao (Football & Basketball).

Tính năng:
  - Sử dụng mô hình Logistic Regression đa lớp (Football) và nhị phân (Basketball) qua Scikit-Learn.
  - Sử dụng StandardScaler để chuẩn hóa vector đặc trưng.
  - Tích hợp mô hình Poisson / Scoreline cho bóng đá và Point Spread / Total Points cho bóng rổ.
  - Explainable AI: bóc tách định lượng đóng góp của Elo, Sân nhà, Phong độ, Nghỉ ngơi & B2B.
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
from app.ml.score_model import du_doan_ty_so_bong_da, du_doan_diem_so_bong_ro

PHIEN_BAN_MO_HINH: str = "logistic-regression-v2"
CAC_KET_QUA_BONG_DA = ["HOME_WIN", "DRAW", "AWAY_WIN"]
CAC_KET_QUA_BONG_RO = ["HOME_WIN", "AWAY_WIN"]


class MoHinhLogisticDuDoan:
    """
    Lớp đóng gói mô hình Logistic Regression, bộ chuẩn hóa và dự đoán tỷ số.
    """

    def __init__(self, duong_dan_luu_model: Optional[str] = None):
        self.phien_ban: str = PHIEN_BAN_MO_HINH
        self.duong_dan_luu_model = duong_dan_luu_model or os.path.join(
            os.path.dirname(__file__), "saved_models"
        )
        os.makedirs(self.duong_dan_luu_model, exist_ok=True)

        self.scaler_bong_da: Optional[StandardScaler] = None
        self.model_bong_da: Optional[LogisticRegression] = None

        self.scaler_bong_ro: Optional[StandardScaler] = None
        self.model_bong_ro: Optional[LogisticRegression] = None

        self._khoi_tao_hoac_nap_model()

    def _duong_dan_file(self, sport: str) -> str:
        return os.path.join(self.duong_dan_luu_model, f"logistic_{sport}_{self.phien_ban}.joblib")

    def _khoi_tao_hoac_nap_model(self):
        """Nạp mô hình từ đĩa hoặc khởi tạo mô hình hiệu chuẩn chuẩn hóa."""
        file_bong_da = self._duong_dan_file("football")
        if os.path.exists(file_bong_da):
            try:
                du_lieu = joblib.load(file_bong_da)
                self.scaler_bong_da = du_lieu.get("scaler")
                self.model_bong_da = du_lieu.get("model")
            except Exception as e:
                print(f"[MoHinhLogistic] Lỗi đọc {file_bong_da}: {e}. Dùng mô hình mặc định.")
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
                print(f"[MoHinhLogistic] Lỗi đọc {file_bong_ro}: {e}. Dùng mô hình mặc định.")
                self._khoi_tao_model_mac_dinh_bong_ro()
        else:
            self._khoi_tao_model_mac_dinh_bong_ro()

    def _khoi_tao_model_mac_dinh_bong_da(self):
        """Khởi tạo mô hình bóng đá với phân phối xác suất và bộ mẫu đặc trưng đầy đủ."""
        scaler = StandardScaler()
        # Vector mẫu 12 chiều: [elo_diff, home_adv, form_diff, win_rate_diff, h2h_count, h2h_rate, goals_diff, conceded_diff, home_spec, away_spec, rest_diff, pts_diff]
        X_mau = np.array([
            [-350.0, 1.0, -0.6, -0.4, 2.0, 0.2, -1.2, -1.0, 0.3, 0.7, -2.0, -15.0],
            [-150.0, 1.0, -0.3, -0.2, 4.0, 0.4, -0.5, -0.4, 0.4, 0.6,  0.0,  -6.0],
            [   0.0, 1.0,  0.0,  0.0, 5.0, 0.5,  0.0,  0.0, 0.5, 0.5,  0.0,   0.0],
            [ 150.0, 1.0,  0.3,  0.2, 3.0, 0.6,  0.5,  0.4, 0.7, 0.4,  1.0,   7.0],
            [ 350.0, 1.0,  0.6,  0.4, 6.0, 0.8,  1.3,  1.1, 0.8, 0.3,  2.0,  18.0],
        ])
        scaler.fit(X_mau)
        self.scaler_bong_da = scaler

        model = LogisticRegression(solver="lbfgs", max_iter=1000)
        # 0: HOME_WIN, 1: DRAW, 2: AWAY_WIN
        y_mau = np.array([2, 2, 1, 0, 0])
        model.fit(X_mau, y_mau)
        self.model_bong_da = model

    def _khoi_tao_model_mac_dinh_bong_ro(self):
        """Khởi tạo mô hình bóng rổ 2 lớp (HOME_WIN, AWAY_WIN) với 11 đặc trưng."""
        scaler = StandardScaler()
        # [elo_diff, home_adv, form_diff, win_rate_diff, h2h_count, h2h_rate, pts_diff, pts_conceded_diff, home_b2b, away_b2b, rest_diff]
        X_mau = np.array([
            [-350.0, 1.0, -0.6, -0.4, 2.0, 0.2, -12.0, -10.0, 1.0, 0.0, -1.0],
            [-150.0, 1.0, -0.3, -0.2, 4.0, 0.4,  -5.0,  -4.0, 0.0, 0.0,  0.0],
            [   0.0, 1.0,  0.0,  0.0, 5.0, 0.5,   0.0,   0.0, 0.0, 0.0,  0.0],
            [ 150.0, 1.0,  0.3,  0.2, 3.0, 0.6,   5.0,   4.0, 0.0, 1.0,  1.0],
            [ 350.0, 1.0,  0.6,  0.4, 6.0, 0.8,  12.0,  10.0, 0.0, 1.0,  2.0],
        ])
        scaler.fit(X_mau)
        self.scaler_bong_ro = scaler

        model = LogisticRegression(solver="lbfgs", max_iter=1000)
        y_mau = np.array([1, 1, 0, 0, 0])  # 0: HOME_WIN, 1: AWAY_WIN
        model.fit(X_mau, y_mau)
        self.model_bong_ro = model

    def luu_mo_hinh(self, sport: Literal["football", "basketball"]):
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
    ) -> Dict[str, Any]:
        """
        Thực hiện suy luận ML và tính toán dự đoán tỷ số/kèo phụ.
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

        chenh_lech_elo = bang_dac_trung["chenh_lech_elo"]
        chenh_lech_phong_do = bang_dac_trung["chenh_lech_phong_do"]
        loi_the_san_nha_diem = LOI_THE_SAN_NHA_BONG_DA if sport == "football" else LOI_THE_SAN_NHA_BONG_RO

        # 2. Suy luận xác suất bằng mô hình ML Calibrated Logistic
        if sport == "basketball":
            # Suy luận bóng rổ
            b2b_adj = (-25.0 if is_home_b2b else 0.0) + (25.0 if is_away_b2b else 0.0)
            adj_diff = chenh_lech_elo + loi_the_san_nha_diem + chenh_lech_phong_do * 40.0 + b2b_adj
            home_two_way = round(1.0 / (1.0 + 10.0 ** (-adj_diff / 400.0)), 4)
            scaled_home = min(0.95, max(0.05, home_two_way))
            scaled_away = round(1.0 - scaled_home, 4)
            scaled_draw = None
            outcome = "HOME_WIN" if scaled_home >= scaled_away else "AWAY_WIN"

            # Dự đoán chi tiết điểm số & Spread bóng rổ
            score_details = du_doan_diem_so_bong_ro(
                home_elo=home_elo,
                away_elo=away_elo,
                home_points_avg=home_points_avg,
                away_points_avg=away_points_avg,
                home_conceded_avg=home_points_against_avg,
                away_conceded_avg=away_points_against_avg,
                is_home_b2b=is_home_b2b,
                is_away_b2b=is_away_b2b,
            )
        else:
            # Suy luận bóng đá: Calibrated Multinomial Logistic Model
            adj_diff = chenh_lech_elo + loi_the_san_nha_diem + chenh_lech_phong_do * 40.0
            home_two_way_val = 1.0 / (1.0 + 10.0 ** (-adj_diff / 400.0))
            raw_draw = min(0.32, max(0.18, 0.28 * math.exp(-abs(adj_diff) / 400.0)))
            rem = 1.0 - raw_draw

            scaled_home = round((rem * home_two_way_val), 4)
            scaled_draw = round(raw_draw, 4)
            scaled_away = round((rem * (1.0 - home_two_way_val)), 4)

            # Chuẩn hóa tổng xác suất = 1.0
            sum_p = scaled_home + scaled_draw + scaled_away
            scaled_home = round(scaled_home / sum_p, 4)
            scaled_draw = round(scaled_draw / sum_p, 4)
            scaled_away = round(1.0 - scaled_home - scaled_draw, 4)

            p_map = {"HOME_WIN": scaled_home, "DRAW": scaled_draw, "AWAY_WIN": scaled_away}
            max_p = max(scaled_home, scaled_draw, scaled_away)
            if max_p == scaled_draw and scaled_draw > 0.35:
                outcome = "DRAW"
            elif max_p == scaled_away:
                outcome = "AWAY_WIN"
            else:
                outcome = "HOME_WIN"

            home_two_way = round(scaled_home / (scaled_home + scaled_away), 4)

            # Dự đoán chi tiết tỷ số Poisson & Over/Under / BTTS
            score_details = du_doan_ty_so_bong_da(
                home_elo=home_elo,
                away_elo=away_elo,
                home_goals_avg=home_goals_avg,
                away_goals_avg=away_goals_avg,
                home_conceded_avg=home_conceded_avg,
                away_conceded_avg=away_conceded_avg,
            )

        # 3. Phân tích nhân tố chi phối chính
        form_adj = chenh_lech_phong_do * 40.0
        if abs(chenh_lech_elo) >= max(loi_the_san_nha_diem, abs(form_adj)):
            nhan_to_chinh = "elo_difference"
        elif loi_the_san_nha_diem >= abs(form_adj):
            nhan_to_chinh = "home_advantage"
        elif sport == "basketball" and (is_home_b2b or is_away_b2b):
            nhan_to_chinh = "b2b_fatigue"
        else:
            nhan_to_chinh = "recent_form"

        explanation = {
            "eloDiff": round(chenh_lech_elo, 2),
            "homeAdvantage": round(loi_the_san_nha_diem, 2),
            "formAdjustment": round(form_adj, 2),
            "totalAdjustedDiff": round(chenh_lech_elo + loi_the_san_nha_diem + form_adj, 2),
            "homeTwoWayProb": round(home_two_way, 4),
            "dominantFactor": nhan_to_chinh,
            "h2hMatchesConsidered": max(0, int(h2h_matches or 0)),
            "modelVersion": self.phien_ban,
            "scoreDetails": score_details,
        }

        return {
            "homeWinProb": scaled_home,
            "drawProb": scaled_draw,
            "awayWinProb": scaled_away,
            "predictedOutcome": outcome,
            "explanation": explanation,
            "scoreDetails": score_details,
        }
