/*
  Warnings:

  - The values [USER] on the enum `ChatSenderType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `patientId` on the `medical_history` table. All the data in the column will be lost.
  - Added the required column `patientProfileId` to the `medical_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChatSenderType_new" AS ENUM ('PATIENT', 'ADMIN', 'MANAGER', 'AI');
ALTER TABLE "public"."chat_message" ALTER COLUMN "senderType" DROP DEFAULT;
ALTER TABLE "chat_message" ALTER COLUMN "senderType" TYPE "ChatSenderType_new" USING ("senderType"::text::"ChatSenderType_new");
ALTER TYPE "ChatSenderType" RENAME TO "ChatSenderType_old";
ALTER TYPE "ChatSenderType_new" RENAME TO "ChatSenderType";
DROP TYPE "public"."ChatSenderType_old";
ALTER TABLE "chat_message" ALTER COLUMN "senderType" SET DEFAULT 'PATIENT';
COMMIT;

-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'PAYMENT';

-- DropForeignKey
ALTER TABLE "medical_history" DROP CONSTRAINT "medical_history_patientId_fkey";

-- DropIndex
DROP INDEX "medical_history_patientId_idx";

-- AlterTable
ALTER TABLE "chat_message" ALTER COLUMN "senderType" SET DEFAULT 'PATIENT';

-- AlterTable
ALTER TABLE "medical_history" DROP COLUMN "patientId",
ADD COLUMN     "patientProfileId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "conversation_patientId_idx" ON "conversation"("patientId");

-- CreateIndex
CREATE INDEX "medical_history_patientProfileId_idx" ON "medical_history"("patientProfileId");

-- AddForeignKey
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "patient_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
