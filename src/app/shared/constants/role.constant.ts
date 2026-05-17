export const USER_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

export type TUserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
