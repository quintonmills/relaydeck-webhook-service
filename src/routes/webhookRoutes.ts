import { Router } from "express";
import { dispatchEvent } from "../controllers/webhookController";

/**
 * @openapi
 * /api/v1/webhooks/dispatch:
 *   post:
 *     summary: Dispatch an event to matching subscriptions
 *     description: Requires x-relaydeck-signature containing an HMAC-SHA256 of the exact request body.
 *     responses:
 *       200:
 *         description: Per-subscription delivery results.
 *       401:
 *         description: Missing or invalid request signature.
 */
const webhookRoutes = Router();

webhookRoutes.post("/dispatch", dispatchEvent);

export default webhookRoutes;
