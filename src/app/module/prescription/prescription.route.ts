import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { fileUpload } from "../../utils/fileUpload";
import { requireAuth } from "../user/user.utils";
import { PrescriptionController } from "./prescription.controller";
import { PrescriptionValidation } from "./prescription.validation";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateRequest({ query: PrescriptionValidation.getPrescriptionsQuery }),
  PrescriptionController.getPrescriptions
);

router.post(
  "/",
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({ body: PrescriptionValidation.createPrescription }),
  PrescriptionController.createPrescription
);

router.get(
  "/appointment/:appointmentId",
  validateRequest({ params: PrescriptionValidation.appointmentIdParam }),
  PrescriptionController.getPrescriptionByAppointmentId
);

router.get(
  "/:id",
  validateRequest({ params: PrescriptionValidation.idParam }),
  PrescriptionController.getPrescriptionById
);

router.put(
  "/:id",
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({
    params: PrescriptionValidation.idParam,
    body: PrescriptionValidation.updatePrescription,
  }),
  PrescriptionController.updatePrescription
);

router.patch(
  "/:id",
  fileUpload.uploadTaskAttachment.single("attachmentFile"),
  validateRequest({
    params: PrescriptionValidation.idParam,
    body: PrescriptionValidation.updatePrescription,
  }),
  PrescriptionController.updatePrescription
);

router.delete(
  "/:id",
  validateRequest({ params: PrescriptionValidation.idParam }),
  PrescriptionController.deletePrescription
);

export const PrescriptionRoutes = router;
