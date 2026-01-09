import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
    return;
  }

  // Mongoose duplicate key error (11000)
  if (err.code === 11000) {
    res.status(400).json({
      success: false,
      message: "Duplicate entry",
      error: "This resource already exists",
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
    return;
  }

  // Custom application errors
  if (err.message) {
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
