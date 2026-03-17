/**
 * Reservation routes — /api/reservations
 *
 * Route mapping:
 *   POST   /                    → Create a new reservation (with optional pre-orders)
 *   PUT    /:id                 → Modify an existing reservation
 *   DELETE /:id                 → Cancel a reservation
 *   PATCH  /:id/confirm         → Confirm a pending reservation
 *   PATCH  /:id/complete        → Mark a reservation as completed
 *   GET    /check-availability  → Check if a time slot is available
 *   GET    /by-date             → Get all reservations for a restaurant on a date
 *   GET    /available-slots     → Get all open time slots for a restaurant on a date
 *
 * Route-level `validateRequest` middleware guards body, params, and query
 * inputs before each controller runs.
 */
import { Router } from "express";
import { reservationController } from "../controllers/reservationController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requestSchemas } from "../validation/schemas.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

// Create reservation
router.post(
  "/",
  protect,
  authorize("customer"),
  validateRequest(requestSchemas.createReservation),
  reservationController.createReservation,
);

// Modify reservation
router.put(
  "/:id",
  validateRequest(requestSchemas.idParam, "params"),
  validateRequest(requestSchemas.modifyReservation),
  reservationController.modifyReservation,
);

// Cancel reservation
router.delete(
  "/:id",
  validateRequest(requestSchemas.idParam, "params"),
  reservationController.cancelReservation,
);

// Confirm reservation
router.patch(
  "/:id/confirm",
  validateRequest(requestSchemas.idParam, "params"),
  reservationController.confirmReservation,
);

// Complete reservation
router.patch(
  "/:id/complete",
  validateRequest(requestSchemas.idParam, "params"),
  reservationController.completeReservation,
);

// Check availability
router.get(
  "/check-availability",
  validateRequest(requestSchemas.checkAvailabilityQuery, "query"),
  reservationController.checkAvailability,
);

// Get reservations by date
router.get(
  "/by-date",
  validateRequest(requestSchemas.reservationsByDateQuery, "query"),
  reservationController.getReservationsByDate,
);

// Get available time slots
router.get(
  "/available-slots",
  validateRequest(requestSchemas.availableSlotsQuery, "query"),
  reservationController.getAvailableTimeSlots,
);

export default router;
