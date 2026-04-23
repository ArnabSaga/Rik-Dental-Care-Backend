import dotenv from "dotenv";
import status from "http-status";
import AppError from "../errors/AppError";

dotenv.config();

interface EnvVars {
  NODE_ENV: string;
  PORT: string;
}

const normalizeUrl = (url: string) => (url.endsWith("/") ? url.slice(0, -1) : url);

const envVariables = (): EnvVars => {
  const requiredEnvVars = ["NODE_ENV", "PORT"];

  requiredEnvVars.forEach((variable) => {
    if (!process.env[variable]) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        `Environment variable {${variable}} is required but not defined in .env file.`
      );
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: process.env.PORT as string,
  };
};

export const envVars = envVariables();
