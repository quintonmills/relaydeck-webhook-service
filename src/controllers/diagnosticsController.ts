import { Request, Response } from "express";
import mongoose from "mongoose";

export function liveness(_request: Request, response: Response): void {
  response.json({ status: "ok" });
}

export function readiness(_request: Request, response: Response): void {
  const ready = mongoose.connection.readyState === 1;
  response.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    database: ready ? "connected" : "disconnected"
  });
}
