import mongoose, { Schema } from "mongoose";
import { IMenu } from "../types/index.js";

const menuSchema = new Schema<IMenu>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    itemId: {
      type: String,
      required: [true, "Menu item ID is required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Menu item name is required"],
      trim: true,
      minlength: [2, "Menu item name must be at least 2 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Menu item price is required"],
      min: [0, "Menu item price cannot be negative"],
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

menuSchema.index({ branchId: 1, itemId: 1 }, { unique: true });
menuSchema.index({ restaurantId: 1, branchId: 1, available: 1 });

export const Menu = mongoose.model<IMenu>("Menu", menuSchema);
