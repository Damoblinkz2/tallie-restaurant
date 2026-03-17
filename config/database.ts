/**
 * MongoDB connection configuration.
 *
 * Exports `connectDB`, which is called once at application startup to establish
 * the Mongoose connection.  The MongoDB connection string is read from the
 * `MONGODB_URI` environment variable (set via a `.env` file in development or
 * through the hosting platform in production).
 *
 * If the connection fails the process exits immediately with code 1 because the
 * application cannot function without a database.
 */
import mongoose from "mongoose";

/**
 * Establishes a Mongoose connection to MongoDB using the `MONGODB_URI` environment variable.
 * Logs a success message on connection or an error message before exiting on failure.
 *
 * @throws Will call `process.exit(1)` if `MONGODB_URI` is not set or the connection fails
 */
export const connectDB = async () => {
  try {
    // Read the connection string from the environment
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
