import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { connectDatabase } from "./config/database";
import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requireHmacSignature } from "./middleware/hmacSecurity";
import { requestLogger } from "./middleware/requestLogger";
import diagnosticsRoutes from "./routes/diagnosticsRoutes";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import webhookRoutes from "./routes/webhookRoutes";

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : false
  })
);
app.use(requestLogger);
app.use(
  express.json({
    limit: "1mb",
    verify: (request, _response, buffer) => {
      request.rawBody = Buffer.from(buffer);
    }
  })
);

app.use(diagnosticsRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1", requireHmacSignature);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/webhooks", webhookRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

async function start(): Promise<void> {
  await connectDatabase();

  const port = Number(process.env.PORT ?? 3000);
  const server = app.listen(port, () => {
    console.info(`RelayDeck API listening on port ${port}`);
  });

  const shutdown = (signal: string): void => {
    console.info(`${signal} received; shutting down`);
    server.close((error) => {
      if (error) {
        console.error("HTTP server shutdown failed", error);
        process.exitCode = 1;
      }
      void mongoose.disconnect();
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

if (require.main === module) {
  void start().catch((error: unknown) => {
    console.error("RelayDeck API failed to start", error);
    process.exitCode = 1;
  });
}
