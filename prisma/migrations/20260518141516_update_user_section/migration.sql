-- AlterTable
ALTER TABLE "patient_profile" ADD COLUMN     "allergy" TEXT,
ADD COLUMN     "medicalCondition" TEXT;

-- CreateIndex
CREATE INDEX "patient_profile_gender_idx" ON "patient_profile"("gender");

-- CreateIndex
CREATE INDEX "patient_profile_bloodGroup_idx" ON "patient_profile"("bloodGroup");
