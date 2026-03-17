/**
 * Waitlist routes — /api/waitlist
 *
 * Route mapping:
 *   POST   /          → Add a customer to the waitlist
 *   GET    /          → Get the waitlist for a restaurant on a specific date
 *   POST   /:id/convert → Convert a waitlist entry into a confirmed reservation
 *   DELETE /:id       → Remove a customer from the waitlist
 *
 * Route-level `validateRequest` middleware validates body, params, and query
 * inputs before each controller runs.
 */
import { Router } from "express";
import { waitlistController } from "../controllers/waitlistController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requestSchemas } from "../validation/schemas.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

// Add to waitlist
router.post(
  "/",
  protect,
  authorize("customer"),
  validateRequest(requestSchemas.addToWaitlist),
  waitlistController.addToWaitlist,
);

// Get waitlist by date
router.get(
  "/",
  validateRequest(requestSchemas.waitlistByDateQuery, "query"),
  waitlistController.getWaitlistByDate,
);

// Convert waitlist entry to reservation
router.post(
  "/:id/convert",
  validateRequest(requestSchemas.idParam, "params"),
  waitlistController.convertToReservation,
);

// Remove from waitlist
router.delete(
  "/:id",
  validateRequest(requestSchemas.idParam, "params"),
  waitlistController.removeFromWaitlist,
);

export default router;
