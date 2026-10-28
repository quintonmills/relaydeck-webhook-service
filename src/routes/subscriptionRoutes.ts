import { Router } from "express";
import {
  createSubscription,
  deactivateSubscription,
  listSubscriptions
} from "../controllers/subscriptionController";

/**
 * @openapi
 * /api/v1/subscriptions:
 *   get:
 *     summary: List webhook subscriptions
 *     responses:
 *       200:
 *         description: Subscription list; signing secrets are omitted.
 *   post:
 *     summary: Create a webhook subscription
 *     responses:
 *       201:
 *         description: Subscription created. The signing secret is returned once.
 */
const subscriptionRoutes = Router();

subscriptionRoutes.get("/", listSubscriptions);
subscriptionRoutes.post("/", createSubscription);
subscriptionRoutes.delete("/:id", deactivateSubscription);

export default subscriptionRoutes;
