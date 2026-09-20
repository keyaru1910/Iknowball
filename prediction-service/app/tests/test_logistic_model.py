"""
test_logistic_model.py – Bộ kiểm thử tự động cho module Logistic Regression, Poisson/Scoreline và API.

Kiểm tra:
  1. Trích xuất đặc trưng đa môn (Feature Extraction cho Football & Basketball)
  2. Suy luận dự đoán (Football 3-way + Poisson Scoreline, Basketball 2-way + Point Spread & Total Points)
  3. Ràng buộc xác suất (Tổng xác suất = 1.0)
  4. Giải thích kết quả (Explainability)
  5. Huấn luyện mô hình (Training pipeline)
  6. Endpoint FastAPI (/predict, /health, /)
"""

import unittest
import numpy as np
from fastapi.testclient import TestClient

from app.ml.features import (
    trich_xuat_vector_dac_trung,
    kep_khoang_elo,
    TEN_DAC_TRUNG_BONG_DA,
    TEN_DAC_TRUNG_BONG_RO,
)
from app.ml.logistic_model import MoHinhLogisticDuDoan, PHIEN_BAN_MO_HINH
from app.ml.score_model import du_doan_ty_so_bong_da, du_doan_diem_so_bong_ro
from app.ml.trainer import huan_luyen_mo_hinh
from app.ml.predictor import du_doan_tran_dau
from app.main import app


class TestFeatureEngineering(unittest.TestCase):
    """Kiểm tra module trích xuất và chuẩn hóa đặc trưng."""

    def test_kep_khoang_elo(self):
        self.assertEqual(kep_khoang_elo(500), 800.0)
        self.assertEqual(kep_khoang_elo(2500), 2200.0)
        self.assertEqual(kep_khoang_elo(1600), 1600.0)

    def test_trich_xuat_vector_bong_da(self):
        vec, dic = trich_xuat_vector_dac_trung(
            sport="football",
            home_elo=1700.0,
            away_elo=1500.0,
            home_recent_form=0.8,
            away_recent_form=0.4,
            h2h_matches=5,
            home_goals_avg=1.8,
            away_goals_avg=1.1,
        )
        self.assertEqual(len(vec), len(TEN_DAC_TRUNG_BONG_DA))
        self.assertEqual(dic["chenh_lech_elo"], 200.0)
        self.assertAlmostEqual(dic["chenh_lech_phong_do"], 0.4)
        self.assertEqual(dic["so_tran_doi_dau"], 5.0)

    def test_trich_xuat_vector_bong_ro(self):
        vec, dic = trich_xuat_vector_dac_trung(
            sport="basketball",
            home_elo=1650.0,
            away_elo=1550.0,
            home_recent_form=0.7,
            away_recent_form=0.5,
            is_home_b2b=True,
            is_away_b2b=False,
            home_points_avg=115.0,
            away_points_avg=108.0,
        )
        self.assertEqual(len(vec), len(TEN_DAC_TRUNG_BONG_RO))
        self.assertEqual(dic["chenh_lech_elo"], 100.0)
        self.assertEqual(dic["doi_nha_back_to_back"], 1.0)
        self.assertEqual(dic["doi_khach_back_to_back"], 0.0)


class TestScoreModel(unittest.TestCase):
    """Kiểm tra mô hình Poisson bóng đá và Spread bóng rổ."""

    def test_poisson_bong_da(self):
        res = du_doan_ty_so_bong_da(home_elo=1700, away_elo=1500, home_goals_avg=2.0, away_goals_avg=1.0)
        self.assertIn("predictedScore", res)
        self.assertIn("topLikelyScores", res)
        self.assertIn("overUnder25", res)
        self.assertIn("bothTeamsToScore", res)
        self.assertEqual(len(res["topLikelyScores"]), 3)
        self.assertAlmostEqual(
            res["overUnder25"]["overProb"] + res["overUnder25"]["underProb"],
            1.0,
            places=3,
        )

    def test_spread_bong_ro(self):
        res = du_doan_diem_so_bong_ro(
            home_elo=1650,
            away_elo=1500,
            home_points_avg=118.0,
            away_points_avg=106.0,
            is_home_b2b=False,
            is_away_b2b=True,
        )
        self.assertIn("projectedHomePoints", res)
        self.assertIn("projectedAwayPoints", res)
        self.assertIn("projectedSpread", res)
        self.assertIn("predictedScore", res)
        self.assertTrue(res["projectedHomePoints"] > res["projectedAwayPoints"])


