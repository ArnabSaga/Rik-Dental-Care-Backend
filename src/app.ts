import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import path from "path";
import { envVars } from "./app/config/env";
import { auth } from "./app/lib/auth";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import router from "./app/router";

const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates/`));

//* parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  envVars.FRONTEND_URL,
  ...(envVars.NODE_ENV === "development" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin as string)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Content-Type", "Set-Cookie"],
  })
);

//* application auth routes
app.use("/api/auth", toNodeHandler(auth));

//* application routes
app.use("/api/v1", router);

//* Basic route
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from Rik Dentail Care");
});

//! global error handler
app.use(globalErrorHandler);

//! not found route
app.use(notFound);

export default app;
