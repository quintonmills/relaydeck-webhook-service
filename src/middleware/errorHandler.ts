import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ProblemDetails } from "../types/webhook";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    title: string,
    detail: string
  ) {
    super(detail);
    this.name = title;
  }
}

export function notFoundHandler(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  next(new HttpError(404, "Not Found", `No route for ${request.method} ${request.path}`));
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next
) => {
  let status = 500;
  let title = "Internal Server Error";
  let detail = "An unexpected error occurred";

  if (error instanceof HttpError) {
    status = error.status;
    title = error.name;
    detail = error.message;
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    title = "Bad Request";
    detail = error.message;
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    title = "Bad Request";
    detail = "A request parameter has an invalid format";
  } else if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    status = 400;
    title = "Bad Request";
    detail = "Request body must contain valid JSON";
  } else if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    status = 409;
    title = "Conflict";
    detail = "A resource with the supplied values already exists";
  }

  if (status >= 500) {
    console.error("Unhandled request error", error);
  }

  const problem: ProblemDetails = {
    type: "about:blank",
    title,
    status,
    detail,
    instance: request.path
  };
  response.status(status).type("application/problem+json").json(problem);
};
