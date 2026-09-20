"""
main.py – FastAPI Prediction Service cho iKnowBall.

Endpoints:
  GET  /          – Kiểm tra trạng thái service và phiên bản mô hình
  GET  /health    – Health check
  POST /predict   – Dự đoán kết quả trận đấu (Football & Basketball, Poisson, Spread, Over/Under)
"""

from typing import Literal, Optional, Dict, Any, List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
import uvicorn

from app.ml.predictor import du_doan_tran_dau, MODEL_VERSION

app = FastAPI(
    title="iKnowBall Prediction Service",
    description="ML Prediction Service hỗ trợ Football (Poisson & Logistic) & Basketball (Point Spread & B2B Analysis)",
    version="2.1.0",
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
    sport: Literal["football", "basketball"] = "football"
    homeTeamId: str
    awayTeamId: str
    homeElo: float = Field(default=1500.0, description="Elo đội nhà")
    awayElo: float = Field(default=1500.0, description="Elo đội khách")
    homeRecentForm: float = Field(default=0.5, ge=0.0, le=1.0, description="Phong độ 5 trận đội nhà")
    awayRecentForm: float = Field(default=0.5, ge=0.0, le=1.0, description="Phong độ 5 trận đội khách")
    homeWinRate: float = Field(default=0.5, ge=0.0, le=1.0, description="Tỷ lệ thắng toàn mùa đội nhà")
    awayWinRate: float = Field(default=0.5, ge=0.0, le=1.0, description="Tỷ lệ thắng toàn mùa đội khách")
    h2hMatches: int = Field(default=0, ge=0, description="Số trận đối đầu")
    h2hHomeWinRate: float = Field(default=0.5, ge=0.0, le=1.0, description="Tỷ lệ thắng đối đầu của đội nhà")

    # Mở rộng cho Bóng đá
    homeGoalsAvg: float = Field(default=1.5, description="Bàn thắng trung bình/trận đội nhà")
    awayGoalsAvg: float = Field(default=1.2, description="Bàn thắng trung bình/trận đội khách")
    homeConcededAvg: float = Field(default=1.1, description="Bàn thua trung bình/trận đội nhà")
    awayConcededAvg: float = Field(default=1.4, description="Bàn thua trung bình/trận đội khách")
    homeSpecificForm: float = Field(default=0.5, description="Phong độ riêng tại sân nhà của đội nhà")
    awaySpecificForm: float = Field(default=0.5, description="Phong độ riêng khi làm khách của đội khách")
    homeRestDays: int = Field(default=4, description="Số ngày nghỉ ngơi đội nhà")
    awayRestDays: int = Field(default=4, description="Số ngày nghỉ ngơi đội khách")
    standingsPointsDiff: int = Field(default=0, description="Chênh lệch điểm BXH (Home - Away)")

    # Mở rộng cho Bóng rổ
    homePointsAvg: float = Field(default=112.0, description="Điểm ghi được trung bình/trận đội nhà")
    awayPointsAvg: float = Field(default=110.0, description="Điểm ghi được trung bình/trận đội khách")
    homePointsAgainstAvg: float = Field(default=110.0, description="Điểm thủng lưới trung bình/trận đội nhà")
    awayPointsAgainstAvg: float = Field(default=112.0, description="Điểm thủng lưới trung bình/trận đội khách")
    isHomeB2b: bool = Field(default=False, description="Đội nhà có đá Back-to-Back không")
    isAwayB2b: bool = Field(default=False, description="Đội khách có đá Back-to-Back không")


class PredictionExplanation(BaseModel):
    eloDiff: float
    homeAdvantage: float
    formAdjustment: float
    totalAdjustedDiff: float
    homeTwoWayProb: float
    dominantFactor: str
    h2hMatchesConsidered: int
    modelVersion: str
    scoreDetails: Optional[Dict[str, Any]] = None


class PredictResponse(BaseModel):
    homeWinProb: float
    drawProb: Optional[float] = None
    awayWinProb: float
    predictedOutcome: Literal["HOME_WIN", "DRAW", "AWAY_WIN"]
    explanation: PredictionExplanation
    scoreDetails: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def probabilities_sum_to_one(self):
        total = self.homeWinProb + (self.drawProb or 0.0) + self.awayWinProb
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Probabilities must sum to 1.0, got {total:.5f}")
        return self


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "iKnowBall Prediction Service is running",
        "modelVersion": MODEL_VERSION,
        "framework": "FastAPI + Scikit-Learn Logistic Regression + Poisson/Spread",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "prediction-service",
        "version": "2.1.0",
        "modelVersion": MODEL_VERSION,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest):
    home_form = payload.homeRecentForm if "homeRecentForm" in payload.model_fields_set else payload.homeWinRate
    away_form = payload.awayRecentForm if "awayRecentForm" in payload.model_fields_set else payload.awayWinRate

    ket_qua = du_doan_tran_dau(
        sport=payload.sport,
        home_elo=payload.homeElo,
        away_elo=payload.awayElo,
        home_recent_form=home_form,
        away_recent_form=away_form,
        home_win_rate=payload.homeWinRate,
        away_win_rate=payload.awayWinRate,
        h2h_matches=payload.h2hMatches,
        h2h_home_win_rate=payload.h2hHomeWinRate,
        home_goals_avg=payload.homeGoalsAvg,
        away_goals_avg=payload.awayGoalsAvg,
        home_conceded_avg=payload.homeConcededAvg,
        away_conceded_avg=payload.awayConcededAvg,
        home_specific_form=payload.homeSpecificForm,
        away_specific_form=payload.awaySpecificForm,
        home_rest_days=payload.homeRestDays,
        away_rest_days=payload.awayRestDays,
        standings_points_diff=payload.standingsPointsDiff,
        home_points_avg=payload.homePointsAvg,
        away_points_avg=payload.awayPointsAvg,
        home_points_against_avg=payload.homePointsAgainstAvg,
        away_points_against_avg=payload.awayPointsAgainstAvg,
        is_home_b2b=payload.isHomeB2b,
        is_away_b2b=payload.isAwayB2b,
    )

    return PredictResponse(
        homeWinProb=ket_qua["homeWinProb"],
        drawProb=ket_qua["drawProb"],
        awayWinProb=ket_qua["awayWinProb"],
        predictedOutcome=ket_qua["predictedOutcome"],
        explanation=PredictionExplanation(**ket_qua["explanation"]),
        scoreDetails=ket_qua.get("scoreDetails"),
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
