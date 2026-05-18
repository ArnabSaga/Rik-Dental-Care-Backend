-- CreateIndex
CREATE INDEX "doctor_profile_isDeleted_idx" ON "doctor_profile"("isDeleted");

-- CreateIndex
CREATE INDEX "manager_profile_isDeleted_idx" ON "manager_profile"("isDeleted");

-- CreateIndex
CREATE INDEX "patient_profile_isDeleted_idx" ON "patient_profile"("isDeleted");
