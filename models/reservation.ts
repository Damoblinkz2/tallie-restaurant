import mongoose, { Schema } from "mongoose";
import { IReservation } from "../types/index.js";

const reservationSchema = new Schema<IReservation>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: [true, "Table ID is required"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[+]?[\d\s-()]+$/, "Invalid phone number format"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format"],
    },
    partySize: {
      type: Number,
      required: [true, "Party size is required"],
      min: [1, "Party size must be at least 1"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [30, "Duration must be at least 30 minutes"],
      max: [480, "Duration cannot exceed 8 hours"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
reservationSchema.index({ restaurantId: 1, date: 1 });
reservationSchema.index({ tableId: 1, date: 1 });
reservationSchema.index({ status: 1 });

export const Reservation = mongoose.model<IReservation>(
  "Reservation",
  reservationSchema
);
