import mongoose, { Document } from "mongoose";

interface IRestaurant extends Document {
  name: string;
  openingTime: string;
  closingTime: string;
  totalTables: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ITable extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: number;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface IReservation extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  customerName: string;
  phone: string;
  email?: string;
  partySize: number;
  date: string;
  startTime: string;
  duration: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

type WaitlistStatus = "waiting" | "notified" | "converted" | "expired";

interface IWaitlist extends Document {
  restaurantId: mongoose.Types.ObjectId;
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

interface TimeSlot {
  startTime: string;
  endTime: string;
  availableTables: string[];
}

interface ApiError {
  message: string;
  errors?: any;
  stack?: string;
}

export { IRestaurant, ITable, IReservation, IWaitlist, TimeSlot, ApiError };