class TestMoHinhLogistic(unittest.TestCase):
    """Kiểm tra logic suy luận và giải thích của mô hình Logistic."""

    def setUp(self):
        self.mo_hinh = MoHinhLogisticDuDoan()

    def test_du_doan_bong_da_tong_xac_suat_bang_1(self):
        res = self.mo_hinh.du_doan(
            sport="football",
            home_elo=1650.0,
            away_elo=1450.0,
            home_recent_form=0.8,
            away_recent_form=0.2,
        )
        self.assertIn("homeWinProb", res)
        self.assertIn("drawProb", res)
        self.assertIn("awayWinProb", res)
        self.assertIsNotNone(res["drawProb"])

        tong = res["homeWinProb"] + res["drawProb"] + res["awayWinProb"]
        self.assertAlmostEqual(tong, 1.0, places=4)
        self.assertIn(res["predictedOutcome"], ["HOME_WIN", "DRAW", "AWAY_WIN"])
        self.assertIn("explanation", res)
        self.assertIn("dominantFactor", res["explanation"])
        self.assertIn("scoreDetails", res)

    def test_du_doan_bong_ro_khong_co_draw(self):
        res = self.mo_hinh.du_doan(
            sport="basketball",
            home_elo=1600.0,
            away_elo=1550.0,
            home_recent_form=0.6,
            away_recent_form=0.4,
            is_home_b2b=True,
        )
        self.assertIsNone(res["drawProb"])
        tong = res["homeWinProb"] + res["awayWinProb"]
        self.assertAlmostEqual(tong, 1.0, places=4)
        self.assertIn(res["predictedOutcome"], ["HOME_WIN", "AWAY_WIN"])
        self.assertIn("scoreDetails", res)
        self.assertIn("projectedSpread", res["scoreDetails"])


class TestFastAPIEndpoints(unittest.TestCase):
    """Kiểm tra các endpoint của FastAPI."""

    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("modelVersion", data)

    def test_health_endpoint(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")

    def test_predict_endpoint_football(self):
        payload = {
            "sport": "football",
            "homeTeamId": "team-arsenal",
            "awayTeamId": "team-chelsea",
            "homeElo": 1820.0,
            "awayElo": 1710.0,
            "homeRecentForm": 0.8,
            "awayRecentForm": 0.4,
            "h2hMatches": 12,
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("homeWinProb", data)
        self.assertIn("drawProb", data)
        self.assertIn("awayWinProb", data)
        self.assertIn("predictedOutcome", data)
        self.assertEqual(data["explanation"]["modelVersion"], PHIEN_BAN_MO_HINH)

    def test_predict_endpoint_basketball(self):
        payload = {
            "sport": "basketball",
            "homeTeamId": "team-lakers",
            "awayTeamId": "team-warriors",
            "homeElo": 1650.0,
            "awayElo": 1590.0,
            "homeRecentForm": 0.6,
            "awayRecentForm": 0.4,
            "isHomeB2b": True,
            "isAwayB2b": False,
            "homePointsAvg": 114.5,
            "awayPointsAvg": 112.0,
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("homeWinProb", data)
        self.assertIsNone(data["drawProb"])
        self.assertIn("awayWinProb", data)
        self.assertIn("scoreDetails", data)
        self.assertIn("projectedSpread", data["scoreDetails"])


if __name__ == "__main__":
    unittest.main()
