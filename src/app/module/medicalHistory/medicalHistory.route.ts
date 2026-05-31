import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { fileUpload } from "../../utils/fileUpload";
import { requireAuth } from "../user/user.utils";
import { MedicalHistoryController } from "./medicalHistory.controller";
import { MedicalHistoryValidation } from "./medicalHistory.validation";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateRequest({ query: MedicalHistoryValidation.getMedicalHistoryQuery }),
  MedicalHistoryController.getMedicalHistories,
);

router.post(
  "/",
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({ body: MedicalHistoryValidation.createMedicalHistory }),
  MedicalHistoryController.createMedicalHistory,
);

router.get(
  "/:id",
  validateRequest({ params: MedicalHistoryValidation.idParam }),
  MedicalHistoryController.getMedicalHistoryById,
);

router.put(
  "/:id",
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({
    params: MedicalHistoryValidation.idParam,
    body: MedicalHistoryValidation.updateMedicalHistory,
  }),
  MedicalHistoryController.updateMedicalHistory,
);

router.patch(
  "/:id",
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({
    params: MedicalHistoryValidation.idParam,
    body: MedicalHistoryValidation.updateMedicalHistory,
  }),
  MedicalHistoryController.updateMedicalHistory,
);

router.delete(
  "/:id",
  validateRequest({ params: MedicalHistoryValidation.idParam }),
  MedicalHistoryController.deleteMedicalHistory,
);

export const MedicalHistoryRoutes = router;
