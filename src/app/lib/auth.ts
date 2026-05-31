import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, oAuthProxy } from "better-auth/plugins";

import { envVars } from "../config/env";
import { sendEmail } from "../utils/emailTemplate";
import { prisma } from "./prisma";

const USER_ROLE = {
  ADMIN: "ADMIN",
  PATIENT: "PATIENT",
  MANAGER: "MANAGER",
} as const;

const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;

const normalizeUrl = (url: string) => url.replace(/\/$/, "");

const trustedOrigins = [
  envVars.FRONTEND_URL,
  ...(envVars.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
]
  .filter(Boolean)
  .map((origin) => normalizeUrl(origin));

const sendOtpEmail = async (options: {
  email: string;
  name?: string | null;
  otp: string;
  subject: string;
}) => {
  await sendEmail({
    to: options.email,
    subject: options.subject,
    templateName: "otp",
    templateData: {
      name: options.name?.trim() || "there",
      otp: options.otp,
      expiryMinutes: 3,
      appName: "Rik Dental Care",
    },
    text: `Your OTP is ${options.otp}. It expires in 3 minutes.`,
  });
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: envVars.BETTER_AUTH_SECRET,
  baseURL: normalizeUrl(envVars.BETTER_AUTH_URL),
  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,

      mapProfileToUser: () => ({
        role: USER_ROLE.PATIENT,
        status: USER_STATUS.ACTIVE,
        isActive: true,
        emailVerified: true,
        isDeleted: false,
        deletedAt: null,
      }),
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: USER_ROLE.PATIENT,
      },

      status: {
        type: "string",
        required: true,
        defaultValue: USER_STATUS.ACTIVE,
      },

      phone: {
        type: "string",
        required: false,
        defaultValue: null,
      },

      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },

      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },

      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    },
  },

  plugins: [
    oAuthProxy(),

    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 3 * 60,

      async sendVerificationOTP({ email, otp, type }) {
        const normalizedEmail = email.trim().toLowerCase();

        console.log(
          `[AUTH][OTP] callback hit | type=${type} | email=${normalizedEmail}`,
        );

        try {
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: normalizedEmail,
                mode: "insensitive",
              },
            },
            select: {
              name: true,
              emailVerified: true,
              isActive: true,
              isDeleted: true,
            },
          });

          if (user?.isDeleted) {
            console.warn(
              `[AUTH][OTP] skipped deleted user: ${normalizedEmail}`,
            );
            return;
          }

          if (user && !user.isActive) {
            console.warn(
              `[AUTH][OTP] skipped inactive user: ${normalizedEmail}`,
            );
            return;
          }

          if (type === "email-verification") {
            await sendOtpEmail({
              email: normalizedEmail,
              name: user?.name,
              otp,
              subject: "Verify your email with Rik Dental Care",
            });

            console.log(
              `[AUTH][OTP] verification OTP email sent to ${normalizedEmail}`,
            );
            return;
          }

          if (type === "forget-password") {
            await sendOtpEmail({
              email: normalizedEmail,
              name: user?.name,
              otp,
              subject: "Password Reset OTP",
            });

            console.log(
              `[AUTH][OTP] password reset OTP email sent to ${normalizedEmail}`,
            );
            return;
          }

          console.warn(`[AUTH][OTP] unsupported OTP type: ${type}`);
        } catch (error) {
          console.error("[AUTH][OTP] sendVerificationOTP failed:", error);
          throw error;
        }
      },
    }),
  ],

  redirectURLs: {
    signIn: `${normalizeUrl(envVars.BETTER_AUTH_URL)}/api/v1/auth/google/success`,
  },

  advanced: {
    useSecureCookies: envVars.NODE_ENV === "production",
    cookies: {
      session_token: {
        name: "rik_dental_care_session",
        attributes: {
          httpOnly: true,
          secure: envVars.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        },
      },
    },
  },
});
