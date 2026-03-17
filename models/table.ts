import mongoose, { Schema } from "mongoose";
import { ITable } from "../types/index.js";

/**
 * Mongoose schema for the Table collection.
 * Each table record belongs to a restaurant and represents a physical seating unit.
 * Table numbers must be unique within a restaurant (enforced by a compound index).
 * Timestamps are automatically managed (createdAt / updatedAt).
 */
const tableSchema = new Schema<ITable>(
  {
    /** Reference to parent restaurant */
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    /** Reference to specific branch where this table exists */
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    /** The table's number within the restaurant; must be unique per restaurant */
    tableNumber: {
      type: Number,
      required: [true, "Table number is required"],
      min: [1, "Table number must be at least 1"],
    },
    /** Maximum number of guests this table can seat */
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index — prevents duplicate table numbers within the same branch
tableSchema.index({ branchId: 1, tableNumber: 1 }, { unique: true });

/** Mongoose model for the Table collection */
export const Table = mongoose.model<ITable>("Table", tableSchema);
