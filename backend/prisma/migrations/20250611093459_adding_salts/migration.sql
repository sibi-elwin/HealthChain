-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authSalt" TEXT,
ADD COLUMN     "encSalt" TEXT;
