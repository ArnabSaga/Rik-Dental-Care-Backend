import { Router } from "express";
import { AppointmentRoutes } from "../module/appointment/appointment.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { DentalServiceRoutes } from "../module/dentalService/dentalService.route";
import { InvoiceRoutes } from "../module/invoice/invoice.route";
import { MedicalHistoryRoutes } from "../module/medicalHistory/medicalHistory.route";
import { PrescriptionRoutes } from "../module/prescription/prescription.route";
import { ProfileRoutes } from "../module/profile/profile.route";
import { UserRoutes } from "../module/user/user.route";
import { NotificationRoutes } from '../module/notification/notification.route';

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/profiles",
    route: ProfileRoutes,
  },
  {
    path: "/dental-services",
    route: DentalServiceRoutes,
  },
  {
    path: "/appointments",
    route: AppointmentRoutes,
  },
  {
    path: "/medical-histories",
    route: MedicalHistoryRoutes,
  },
  {
    path: "/prescriptions",
    route: PrescriptionRoutes,
  },
  {
    path: "/invoices",
    route: InvoiceRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
