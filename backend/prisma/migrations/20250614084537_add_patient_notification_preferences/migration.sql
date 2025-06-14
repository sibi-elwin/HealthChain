-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableWhatsAppNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "enableEmailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableWhatsAppNotifications" BOOLEAN NOT NULL DEFAULT true;
