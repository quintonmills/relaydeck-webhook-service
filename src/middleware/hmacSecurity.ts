import { NextFunction, Request, Response } from "express";
import { verifyPayload } from "../services/hmacService";
import { ProblemDetails } from "../types/webhook";

export function requireHmacSignature(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const secret = process.env.API_HMAC_SECRET;
  if (!secret) {
    const problem: ProblemDetails = {
      type: "about:blank",
      title: "Service Unavailable",
      status: 503,
      detail: "Request signature verification is not configured"
    };
    response.status(problem.status).type("application/problem+json").json(problem);
    return;
  }

  const signature = request.header("x-relaydeck-signature") ?? "";
  const body = request.rawBody?.toString("utf8") ?? "";
  if (!verifyPayload(body, signature, secret)) {
    const problem: ProblemDetails = {
      type: "about:blank",
      title: "Unauthorized",
      status: 401,
      detail: "A valid x-relaydeck-signature header is required"
    };
    response.status(problem.status).type("application/problem+json").json(problem);
    return;
  }

  next();
}
