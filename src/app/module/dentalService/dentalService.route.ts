import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { validateRole } from "../../middleware/validateRole";
import { requireAuth } from "../user/user.utils";
import { DentalServiceController } from "./dentalService.controller";
import { DENTAL_SERVICE_ROLE } from "./dentalService.utils";
import { DentalServiceValidation } from "./dentalService.validation";

const router = Router();

// Public active service routes
router.get(
  "/public",
  validateRequest({ query: DentalServiceValidation.getAllDentalServicesQuery }),
  DentalServiceController.getActiveDentalServices,
);

router.get(
  "/public/slug/:slug",
  DentalServiceController.getDentalServiceBySlug,
);

router.get(
  "/public/:id",
  validateRequest({ params: DentalServiceValidation.idParam }),
  DentalServiceController.getDentalServiceById,
);

// Protected routes
router.use(requireAuth);

// Admin/Manager can view all services, including inactive
router.get(
  "/",
  validateRole(DENTAL_SERVICE_ROLE.ADMIN, DENTAL_SERVICE_ROLE.MANAGER),
  validateRequest({ query: DentalServiceValidation.getAllDentalServicesQuery }),
  DentalServiceController.getAllDentalServices,
);

// Admin can create service
router.post(
  "/",
  validateRole(DENTAL_SERVICE_ROLE.ADMIN),
  validateRequest({ body: DentalServiceValidation.createDentalService }),
  DentalServiceController.createDentalService,
);

// Admin/Manager can view one service
router.get(
  "/:id",
  validateRole(DENTAL_SERVICE_ROLE.ADMIN, DENTAL_SERVICE_ROLE.MANAGER),
  validateRequest({ params: DentalServiceValidation.idParam }),
  DentalServiceController.getDentalServiceById,
);

// Admin can update service
router.put(
  "/:id",
  validateRole(DENTAL_SERVICE_ROLE.ADMIN),
  validateRequest({
    params: DentalServiceValidation.idParam,
    body: DentalServiceValidation.updateDentalService,
  }),
  DentalServiceController.updateDentalService,
);

router.patch(
  "/:id",
  validateRole(DENTAL_SERVICE_ROLE.ADMIN),
  validateRequest({
    params: DentalServiceValidation.idParam,
    body: DentalServiceValidation.updateDentalService,
  }),
  DentalServiceController.updateDentalService,
);

// Admin can activate/deactivate service
router.patch(
  "/:id/status",
  validateRole(DENTAL_SERVICE_ROLE.ADMIN),
  validateRequest({
    params: DentalServiceValidation.idParam,
    body: DentalServiceValidation.updateDentalServiceStatus,
  }),
  DentalServiceController.updateDentalServiceStatus,
);

// Admin can soft delete service
router.delete(
  "/:id",
  validateRole(DENTAL_SERVICE_ROLE.ADMIN),
  validateRequest({ params: DentalServiceValidation.idParam }),
  DentalServiceController.deleteDentalService,
);

export const DentalServiceRoutes = router;
