/**
 * Controller-level Joi validation helper.
 *
 * Provides a generic, typed wrapper around Joi validation for use directly
 * inside controller methods — as a second layer of defence after the route-level
 * `validateRequest` middleware has already run.
 *
 * Using validation at both layers ensures that:
 * 1. Routes are protected even if middleware is accidentally removed.
 * 2. Controller logic always receives clean, typed data it can safely destructure.
 */
import Joi, { ObjectSchema } from "joi";
import { Response } from "express";

/**
 * Shared Joi options for controller-level validation:
 * - `abortEarly: false`   — collect all errors before returning
 * - `stripUnknown: true`  — remove properties not present in the schema
 * - `convert: true`       — coerce compatible types (e.g. numeric strings)
 */
const validationOptions: Joi.ValidationOptions = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
};

/**
 * Validates an arbitrary `payload` against the given Joi `schema`.
 * If validation passes, returns the validated value cast to type `T`.
 * If validation fails, sends a `400 Validation Error` response and returns `null`.
 *
 * Usage pattern in controllers:
 * ```ts
 * const validated = validateControllerInput<MyType>(schema, req.body, res);
 * if (!validated) return; // response already sent
 * // use validated safely here
 * ```
 *
 * @template T - The expected TypeScript type of the validated value
 * @param schema  - Joi ObjectSchema to validate against
 * @param payload - The raw data to validate (req.body, req.params, req.query, etc.)
 * @param res     - Express Response object used to send the error response if validation fails
 * @returns The validated and coerced value typed as `T`, or `null` if validation failed
 */
export const validateControllerInput = <T>(
  schema: ObjectSchema,
  payload: unknown,
  res: Response,
): T | null => {
  const { error, value } = schema.validate(payload, validationOptions);

  if (error) {
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: error.details.map((detail) => detail.message),
    });
    return null;
  }

  return value as T;
};
