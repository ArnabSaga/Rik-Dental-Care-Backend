import { Role } from "../../../generated/prisma/enums";

export const USER_ROLE = {
  ADMIN: Role.ADMIN,
  PATIENT: Role.PATIENT,
  MANAGER: Role.MANAGER,
} as const;
