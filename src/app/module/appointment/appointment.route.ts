import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { requireAuth } from "../user/user.utils";
import { AppointmentController } from "./appointment.controller";
import { AppointmentValidation } from "./appointment.validation";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateRequest({ query: AppointmentValidation.getAppointmentsQuery }),
  AppointmentController.getAppointments
);

router.post(
  "/",
  validateRequest({ body: AppointmentValidation.bookRegularAppointment }),
  AppointmentController.bookRegularAppointment
);

router.post(
  "/emergency",
  validateRequest({ body: AppointmentValidation.bookEmergencyAppointment }),
  AppointmentController.bookEmergencyAppointment
);

router.get(
  "/:id",
  validateRequest({ params: AppointmentValidation.idParam }),
  AppointmentController.getAppointmentById
);

router.put(
  "/:id",
  validateRequest({
    params: AppointmentValidation.idParam,
    body: AppointmentValidation.updateAppointment,
  }),
  AppointmentController.updateAppointment
);

router.patch(
  "/:id",
  validateRequest({
    params: AppointmentValidation.idParam,
    body: AppointmentValidation.updateAppointment,
  }),
  AppointmentController.updateAppointment
);

router.delete(
  "/:id",
  validateRequest({ params: AppointmentValidation.idParam }),
  AppointmentController.deleteAppointment
);

export const AppointmentRoutes = router;
