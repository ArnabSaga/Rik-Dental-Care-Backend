import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import express, { Application, Request, Response } from "express";

const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates/`));

//* parsers
app.use(express.json());

// origins
// const allowedOrigins = [
//   envVars.FRONTEND_URL,
//   ...(envVars.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
// ].filter(Boolean);

app.use(
  cors({
    // origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-workspace-id", "Cookie"],
    exposedHeaders: ["Content-Type", "Set-Cookie"],
  })
);

app.use(cookieParser());

//* application auth routes
// app.use("/api/auth", toNodeHandler(auth));

//* application routes
// app.use("/api/v1", router);


//* Basic route
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from Rik Dentail Care");
});

//! global error handler

//! not found route

export default app;
