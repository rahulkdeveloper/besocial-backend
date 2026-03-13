import { Request, Response, NextFunction } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const handleError = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Error caught in handleError fn:");

  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";

  const safeMessage = "An unexpected error occurred. Please try again later.";

  const message =
    isProduction && status === 500
      ? safeMessage
      : err.message || safeMessage;

  const response: any = {
    success: false,
    code,
    message,
  };

//   Include stack trace only in development
  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};
