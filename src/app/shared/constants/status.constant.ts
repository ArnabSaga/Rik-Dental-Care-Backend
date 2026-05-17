export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;

export type TUserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
