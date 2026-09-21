-- AlterTable
ALTER TABLE "User" DROP COLUMN "verificationCode",
DROP COLUMN "verificationCodeExpiry",
ADD COLUMN "verificationRequestedAt" TIMESTAMP(3);
