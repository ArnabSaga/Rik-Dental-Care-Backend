import { Status } from "../../../generated/prisma/enums";

export const USER_STATUS = {
  ACTIVE: Status.ACTIVE,
  INACTIVE: Status.INACTIVE,
  BLOCKED: Status.BLOCKED,
} as const;
