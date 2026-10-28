import { Request, Response, NextFunction } from "express";
import { WebhookSubscription } from "../models/WebhookSubscription";
import { dispatchWebhook } from "../services/webhookDispatcher";
import { DispatchWebhookInput } from "../types/webhook";
import { HttpError } from "../middleware/errorHandler";

function parseDispatchInput(value: unknown): DispatchWebhookInput {
  if (typeof value !== "object" || value === null) {
    throw new HttpError(400, "Bad Request", "A JSON request body is required");
  }

  const body = value as Record<string, unknown>;
  if (
    typeof body.event !== "string" ||
    !body.event.trim() ||
    typeof body.data !== "object" ||
    body.data === null ||
    Array.isArray(body.data)
  ) {
    throw new HttpError(
      400,
      "Bad Request",
      "event must be a non-empty string and data must be a JSON object"
    );
  }

  return {
    event: body.event.trim(),
    data: body.data as Record<string, unknown>
  };
}

export async function dispatchEvent(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseDispatchInput(request.body);
    const subscriptions = await WebhookSubscription.find({
      active: true,
      events: input.event
    }).select("+secret");

    const results = await Promise.all(
      subscriptions.map((subscription) =>
        dispatchWebhook(
          subscription,
          input.event,
          input.data
        )
      )
    );

    response.status(200).json({
      event: input.event,
      matched: results.length,
      succeeded: results.filter((result) => result.status === "succeeded").length,
      failed: results.filter((result) => result.status === "failed").length,
      deliveries: results
    });
  } catch (error) {
    next(error);
  }
}
