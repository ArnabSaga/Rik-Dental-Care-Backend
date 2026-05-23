import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { DentalServiceRoutes } from "../module/dentalService/dentalService.route";
import { ProfileRoutes } from "../module/profile/profile.route";
import { UserRoutes } from "../module/user/user.route";
import { AppointmentRoutes } from '../module/appointment/appointment.route';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
