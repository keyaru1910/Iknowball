from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Prediction Service",
    description="ML Prediction Service for IKnowBall",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Prediction Service is running"}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "prediction-service",
        "version": "1.0.0"
    }


@app.get("/api/v1/predict")
async def predict():
    return {"message": "Prediction endpoint - coming soon"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
