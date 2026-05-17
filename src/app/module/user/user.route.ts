import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { validateRole } from "../../middleware/validateRole";
import { UserController } from "./user.controller";
import { requireAuth, USER_ROLE } from "./user.utils";
import { UserValidation } from "./user.validation";

const router = Router();

router.use(requireAuth);

// Current user routes
router.get("/me", UserController.getMe);

router.put("/me", validateRequest({ body: UserValidation.updateMe }), UserController.updateMe);

router.patch("/me", validateRequest({ body: UserValidation.updateMe }), UserController.updateMe);

// Admin routes
router.get(
  "/",
  validateRole(USER_ROLE.ADMIN),
  validateRequest({ query: UserValidation.getAllUsersQuery }),
  UserController.getAllUsers
);

router.get(
  "/:id",
  validateRole(USER_ROLE.ADMIN),
  validateRequest({ params: UserValidation.idParam }),
  UserController.getUserById
);

router.put(
  "/:id",
  validateRole(USER_ROLE.ADMIN),
  validateRequest({
    params: UserValidation.idParam,
    body: UserValidation.updateByAdmin,
  }),
  UserController.updateUserByAdmin
);

router.patch(
  "/:id",
  validateRole(USER_ROLE.ADMIN),
  validateRequest({
    params: UserValidation.idParam,
    body: UserValidation.updateByAdmin,
  }),
  UserController.updateUserByAdmin
);

router.delete(
  "/:id",
  validateRole(USER_ROLE.ADMIN),
  validateRequest({ params: UserValidation.idParam }),
  UserController.deleteUserByAdmin
);

export const UserRoutes = router;
