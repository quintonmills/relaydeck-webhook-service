import axios from "axios";
import { Types } from "mongoose";
import { WebhookLog } from "../models/WebhookLog";
import { WebhookSubscriptionData } from "../models/WebhookSubscription";
import { WebhookDelivery } from "../types/webhook";
import { signPayload } from "./hmacService";

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;
const REQUEST_TIMEOUT_MS = 10_000;

export interface DispatchResult {
  subscriptionId: string;
  status: "succeeded" | "failed";
  attempts: number;
  responseStatus?: number;
}

function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === undefined || status === 429 || status >= 500;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown delivery error";
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function dispatchWebhook(
  subscription: WebhookSubscriptionData & {
    _id: Types.ObjectId;
    secret: string;
  },
  event: string,
  data: Record<string, unknown>
): Promise<DispatchResult> {
  const delivery: WebhookDelivery = {
    id: new Types.ObjectId().toString(),
    event,
    createdAt: new Date().toISOString(),
    data
  };
  const body = JSON.stringify(delivery);
  const log = await WebhookLog.create({
    subscriptionId: subscription._id,
    event,
    payload: delivery,
    status: "pending"
  });

  let responseStatus: number | undefined;
  let lastError: string | undefined;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    attemptsMade = attempt;
    try {
      const response = await axios.post(subscription.endpoint, body, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          "content-type": "application/json",
          "x-relaydeck-signature": signPayload(body, subscription.secret),
          "x-relaydeck-event": event,
          "x-relaydeck-delivery": delivery.id
        }
      });

      responseStatus = response.status;
      await log.updateOne({
        status: "succeeded",
        attempts: attempt,
        responseStatus,
        $unset: { lastError: 1 }
      });

      return {
        subscriptionId: subscription._id.toString(),
        status: "succeeded",
        attempts: attempt,
        responseStatus
      };
    } catch (error) {
      responseStatus = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      lastError = errorMessage(error);

      if (attempt === MAX_ATTEMPTS || !isRetryable(error)) {
        break;
      }

      await wait(BASE_BACKOFF_MS * 2 ** (attempt - 1));
    }
  }

  await log.updateOne({
    status: "failed",
    attempts: attemptsMade,
    responseStatus,
    lastError
  });

  return {
    subscriptionId: subscription._id.toString(),
    status: "failed",
    attempts: attemptsMade,
    responseStatus
  };
}
