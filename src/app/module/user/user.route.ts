import { Router } from "express";
import { roleMiddleware } from "../../middleware/validateRole";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { requireAuth, USER_ROLE } from "./user.utils";
import { UserValidation } from "./user.validation";

const router = Router();

router.use(requireAuth);

// Current logged-in user routes
router.get("/me", UserController.getMe);

router.put("/me", validateRequest({ body: UserValidation.updateMe }), UserController.updateMe);

router.patch("/me", validateRequest({ body: UserValidation.updateMe }), UserController.updateMe);

// Admin routes
router.get(
  "/",
  roleMiddleware(USER_ROLE.ADMIN),
  validateRequest({ query: UserValidation.getAllUsersQuery }),
  UserController.getAllUsers
);

router.get(
  "/:id",
  roleMiddleware(USER_ROLE.ADMIN),
  validateRequest({ params: UserValidation.idParam }),
  UserController.getUserById
);

router.put(
  "/:id",
  roleMiddleware(USER_ROLE.ADMIN),
  validateRequest({
    params: UserValidation.idParam,
    body: UserValidation.updateByAdmin,
  }),
  UserController.updateUserByAdmin
);

router.patch(
  "/:id",
  roleMiddleware(USER_ROLE.ADMIN),
  validateRequest({
    params: UserValidation.idParam,
    body: UserValidation.updateByAdmin,
  }),
  UserController.updateUserByAdmin
);

router.delete(
  "/:id",
  roleMiddleware(USER_ROLE.ADMIN),
  validateRequest({ params: UserValidation.idParam }),
  UserController.deleteUserByAdmin
);

export const UserRoutes = router;
