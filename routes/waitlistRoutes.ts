import { Router } from "express";
import { waitlistController } from "../controllers/waitlistController.js";

const router = Router();

// Add to waitlist
router.post("/", waitlistController.addToWaitlist);

// Get waitlist by date
router.get("/", waitlistController.getWaitlistByDate);

// Convert waitlist entry to reservation
router.post("/:id/convert", waitlistController.convertToReservation);

// Remove from waitlist
router.delete("/:id", waitlistController.removeFromWaitlist);

export default router;
