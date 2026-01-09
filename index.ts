import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/database.js";

const port = process.env.PORT || 3000;

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
