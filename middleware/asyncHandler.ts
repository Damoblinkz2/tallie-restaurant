import { Request, Response, NextFunction } from "express";

/**
 * Wrapper function to handle async route handlers
 * Catches any errors and passes them to the error handler middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
