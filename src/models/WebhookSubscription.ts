import { InferSchemaType, model, Schema } from "mongoose";

const webhookSubscriptionSchema = new Schema(
  {
    endpoint: {
      type: String,
      required: true,
      trim: true
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: (events: string[]) => events.length > 0,
        message: "At least one event is required"
      }
    },
    secret: {
      type: String,
      required: true,
      select: false
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

export type WebhookSubscriptionData = InferSchemaType<
  typeof webhookSubscriptionSchema
>;
export const WebhookSubscription = model(
  "WebhookSubscription",
  webhookSubscriptionSchema
);
