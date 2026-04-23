import { Server } from "http";
import app from "./app";
import { envVars } from './app/config/env';

let server: Server;

async function main() {
    try {
        // await seedSuperAdmin();

        // await prisma.$connect();
        // console.log("🗃️ Database connected successfully");

        server = app.listen(envVars.PORT, () => {
          console.log(`🚀 Server is listening on port ${envVars.PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        // await prisma.$disconnect().catch(() => {});
        process.exit(1);
    }
}

void main();

