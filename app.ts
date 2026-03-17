/**
 * Express application setup.
 *
 * Configures middleware, mounts all API route groups, registers a health-check
 * endpoint, and registers the global error handler.
 * This module exports the configured `app` instance which is consumed by
 * `index.ts` (production) and the test suite (integration tests).
 */
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";

const app = express();

// ─── Request parsing middleware ──────────────────────────────────────────────
// Parse incoming JSON bodies (Content-Type: application/json)
app.use(express.json());
// Parse URL-encoded form bodies (Content-Type: application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// ─── API routes ──────────────────────────────────────────────────────────────
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/waitlist", waitlistRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
// Simple GET / ping used by load-balancers and uptime monitors
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Restaurant Reservation API is running",
    version: "1.0.0",
  });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
// Catches requests that did not match any registered route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// Must be last so that errors forwarded via next(err) flow here
app.use(errorHandler);

export default app;
