import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { ProfileRoutes } from "../module/profile/profile.route";
import { UserRoutes } from "../module/user/user.route";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
