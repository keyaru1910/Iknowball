-- A competition is reusable across seasons; fixtures own their season.
ALTER TABLE "Match" ADD COLUMN "season" TEXT;

UPDATE "Match"
SET "season" = "League"."season"
FROM "League"
WHERE "Match"."leagueId" = "League"."id";

ALTER TABLE "Match" ALTER COLUMN "season" SET NOT NULL;
CREATE INDEX "Match_leagueId_season_idx" ON "Match"("leagueId", "season");
