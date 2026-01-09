import mongoose from "mongoose";

let isConnected = false;

/**
 * Setup test database before all tests
 * Uses a real MongoDB connection (local or Atlas)
 */
export const setupTestDB = async () => {
  try {
    // Skip if already connected
    if (isConnected) {
      return;
    }

    // Use test database
    const mongoUri =
      process.env.MONGODB_TEST_URI ||
      "mongodb://localhost:27017/restaurant-reservation-test";

    // Connect mongoose to the test database
    await mongoose.connect(mongoUri);

    isConnected = true;
    console.log("✅ Test database connected");
  } catch (error) {
    console.error("❌ Test database setup failed:", error);
    throw error;
  }
};

/**
 * Teardown test database after all tests
 */
export const teardownTestDB = async () => {
  try {
    if (!isConnected) {
      return;
    }

    // Drop the test database
    await mongoose.connection.dropDatabase();

    // Close mongoose connection
    await mongoose.connection.close();

    isConnected = false;
    console.log("✅ Test database disconnected");
  } catch (error) {
    console.error("❌ Test database teardown failed:", error);
    throw error;
  }
};

/**
 * Clear all collections in the test database
 */
export const clearTestDB = async () => {
  try {
    if (!isConnected) {
      return;
    }

    const collections = mongoose.connection.collections;

    // Delete all documents from all collections
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error("❌ Clear test database failed:", error);
    throw error;
  }
};
