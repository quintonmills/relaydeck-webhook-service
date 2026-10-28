import { Router } from "express";
import { liveness, readiness } from "../controllers/diagnosticsController";

const diagnosticsRoutes = Router();

diagnosticsRoutes.get("/health", liveness);
diagnosticsRoutes.get("/ready", readiness);

export default diagnosticsRoutes;
