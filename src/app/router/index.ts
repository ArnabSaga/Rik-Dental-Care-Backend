import { Router } from "express";

const router = Router();

const moduleRoutes: { path: string; route: any }[] = [
  // Future module routes will be added here
];


moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
