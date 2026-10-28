import { randomBytes } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { WebhookSubscription } from "../models/WebhookSubscription";
import { HttpError } from "../middleware/errorHandler";
import { CreateSubscriptionInput } from "../types/webhook";

function parseSubscriptionInput(value: unknown): CreateSubscriptionInput {
  if (typeof value !== "object" || value === null) {
    throw new HttpError(400, "Bad Request", "A JSON request body is required");
  }

  const body = value as Record<string, unknown>;
  if (typeof body.endpoint !== "string" || !Array.isArray(body.events)) {
    throw new HttpError(
      400,
      "Bad Request",
      "endpoint must be a URL and events must be a non-empty array of strings"
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(body.endpoint);
  } catch {
    throw new HttpError(400, "Bad Request", "endpoint must be a valid URL");
  }

  if (
    !["http:", "https:"].includes(endpoint.protocol) ||
    !body.events.length ||
    !body.events.every(
      (event): event is string => typeof event === "string" && event.trim().length > 0
    )
  ) {
    throw new HttpError(
      400,
      "Bad Request",
      "endpoint must use HTTP or HTTPS and events must contain non-empty strings"
    );
  }

  return {
    endpoint: endpoint.toString(),
    events: [...new Set(body.events.map((event) => event.trim()))]
  };
}

export async function createSubscription(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseSubscriptionInput(request.body);
    const secret = randomBytes(32).toString("hex");
    const subscription = await WebhookSubscription.create({
      ...input,
      secret
    });

    response.status(201).json({
      id: subscription.id,
      endpoint: subscription.endpoint,
      events: subscription.events,
      active: subscription.active,
      secret,
      createdAt: subscription.createdAt
    });
  } catch (error) {
    next(error);
  }
}

export async function listSubscriptions(
  _request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subscriptions = await WebhookSubscription.find()
      .select("-secret")
      .sort({ createdAt: -1 })
      .lean();
    response.json(subscriptions);
  } catch (error) {
    next(error);
  }
}

export async function deactivateSubscription(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subscriptionId = request.params.id;
    if (
      typeof subscriptionId !== "string" ||
      !Types.ObjectId.isValid(subscriptionId)
    ) {
      throw new HttpError(400, "Bad Request", "Subscription id is invalid");
    }

    const subscription = await WebhookSubscription.findByIdAndUpdate(
      subscriptionId,
      { active: false },
      { new: true }
    )
      .select("-secret")
      .lean();

    if (!subscription) {
      throw new HttpError(404, "Not Found", "Subscription was not found");
    }

    response.json(subscription);
  } catch (error) {
    next(error);
  }
}
