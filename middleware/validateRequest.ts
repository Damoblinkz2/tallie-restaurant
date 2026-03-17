/**
 * Route-level Joi validation middleware factory.
 *
 * Call `validateRequest(schema, source)` to get an Express middleware that
 * validates the specified part of the incoming request against the given Joi
 * schema before the request reaches the route handler.  If validation fails
 * a 400 response with a structured error list is returned immediately.
 * If validation passes the validated (and coerced) value is written back to
 * `req[source]` so downstream handlers receive clean, type-safe data.
 */
import { NextFunction, Request, Response } from "express";
import Joi, { ObjectSchema } from "joi";

/** The part of the Express request object to validate */
type RequestSource = "body" | "query" | "params";

/**
 * Shared Joi validation options applied to every schema validation:
 * - `abortEarly: false`   — collect ALL errors, not just the first one
 * - `stripUnknown: true`  — silently drop fields not defined in the schema
 * - `convert: true`       — coerce types (e.g. query-string numbers to Number)
 */
const joiValidationOptions: Joi.ValidationOptions = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
};

/**
 * Creates an Express middleware that validates `req[source]` against `schema`.
 *
 * @param schema - A Joi ObjectSchema to validate the request data against
 * @param source - Which part of the request to validate (default: `"body"`)
 * @returns Express middleware that validates and sanitises the request
 *
 * @example
 * // Validate JSON body against a schema before the route handler runs
 * router.post('/', validateRequest(requestSchemas.createRestaurant), handler);
 *
 * // Validate URL params
 * router.get('/:id', validateRequest(requestSchemas.idParam, 'params'), handler);
 */
export const validateRequest = (
  schema: ObjectSchema,
  source: RequestSource = "body",
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], joiValidationOptions);

    if (error) {
      // Map each Joi detail to a human-readable string and return 400
      const errors = error.details.map((detail) => detail.message);

      res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
      });
      return;
    }

    // Replace request source with the validated & coerced value
    (req as any)[source] = value;
    next();
  };
};
