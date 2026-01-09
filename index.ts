import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/waitlist", waitlistRoutes);

/**
 * Health check endpoint that returns API status and available features.
 * Provides information about the running API version and supported features.
 *
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {void}
 */
app.get("/", (req: express.Request, res: express.Response): void => {
  res.json({
    success: true,
    message: "Restaurant Reservation API is running",
    version: "1.0.0",
    features: [
      "Restaurant Management",
      "Table Management",
      "Reservation System",
      "Reservation Modification",
      "Reservation Cancellation",
      "Reservation Status Tracking",
      "Waitlist Management",
      "Notification System (Mock)",
    ],
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

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`✅ Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
