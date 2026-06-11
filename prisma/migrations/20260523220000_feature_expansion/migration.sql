-- BetPrediction enum: add OVER and UNDER
ALTER TYPE "BetPrediction" ADD VALUE IF NOT EXISTS 'OVER';
ALTER TYPE "BetPrediction" ADD VALUE IF NOT EXISTS 'UNDER';

-- User: responsible gambling + admin role + terms
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role"              TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "selfExcludedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "agreedToTermsAt"   TIMESTAMP(3);

-- Wallet: loss limits
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "dailyLossLimit"  DECIMAL(10,2);
ALTER TABLE "Wallet" ADD COLUMN IF NOT EXISTS "weeklyLossLimit" DECIMAL(10,2);

-- Bet: event type + target value
ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "eventType"    TEXT NOT NULL DEFAULT 'WIN_LOSS';
ALTER TABLE "Bet" ADD COLUMN IF NOT EXISTS "targetValue"  DECIMAL(10,2);
