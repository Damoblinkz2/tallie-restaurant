/**
 * Application entry point.
 *
 * Loads environment variables from a `.env` file (via dotenv), establishes
 * the MongoDB connection, then starts the Express HTTP server.
 * If either step fails the process exits with code 1 so the hosting platform
 * knows the service did not launch successfully.
 */
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/database.js";

/** Port the HTTP server will listen on; defaults to 3000 if PORT is not set */
const port = process.env.PORT || 3000;

/**
 * Connects to MongoDB and starts the Express server.
 * Any startup error is logged and the process exits with code 1.
 */
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
