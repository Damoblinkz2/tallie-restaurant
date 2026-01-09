import mongoose, { Schema, Document } from "mongoose";
import { IWaitlist } from "../types/index.js";

const waitlistSchema = new Schema<IWaitlist>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
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
    preferredTime: {
      type: String,
      required: [true, "Preferred time is required"],
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
      enum: ["waiting", "notified", "converted", "expired"],
      default: "waiting",
    },
    notifiedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
waitlistSchema.index({ restaurantId: 1, date: 1, status: 1 });
waitlistSchema.index({ expiresAt: 1 });

export const Waitlist = mongoose.model<IWaitlist>("Waitlist", waitlistSchema);
