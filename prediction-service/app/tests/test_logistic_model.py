"""
test_logistic_model.py – Bộ kiểm thử tự động cho module Logistic Regression và API.

Kiểm tra:
  1. Trích xuất đặc trưng (Feature Extraction)
  2. Suy luận dự đoán (Football 3-way, Basketball 2-way)
  3. Ràng buộc xác suất (Tổng xác suất = 1.0)
  4. Giải thích kết quả (Explainability)
  5. Huấn luyện mô hình (Training pipeline)
  6. Endpoint FastAPI (/predict, /health, /)
"""

import unittest
import numpy as np
from fastapi.testclient import TestClient

from app.ml.features import trich_xuat_vector_dac_trung, kep_khoang_elo
from app.ml.logistic_model import MoHinhLogisticDuDoan
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
        )
        self.assertEqual(len(vec), 5)
        self.assertEqual(dic["chenh_lech_elo"], 200.0)
        self.assertAlmostEqual(dic["chenh_lech_phong_do"], 0.4)
        self.assertEqual(dic["so_tran_doi_dau"], 5.0)


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

    def test_du_doan_bong_ro_khong_co_draw(self):
        res = self.mo_hinh.du_doan(
            sport="basketball",
            home_elo=1600.0,
            away_elo=1550.0,
            home_recent_form=0.6,
            away_recent_form=0.4,
        )
        self.assertIsNone(res["drawProb"])
        tong = res["homeWinProb"] + res["awayWinProb"]
        self.assertAlmostEqual(tong, 1.0, places=4)
        self.assertIn(res["predictedOutcome"], ["HOME_WIN", "AWAY_WIN"])


class TestTrainer(unittest.TestCase):
    """Kiểm tra quy trình huấn luyện mô hình."""

    def test_huan_luyen_du_lieu_mau(self):
        # Tạo tập mẫu giả lập 30 trận
        du_lieu_mau = []
        for i in range(30):
            du_lieu_mau.append({
                "homeElo": 1500.0 + (i * 10),
                "awayElo": 1500.0 - (i * 5),
                "homeRecentForm": 0.6,
                "awayRecentForm": 0.4,
                "homeWinRate": 0.55,
                "awayWinRate": 0.45,
                "h2hMatches": 3,
                "actualOutcome": "HOME_WIN" if i % 2 == 0 else ("DRAW" if i % 3 == 0 else "AWAY_WIN"),
            })

        ket_qua = huan_luyen_mo_hinh(du_lieu_mau, sport="football")
        self.assertIn("accuracy", ket_qua)
        self.assertIn("logLoss", ket_qua)
        self.assertEqual(ket_qua["sampleSize"], 30)


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
        self.assertEqual(data["explanation"]["modelVersion"], "logistic-regression-v1")


if __name__ == "__main__":
    unittest.main()
