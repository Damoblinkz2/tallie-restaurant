import mongoose, { Document } from "mongoose";

type UserRole = "restaurant_owner" | "customer";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

interface IMenuItem {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
}

interface IMenu extends Document, IMenuItem {
  restaurantId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a single pre-ordered item attached to a reservation.
 * Customers can pre-order food when making a reservation so the kitchen
 * can start preparation before the guests arrive.
 */
interface IPreOrderItem {
  /** Reference to the menu item being ordered */
  itemId: string;
  /** Name of the item at the time of ordering (snapshot for record keeping) */
  name: string;
  /** How many of this item the customer wants */
  quantity: number;
  /** Price of the item at the time of ordering (snapshot for record keeping) */
  price: number;
  /** Optional special instructions or dietary notes for this item */
  notes?: string;
}

/**
 * Mongoose document interface for a Restaurant.
 * Extends Document to include Mongoose's built-in fields (_id, __v, etc.)
 * along with timestamps managed by the schema.
 */
interface IRestaurant extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IBranch extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  address: string;
  openingTime: string;
  closingTime: string;
  totalTables: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose document interface for a Table.
 * Each table belongs to a restaurant and has a seating capacity.
 */
interface ITable extends Document {
  restaurantId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  tableNumber: number;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Possible lifecycle states for a reservation */
type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";

/**
 * Mongoose document interface for a Reservation.
 * Links a customer to a specific table at a restaurant for a defined time slot.
 * May include pre-ordered food items to trigger kitchen preparation 30 min before arrival.
 */
interface IReservation extends Document {
  restaurantId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  phone: string;
  email?: string;
  partySize: number;
  date: string;
  startTime: string;
  duration: number;
  preOrderItems?: IPreOrderItem[];
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Possible lifecycle states for a waitlist entry */
type WaitlistStatus = "waiting" | "notified" | "converted" | "expired";

/**
 * Mongoose document interface for a Waitlist entry.
 * Created when a customer wants a reservation but no tables are immediately available.
 * The system automatically notifies the customer when their preferred slot opens up.
 */
interface IWaitlist extends Document {
  restaurantId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  phone: string;
  email?: string;
  partySize: number;
  date: string;
  preferredTime: string;
  duration: number;
  status: WaitlistStatus;
  notifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a single bookable time slot within a restaurant's operating hours.
 * Used to communicate available windows to clients during the slot-checking flow.
 */
interface TimeSlot {
  /** Start time of the slot in HH:MM 24-hour format */
  startTime: string;
  /** End time of the slot in HH:MM 24-hour format */
  endTime: string;
  /** Array of table IDs that are free during this time slot */
  availableTables: string[];
}

/**
 * Standardised shape of an error response returned by the API.
 * Used by the central error handler to build consistent error responses.
 */
interface ApiError {
  /** Human-readable description of what went wrong */
  message: string;
  /** Detailed validation errors, if applicable (e.g. Joi or Mongoose validation failures) */
  errors?: any;
  /** Stack trace — only included in non-production environments */
  stack?: string;
}

export {
  IUser,
  UserRole,
  IRestaurant,
  IBranch,
  ITable,
  IReservation,
  IWaitlist,
  IMenu,
  TimeSlot,
  ApiError,
  IMenuItem,
  IPreOrderItem,
};
