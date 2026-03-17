import mongoose, { Schema, Document } from "mongoose";
import { IWaitlist } from "../types/index.js";

/**
 * Mongoose schema for the Waitlist collection.
 * A waitlist entry is created when a customer requests a reservation but no
 * table is immediately available. The system monitors availability and notifies
 * the customer (setting status to 'notified') when their preferred slot opens.
 * Entries expire automatically at the end of the requested date.
 * Timestamps are automatically managed (createdAt / updatedAt).
 */
const waitlistSchema = new Schema<IWaitlist>(
  {
    /** Reference to the restaurant the customer is waitlisted for */
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    /** Reference to the branch the customer is waitlisted for */
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    /** Optional authenticated customer user account */
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    /** Full name of the waiting customer */
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    /** Customer phone for SMS notifications; accepts international format */
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[+]?[\d\s-()]+$/, "Invalid phone number format"],
    },
    /** Optional customer email for email notifications; stored in lowercase */
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format"],
    },
    /** Number of guests in the party (minimum 1) */
    partySize: {
      type: Number,
      required: [true, "Party size is required"],
      min: [1, "Party size must be at least 1"],
    },
    /** Requested reservation date in YYYY-MM-DD format */
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"],
    },
    /** Preferred start time in HH:MM 24-hour format */
    preferredTime: {
      type: String,
      required: [true, "Preferred time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"],
    },
    /** Desired reservation duration in minutes (30 min – 8 hours) */
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [30, "Duration must be at least 30 minutes"],
      max: [480, "Duration cannot exceed 8 hours"],
    },
    /** Lifecycle status; new entries start as 'waiting' */
    status: {
      type: String,
      enum: ["waiting", "notified", "converted", "expired"],
      default: "waiting",
    },
    /** Timestamp set when the customer is notified of availability */
    notifiedAt: {
      type: Date,
    },
    /** Date at which this entry expires (set to end-of-day on the requested date) */
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fetching active waitlist entries for a restaurant on a specific date
waitlistSchema.index({ restaurantId: 1, date: 1, status: 1 });
waitlistSchema.index({ branchId: 1, date: 1, status: 1 });
// TTL-compatible index on expiresAt — useful for scheduled expiry jobs querying expired entries
waitlistSchema.index({ expiresAt: 1 });

/** Mongoose model for the Waitlist collection */
export const Waitlist = mongoose.model<IWaitlist>("Waitlist", waitlistSchema);
