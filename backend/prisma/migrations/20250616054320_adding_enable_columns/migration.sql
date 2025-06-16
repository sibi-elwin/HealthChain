-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableWhatsAppNotifications" BOOLEAN NOT NULL DEFAULT true;
