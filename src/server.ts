import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import { prisma } from "./app/lib/prisma";

let server: Server | undefined;

async function main() {
  try {
    // Connect database before starting server
    await prisma.$connect();
    console.log("🗃️ Database connected successfully");

    server = app.listen(envVars.PORT, () => {
      console.log(`🚀 Server is listening on port ${envVars.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server");

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error(error);
    }

    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

const shutdown = async () => {
  console.log("🛑 Shutting down server...");

  try {
    if (server) {
      server.close(async () => {
        console.log("✅ Server closed.");
        await prisma.$disconnect();
        console.log("✅ Database disconnected.");
        process.exit(0);
      });
    } else {
      await prisma.$disconnect();
      console.log("✅ Database disconnected.");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught Exception:", error);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

void main();
