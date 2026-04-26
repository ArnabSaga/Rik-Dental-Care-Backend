/*
  Warnings:

  - A unique constraint covering the columns `[appointmentNo]` on the table `appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,dayOfWeek,startTime,endTime]` on the table `doctor_availability` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceNo]` on the table `invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appointmentNo` to the `appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNo` to the `invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `treatment_plan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MedicalHistoryType" AS ENUM ('ALLERGY', 'SURGERY', 'DISEASE', 'MEDICATION', 'DENTAL_HISTORY', 'OTHER');

-- AlterTable
ALTER TABLE "appointment" ADD COLUMN     "appointmentNo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "patientId" TEXT;

-- AlterTable
ALTER TABLE "invoice" ADD COLUMN     "invoiceNo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "medical_history" ADD COLUMN     "allergy" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "medication" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" "MedicalHistoryType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "treatment_plan" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "appointment_appointmentNo_key" ON "appointment"("appointmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_availability_userId_dayOfWeek_startTime_endTime_key" ON "doctor_availability"("userId", "dayOfWeek", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_invoiceNo_key" ON "invoice"("invoiceNo");

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan" ADD CONSTRAINT "treatment_plan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan" ADD CONSTRAINT "treatment_plan_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
