export interface CreateSubscriptionInput {
  endpoint: string;
  events: string[];
}

export interface DispatchWebhookInput {
  event: string;
  data: Record<string, unknown>;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  createdAt: string;
  data: Record<string, unknown>;
}
