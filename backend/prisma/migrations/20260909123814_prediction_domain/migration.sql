-- CreateEnum
CREATE TYPE "PredictionOutcome" AS ENUM ('HOME_WIN', 'DRAW', 'AWAY_WIN');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "eloProcessedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "homeWinProb" DECIMAL(6,5) NOT NULL,
    "drawProb" DECIMAL(6,5),
    "awayWinProb" DECIMAL(6,5) NOT NULL,
    "predictedOutcome" "PredictionOutcome" NOT NULL,
    "featuresSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionResult" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "actualOutcome" "PredictionOutcome" NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "logLoss" DECIMAL(10,7) NOT NULL,
    "brierScore" DECIMAL(10,7) NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelPerformance" (
    "id" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "leagueId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "accuracy" DECIMAL(6,5) NOT NULL,
    "precision" DECIMAL(6,5) NOT NULL,
    "recall" DECIMAL(6,5) NOT NULL,
    "f1" DECIMAL(6,5) NOT NULL,
    "avgLogLoss" DECIMAL(10,7) NOT NULL,
    "avgBrierScore" DECIMAL(10,7) NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "viewedOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_matchId_modelVersion_key" ON "Prediction"("matchId", "modelVersion");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionResult_predictionId_key" ON "PredictionResult"("predictionId");

-- CreateIndex
CREATE INDEX "PredictionResult_predictionId_idx" ON "PredictionResult"("predictionId");

-- CreateIndex
CREATE INDEX "ModelPerformance_leagueId_periodStart_idx" ON "ModelPerformance"("leagueId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "ModelPerformance_modelVersion_leagueId_periodStart_periodEn_key" ON "ModelPerformance"("modelVersion", "leagueId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "PredictionView_userId_viewedOn_idx" ON "PredictionView"("userId", "viewedOn");

-- CreateIndex
CREATE UNIQUE INDEX "PredictionView_userId_predictionId_viewedOn_key" ON "PredictionView"("userId", "predictionId", "viewedOn");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionResult" ADD CONSTRAINT "PredictionResult_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelPerformance" ADD CONSTRAINT "ModelPerformance_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionView" ADD CONSTRAINT "PredictionView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionView" ADD CONSTRAINT "PredictionView_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
