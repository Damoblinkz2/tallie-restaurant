import mongoose, { Schema } from "mongoose";
import { IReservation } from "../types/index.js";

/**
 * Mongoose schema for the Reservation collection.
 * A reservation links a customer to a specific restaurant table for a defined time slot.
 * Reservations may include pre-ordered food items; when present, a kitchen preparation
 * notification is automatically scheduled 30 minutes before the customer's arrival.
 * Timestamps are automatically managed (createdAt / updatedAt).
 */
const reservationSchema = new Schema<IReservation>(
  {
    /** Reference to the restaurant where the reservation is made */
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    /** Reference to the restaurant branch where the reservation is made */
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    /** Reference to the specific table assigned to this reservation */
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: [true, "Table ID is required"],
    },
    /** Optional authenticated customer user account that created this reservation */
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    /** Full name of the customer (2+ characters, trimmed) */
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    /** Customer phone number for SMS notifications; accepts international format */
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
    /** Number of guests (minimum 1) */
    partySize: {
      type: Number,
      required: [true, "Party size is required"],
      min: [1, "Party size must be at least 1"],
    },
    /** Reservation date in YYYY-MM-DD format */
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"],
    },
    /** Start time in HH:MM 24-hour format */
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:MM"],
    },
    /** Reservation duration in minutes (30 min – 8 hours) */
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [30, "Duration must be at least 30 minutes"],
      max: [480, "Duration cannot exceed 8 hours"],
    },
    /**
     * Optional array of food items pre-ordered by the customer.
     * When this array is populated, the reservation service schedules a kitchen
     * preparation alert 30 minutes before the customer's arrival time.
     */
    preOrderItems: [
      {
        /** Reference to the menu item being ordered */
        itemId: {
          type: String,
          required: [true, "Pre-order item ID is required"],
          trim: true,
        },
        /** Snapshot of the item name at ordering time */
        name: {
          type: String,
          required: [true, "Pre-order item name is required"],
          trim: true,
        },
        /** Number of this item ordered (minimum 1) */
        quantity: {
          type: Number,
          required: [true, "Pre-order quantity is required"],
          min: [1, "Pre-order quantity must be at least 1"],
        },
        /** Snapshot of the item price at ordering time; must be non-negative */
        price: {
          type: Number,
          required: [true, "Pre-order item price is required"],
          min: [0, "Pre-order item price cannot be negative"],
        },
        /** Special preparation instructions or dietary notes for this item */
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    /** Lifecycle status; new reservations start as 'pending' */
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to speed up queries fetching all reservations for a restaurant on a date
reservationSchema.index({ restaurantId: 1, date: 1 });
reservationSchema.index({ branchId: 1, date: 1 });
// Compound index to speed up conflict detection for a specific table on a date
reservationSchema.index({ tableId: 1, date: 1 });
// Single-field index for filtering reservations by lifecycle status
reservationSchema.index({ status: 1 });

/** Mongoose model for the Reservation collection */
export const Reservation = mongoose.model<IReservation>(
  "Reservation",
  reservationSchema,
);
