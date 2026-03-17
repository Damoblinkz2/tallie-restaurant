/**
 * Centralised Joi validation schemas for all API routes.
 *
 * Reusable primitive schemas are defined at the top and composed into
 * per-endpoint schemas that live in the exported `requestSchemas` map.
 * Route middleware (`validateRequest`) and controller helpers
 * (`validateControllerInput`) both reference schemas from this file.
 */
import Joi from "joi";

// ─── Reusable primitive schemas ─────────────────────────────────────────────

/** Validates a MongoDB ObjectId — must be a 24-character lowercase hex string */
const objectIdSchema = Joi.string().hex().length(24).required();

/** Validates a date string in YYYY-MM-DD format */
const dateSchema = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);

/** Validates a time string in HH:MM 24-hour format */
const timeSchema = Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/);

/** Validates an international or local phone number (digits, spaces, +, -, parentheses) */
const phoneSchema = Joi.string().pattern(/^[+]?[\d\s-()]+$/);

/** Validates user role values supported by the authentication system */
const userRoleSchema = Joi.string().valid("restaurant_owner", "customer");

/**
 * Schema for a single pre-ordered food item attached to a reservation.
 * All fields except `notes` are required.
 */
const preOrderItemSchema = Joi.object({
  itemId: Joi.string().trim().required(),
  name: Joi.string().min(2).required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  notes: Joi.string().allow("").optional(),
});

/**
 * Schema for a single restaurant menu item.
 * Used when uploading or creating a menu for a restaurant.
 */
const menuItemSchema = Joi.object({
  itemId: Joi.string().trim().required(),
  name: Joi.string().min(2).required(),
  description: Joi.string().allow("").optional(),
  price: Joi.number().min(0).required(),
  available: Joi.boolean().default(true),
});

// ─── Per-endpoint request schemas ────────────────────────────────────────────

/**
 * All request validation schemas keyed by a descriptive name.
 * Each schema is passed to `validateRequest` (route middleware) or
 * `validateControllerInput` (controller-level guard) to validate the
 * corresponding part of the incoming request (body, query, or params).
 */
export const requestSchemas = {
  /** Validates a generic `:id` URL parameter as a MongoDB ObjectId */
  idParam: Joi.object({
    id: objectIdSchema,
  }),

  /** Validates a `:restaurantId` URL parameter as a MongoDB ObjectId */
  restaurantIdParam: Joi.object({
    restaurantId: objectIdSchema,
  }),

  /** Validates a `:branchId` URL parameter as a MongoDB ObjectId */
  branchIdParam: Joi.object({
    branchId: objectIdSchema,
  }),

  /** Validates the request body for creating a new restaurant */
  createRestaurant: Joi.object({
    name: Joi.string().min(2).required(),
  }),

  createBranch: Joi.object({
    restaurantId: objectIdSchema,
    name: Joi.string().min(2).required(),
    address: Joi.string().min(3).required(),
    openingTime: timeSchema.required(),
    closingTime: timeSchema.required(),
    totalTables: Joi.number().integer().min(1).required(),
  }),

  /** Validates the request body when replacing a branch menu (minimum 1 item) */
  uploadBranchMenu: Joi.object({
    menu: Joi.array().items(menuItemSchema).min(1).required(),
  }),

  /** Validates the request body for adding a table to a restaurant */
  addTable: Joi.object({
    branchId: objectIdSchema,
    tableNumber: Joi.number().integer().min(1).required(),
    capacity: Joi.number().integer().min(1).required(),
  }),

  /** Validates the request body for creating a new reservation; pre-order items are optional */
  createReservation: Joi.object({
    branchId: objectIdSchema,
    customerName: Joi.string().min(2).required(),
    phone: phoneSchema.required(),
    email: Joi.string().email().optional(),
    partySize: Joi.number().integer().min(1).required(),
    date: dateSchema.required(),
    startTime: timeSchema.required(),
    duration: Joi.number().integer().min(30).max(480).required(),
    preOrderItems: Joi.array().items(preOrderItemSchema).optional(),
  }),

  /**
   * Validates the request body for modifying an existing reservation.
   * At least one field must be provided (.min(1)); all individual fields are optional
   * so callers can update only the fields they need to change.
   */
  modifyReservation: Joi.object({
    date: dateSchema,
    startTime: timeSchema,
    partySize: Joi.number().integer().min(1),
    duration: Joi.number().integer().min(30).max(480),
    preOrderItems: Joi.array().items(preOrderItemSchema).optional(),
  }).min(1),

  /** Validates query parameters for the availability check endpoint */
  checkAvailabilityQuery: Joi.object({
    branchId: objectIdSchema,
    partySize: Joi.number().integer().min(1).required(),
    date: dateSchema.required(),
    startTime: timeSchema.required(),
    duration: Joi.number().integer().min(30).max(480).required(),
  }),

  /** Validates query parameters for fetching all reservations on a specific date */
  reservationsByDateQuery: Joi.object({
    branchId: objectIdSchema,
    date: dateSchema.required(),
  }),

  /** Validates query parameters for fetching available time slots for a party */
  availableSlotsQuery: Joi.object({
    branchId: objectIdSchema,
    partySize: Joi.number().integer().min(1).required(),
    date: dateSchema.required(),
    duration: Joi.number().integer().min(30).max(480),
  }),

  /** Validates the request body for adding a customer to the waitlist */
  addToWaitlist: Joi.object({
    branchId: objectIdSchema,
    customerName: Joi.string().min(2).required(),
    phone: phoneSchema.required(),
    email: Joi.string().email().optional(),
    partySize: Joi.number().integer().min(1).required(),
    date: dateSchema.required(),
    preferredTime: timeSchema.required(),
    duration: Joi.number().integer().min(30).max(480).required(),
  }),

  /** Validates query parameters for fetching a restaurant's waitlist on a given date; status filter is optional */
  waitlistByDateQuery: Joi.object({
    branchId: objectIdSchema,
    date: dateSchema.required(),
    status: Joi.string().valid("waiting", "notified", "converted", "expired"),
  }),

  registerUser: Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: userRoleSchema.required(),
  }),

  loginUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
};
