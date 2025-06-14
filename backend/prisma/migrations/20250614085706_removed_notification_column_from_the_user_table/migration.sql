/*
  Warnings:

  - You are about to drop the column `enableEmailNotifications` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `enableWhatsAppNotifications` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "enableEmailNotifications",
DROP COLUMN "enableWhatsAppNotifications";
