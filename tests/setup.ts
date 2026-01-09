import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connect to the test database.
 * Safe to call multiple times.
 */
export const setupTestDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    // Already connected
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("❌ MONGODB_URI is not defined");
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  console.log("✅ Test database connected");
};

/**
 * Remove all documents from all collections.
 * Runs after each test.
 */
export const clearTestDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) return;

  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

/**
 * Disconnect from the test database.
 */
export const teardownTestDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;

  await mongoose.disconnect();
  console.log("🧹 Test database disconnected");
};
