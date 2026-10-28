import { NextFunction, Request, Response } from "express";

export function requestLogger(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const startedAt = Date.now();
  response.on("finish", () => {
    console.info(
      `${request.method} ${request.path} ${response.statusCode} ${Date.now() - startedAt}ms`
    );
  });
  next();
}
