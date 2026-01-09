import { Router } from "express";
import { reservationController } from "../controllers/reservationController.js";

const router = Router();

// Create reservation
router.post("/", reservationController.createReservation);

// Modify reservation
router.put("/:id", reservationController.modifyReservation);

// Cancel reservation
router.delete("/:id", reservationController.cancelReservation);

// Confirm reservation
router.patch("/:id/confirm", reservationController.confirmReservation);

// Complete reservation
router.patch("/:id/complete", reservationController.completeReservation);

// Check availability
router.get("/check-availability", reservationController.checkAvailability);

// Get reservations by date
router.get("/by-date", reservationController.getReservationsByDate);

// Get available time slots
router.get("/available-slots", reservationController.getAvailableTimeSlots);

export default router;
