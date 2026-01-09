import mongoose, { Schema } from "mongoose";
import { ITable } from "../types/index.js";

const tableSchema = new Schema<ITable>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    tableNumber: {
      type: Number,
      required: [true, "Table number is required"],
      min: [1, "Table number must be at least 1"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique table numbers per restaurant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export const Table = mongoose.model<ITable>("Table", tableSchema);
