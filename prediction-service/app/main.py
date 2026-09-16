"""
main.py – FastAPI Prediction Service cho iKnowBall.

Endpoints:
  GET  /          – Kiểm tra trạng thái service và phiên bản mô hình
  GET  /health    – Health check
  POST /predict   – Dự đoán kết quả trận đấu (sử dụng module Machine Learning độc lập)

Thiết kế:
  - Tách biệt hoàn toàn tầng API (FastAPI) và tầng nghiệp vụ Machine Learning (app/ml).
  - Nhận feature snapshot point-in-time đã được tạo từ dữ liệu TRƯỚC thời điểm trận đấu (Zero Data Leakage).
  - Trả về explanation giúp người dùng hiểu cơ sở định lượng của dự đoán (Explainable AI).
"""

from typing import Literal, Optional, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
import uvicorn

from app.ml.predictor import du_doan_tran_dau, MODEL_VERSION

app = FastAPI(
    title="iKnowBall Prediction Service",
    description="ML Prediction Service sử dụng Logistic Regression & Feature Engineering (Explainable AI)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schema Yêu Cầu & Phản Hồi ──────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    Feature snapshot point-in-time được tạo từ dữ liệu TRƯỚC thời điểm trận đấu.
    Backend (NestJS) chịu trách nhiệm đảm bảo tính chính xác trước trận.
    """
    sport: Literal["football", "basketball"] = "football"
    homeTeamId: str
    awayTeamId: str
    homeElo: float = Field(default=1500.0, description="Elo đội nhà tại thời điểm trước trận (tự động clamp 800-2200)")
    awayElo: float = Field(default=1500.0, description="Elo đội khách tại thời điểm trước trận (tự động clamp 800-2200)")
    homeRecentForm: float = Field(default=0.5, ge=0.0, le=1.0, description="Tỷ lệ thắng 5 trận gần nhất đội nhà (trước trận)")
    awayRecentForm: float = Field(default=0.5, ge=0.0, le=1.0, description="Tỷ lệ thắng 5 trận gần nhất đội khách (trước trận)")
    # Giữ tương thích với schema cũ
    homeWinRate: float = Field(default=0.5, ge=0, le=1, description="Tỷ lệ thắng toàn mùa đội nhà (fallback)")
    awayWinRate: float = Field(default=0.5, ge=0, le=1, description="Tỷ lệ thắng toàn mùa đội khách (fallback)")
    h2hMatches: int = Field(default=0, ge=0, description="Số trận đối đầu lịch sử")


class PredictionExplanation(BaseModel):
    """Giải thích định lượng các yếu tố đóng góp vào dự đoán."""
    eloDiff: float
    homeAdvantage: float
    formAdjustment: float
    totalAdjustedDiff: float
    homeTwoWayProb: float
    dominantFactor: str
    h2hMatchesConsidered: int
    modelVersion: str


class PredictResponse(BaseModel):
    homeWinProb: float
    drawProb: Optional[float] = None
    awayWinProb: float
    predictedOutcome: Literal["HOME_WIN", "DRAW", "AWAY_WIN"]
    explanation: PredictionExplanation

    @model_validator(mode="after")
    def probabilities_sum_to_one(self):
        total = self.homeWinProb + (self.drawProb or 0.0) + self.awayWinProb
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Probabilities must sum to 1.0, got {total:.5f}")
        return self


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Kiểm tra service và model version."""
    return {
        "message": "iKnowBall Prediction Service is running",
        "modelVersion": MODEL_VERSION,
        "framework": "FastAPI + Scikit-Learn Logistic Regression",
    }


@app.get("/health")
async def health_check():
    """Kiểm tra tình trạng hoạt động (Health check)."""
    return {
        "status": "healthy",
        "service": "prediction-service",
        "version": "2.0.0",
        "modelVersion": MODEL_VERSION,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest):
    """
    Dự đoán kết quả trận đấu dựa trên feature snapshot point-in-time.
    Gọi module ML độc lập trong app/ml.
    """
    home_form = payload.homeRecentForm if "homeRecentForm" in payload.model_fields_set else payload.homeWinRate
    away_form = payload.awayRecentForm if "awayRecentForm" in payload.model_fields_set else payload.awayWinRate

    # Gọi qua module suy luận riêng biệt
    ket_qua = du_doan_tran_dau(
        sport=payload.sport,
        home_elo=payload.homeElo,
        away_elo=payload.awayElo,
        home_recent_form=home_form,
        away_recent_form=away_form,
        home_win_rate=payload.homeWinRate,
        away_win_rate=payload.awayWinRate,
        h2h_matches=payload.h2hMatches,
    )

    return PredictResponse(
        homeWinProb=ket_qua["homeWinProb"],
        drawProb=ket_qua["drawProb"],
        awayWinProb=ket_qua["awayWinProb"],
        predictedOutcome=ket_qua["predictedOutcome"],
        explanation=PredictionExplanation(**ket_qua["explanation"]),
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
