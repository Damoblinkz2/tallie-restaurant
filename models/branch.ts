import mongoose, { Schema } from "mongoose";
import { IBranch } from "../types/index.js";

const branchSchema = new Schema<IBranch>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
      minlength: [2, "Branch name must be at least 2 characters"],
    },
    address: {
      type: String,
      required: [true, "Branch address is required"],
      trim: true,
      minlength: [3, "Address must be at least 3 characters"],
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
  },
);

branchSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export const Branch = mongoose.model<IBranch>("Branch", branchSchema);
