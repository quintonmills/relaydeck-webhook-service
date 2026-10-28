import { InferSchemaType, model, Schema } from "mongoose";

const webhookLogSchema = new Schema(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "WebhookSubscription",
      required: true,
      index: true
    },
    event: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
      required: true,
      index: true
    },
    attempts: { type: Number, default: 0, required: true },
    responseStatus: Number,
    lastError: String
  },
  { timestamps: true }
);

export type WebhookLogData = InferSchemaType<typeof webhookLogSchema>;
export const WebhookLog = model("WebhookLog", webhookLogSchema);
