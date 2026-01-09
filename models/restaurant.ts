import mongoose, { Schema } from "mongoose";
import { IRestaurant } from "../types/index.js";

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    openingTime: {
      type: String,
      required: [true, "Opening time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"],
    },
    closingTime: {
      type: String,
      required: [true, "Closing time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"],
    },
    totalTables: {
      type: Number,
      required: [true, "Total tables is required"],
      min: [1, "Must have at least 1 table"],
    },
  },
  {
    timestamps: true,
  }
);

export const Restaurant = mongoose.model<IRestaurant>(
  "Restaurant",
  restaurantSchema
);
