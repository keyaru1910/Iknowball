"""
main.py – FastAPI Prediction Service cho iKnowBall.

Endpoints:
  GET  /          – Kiểm tra service đang chạy
  GET  /health    – Health check
  POST /predict   – Dự đoán kết quả trận đấu (single match)

Thiết kế:
  - Nhận feature snapshot point-in-time đã được tạo từ dữ liệu TRƯỚC thời điểm trận đấu.
  - Gọi EloModel để tính xác suất và giải thích định lượng các yếu tố.
  - Trả về explanation giúp người dùng hiểu cơ sở dự đoán (Explainability).
"""

from typing import Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
import uvicorn

from app.models.elo_model import predict as elo_predict, MODEL_VERSION
from app.features.feature_extractor import normalize_snapshot

app = FastAPI(
    title="iKnowBall Prediction Service",
    description="ML Prediction Service sử dụng Model Elo-v1 (Explainable Phase 1)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schema ────────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    Feature snapshot point-in-time được tạo từ dữ liệu TRƯỚC thời điểm trận đấu.
    Backend (NestJS) chịu trách nhiệm đảm bảo tính chính xác trước trận.
    """
    sport: Literal["football", "basketball"] = "football"
    homeTeamId: str
    awayTeamId: str
    homeElo: float = Field(default=1500.0, ge=800, le=2200, description="Elo đội nhà tại thời điểm trước trận")
    awayElo: float = Field(default=1500.0, ge=800, le=2200, description="Elo đội khách tại thời điểm trước trận")
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
    drawProb: float | None
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
    return {"message": "iKnowBall Prediction Service is running", "modelVersion": MODEL_VERSION}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "prediction-service",
        "version": "1.0.0",
        "modelVersion": MODEL_VERSION,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest):
    """
    Dự đoán kết quả trận đấu dựa trên feature snapshot point-in-time.

    Mô hình sử dụng:
      - Chênh lệch Elo (Elo Difference)
      - Lợi thế sân nhà (+65 điểm Elo)
      - Phong độ gần đây (5 trận gần nhất)
    """
    # Ưu tiên homeRecentForm nếu có, fallback về homeWinRate
    home_form = payload.homeRecentForm if payload.homeRecentForm != 0.5 else payload.homeWinRate
    away_form = payload.awayRecentForm if payload.awayRecentForm != 0.5 else payload.awayWinRate

    result = elo_predict(
        sport=payload.sport,
        home_elo=payload.homeElo,
        away_elo=payload.awayElo,
        home_recent_form=home_form,
        away_recent_form=away_form,
        h2h_matches=payload.h2hMatches,
    )

    return PredictResponse(
        homeWinProb=result["homeWinProb"],
        drawProb=result["drawProb"],
        awayWinProb=result["awayWinProb"],
        predictedOutcome=result["predictedOutcome"],
        explanation=PredictionExplanation(**result["explanation"]),
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
