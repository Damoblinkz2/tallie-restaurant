import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/waitlist", waitlistRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Restaurant Reservation API is running",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorHandler);

export default app;
