import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";

/**
 * Global error-handler middleware for the Express application.
 *
 * Must be registered LAST in the middleware chain (after all routes) so that
 * errors forwarded via `next(err)` — whether thrown explicitly or caught by
 * `asyncHandler` — flow here for uniform formatting.
 *
 * Handles the following error categories in order:
 * 1. Mongoose `ValidationError`  → 400 with per-field error messages
 * 2. MongoDB duplicate-key (11000) → 400 with a "resource already exists" message
 * 3. Mongoose `CastError` (bad ObjectId) → 400 with "Invalid ID format"
 * 4. Any error with a `message` property → status from `err.statusCode` or 400
 * 5. Catch-all → 500 Internal Server Error
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Error:", err);

  // Mongoose validation error — one or more schema constraints were violated
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
    return;
  }

  // Mongoose duplicate key error (11000) — unique index constraint violated
  if (err.code === 11000) {
    res.status(400).json({
      success: false,
      message: "Duplicate entry",
      error: "This resource already exists",
    });
    return;
  }

  // Mongoose cast error — an ObjectId or other field could not be cast to the schema type
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
    return;
  }

  // Custom application errors thrown with a message (and optional statusCode)
  if (err.message) {
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Fallback for any unhandled / unexpected errors
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
