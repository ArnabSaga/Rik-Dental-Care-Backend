import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { validateRole } from "../../middleware/validateRole";
import { requireAuth } from "../user/user.utils";
import { ProfileController } from "./profile.controller";
import { PROFILE_ROLE } from "./profile.utils";
import { ProfileValidation } from "./profile.validation";

const router = Router();

router.use(requireAuth);

// Logged-in user profile status
router.get("/me", ProfileController.getMyProfile);

// Patient profile completion route
router.put(
  "/me/patient",
  validateRole(PROFILE_ROLE.PATIENT),
  validateRequest({ body: ProfileValidation.patientProfile }),
  ProfileController.upsertMyPatientProfile,
);

router.patch(
  "/me/patient",
  validateRole(PROFILE_ROLE.PATIENT),
  validateRequest({ body: ProfileValidation.patientProfile }),
  ProfileController.upsertMyPatientProfile,
);

// Doctor/Admin profile route
router.put(
  "/me/doctor",
  validateRole(PROFILE_ROLE.ADMIN),
  validateRequest({ body: ProfileValidation.doctorProfile }),
  ProfileController.upsertMyDoctorProfile,
);

router.patch(
  "/me/doctor",
  validateRole(PROFILE_ROLE.ADMIN),
  validateRequest({ body: ProfileValidation.doctorProfile }),
  ProfileController.upsertMyDoctorProfile,
);

// Manager profile route
router.put(
  "/me/manager",
  validateRole(PROFILE_ROLE.MANAGER),
  validateRequest({ body: ProfileValidation.managerProfile }),
  ProfileController.upsertMyManagerProfile,
);

router.patch(
  "/me/manager",
  validateRole(PROFILE_ROLE.MANAGER),
  validateRequest({ body: ProfileValidation.managerProfile }),
  ProfileController.upsertMyManagerProfile,
);

// Admin/Manager patient profile access
router.get(
  "/patients",
  validateRole(PROFILE_ROLE.ADMIN, PROFILE_ROLE.MANAGER),
  validateRequest({ query: ProfileValidation.patientProfileQuery }),
  ProfileController.getAllPatientProfiles,
);

router.get(
  "/patients/:id",
  validateRole(PROFILE_ROLE.ADMIN, PROFILE_ROLE.MANAGER),
  validateRequest({ params: ProfileValidation.idParam }),
  ProfileController.getPatientProfileById,
);

router.get(
  "/patients/user/:userId",
  validateRole(PROFILE_ROLE.ADMIN, PROFILE_ROLE.MANAGER),
  validateRequest({ params: ProfileValidation.userIdParam }),
  ProfileController.getPatientProfileByUserId,
);

export const ProfileRoutes = router;
