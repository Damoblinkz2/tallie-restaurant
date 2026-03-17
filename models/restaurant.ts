import mongoose, { Schema } from "mongoose";
import { IRestaurant } from "../types/index.js";

/**
 * Mongoose schema for the Restaurant collection.
 * Stores core restaurant details including operating hours, table capacity,
 * and the menu items available for customer pre-ordering.
 * Timestamps are automatically managed (createdAt / updatedAt).
 */
const restaurantSchema = new Schema<IRestaurant>(
  {
    /** Display name of the restaurant brand */
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    /** User ID of the owning restaurant account */
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },
  },
  {
    timestamps: true,
  },
);

restaurantSchema.index({ ownerId: 1 });

/** Mongoose model for the Restaurant collection */
export const Restaurant = mongoose.model<IRestaurant>(
  "Restaurant",
  restaurantSchema,
);
