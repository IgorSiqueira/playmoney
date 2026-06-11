-- AddColumn bonusBalance and depositBonusClaimed to Wallet
ALTER TABLE "Wallet" ADD COLUMN "bonusBalance" DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD COLUMN "depositBonusClaimed" BOOLEAN NOT NULL DEFAULT false;

-- AddValue BONUS to TransactionType enum
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'BONUS';
