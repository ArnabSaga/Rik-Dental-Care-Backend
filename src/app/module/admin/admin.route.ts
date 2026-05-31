import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { validateRole } from "../../middleware/validateRole";
import { requireAuth } from "../user/user.utils";
import { AdminController } from "./admin.controller";
import { ADMIN_ROLE } from "./admin.utils";
import { AdminValidation } from "./admin.validation";

const router = Router();

router.use(requireAuth);
router.use(validateRole(ADMIN_ROLE.ADMIN));

router.get("/dashboard", AdminController.getDashboardStats);

router.get(
  "/users",
  validateRequest({ query: AdminValidation.getUsersQuery }),
  AdminController.getUsers,
);

router.get(
  "/appointments",
  validateRequest({ query: AdminValidation.getAppointmentsQuery }),
  AdminController.getAppointments,
);

router.get(
  "/appointments/:id",
  validateRequest({ params: AdminValidation.idParam }),
  AdminController.getAppointmentById,
);

router.post(
  "/appointments",
  validateRequest({ body: AdminValidation.createAppointment }),
  AdminController.createAppointment,
);

export const AdminRoutes = router;
