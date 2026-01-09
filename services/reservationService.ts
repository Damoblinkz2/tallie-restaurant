import { Reservation } from "../models/reservation.js";
import { IReservation } from "../types/index.js";
import { Table } from "../models/table.js";
import { Restaurant } from "../models/restaurant.js";
import { TimeSlot } from "../types/index.js";
import {
  isTimeInRange,
  doTimeSlotsOverlap,
  timeToMinutes,
  minutesToTime,
} from "../utils/timeUtils.js";
import { notificationService } from "./notificationService.js";
import mongoose from "mongoose";

export const reservationService = {
  /**
   * Creates a new reservation for a restaurant table.
   * Validates the restaurant, date, time, and availability before creating the reservation.
   * Sends a confirmation notification upon successful creation.
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {string} customerName - The name of the customer making the reservation
   * @param {string} phone - The customer's phone number
   * @param {number} partySize - The number of guests in the party
   * @param {string} date - The date of the reservation (YYYY-MM-DD format)
   * @param {string} startTime - The start time of the reservation (HH:MM format)
   * @param {number} duration - The duration of the reservation in minutes
   * @param {string} [email] - The customer's email address (optional)
   * @returns {Promise<IReservation>} The created reservation object
   * @throws {Error} If restaurant ID is invalid, restaurant not found, date is in the past, time is outside operating hours, or no tables are available
   */
  async createReservation(
    restaurantId: string,
    customerName: string,
    phone: string,
    partySize: number,
    date: string,
    startTime: string,
    duration: number,
    email?: string
  ): Promise<IReservation> {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new Error("Invalid restaurant ID");
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new Error("Cannot make reservations for past dates");
    }

    if (
      !isTimeInRange(startTime, restaurant.openingTime, restaurant.closingTime)
    ) {
      throw new Error(
        `Reservation must be within operating hours (${restaurant.openingTime} - ${restaurant.closingTime})`
      );
    }

    const endTimeMinutes = timeToMinutes(startTime) + duration;
    const closingTimeMinutes = timeToMinutes(restaurant.closingTime);
    if (endTimeMinutes > closingTimeMinutes) {
      throw new Error("Reservation extends beyond closing time");
    }

    const availableTable = await this.findAvailableTable(
      restaurantId,
      partySize,
      date,
      startTime,
      duration
    );

    if (!availableTable) {
      throw new Error(
        "No available tables for the requested party size and time"
      );
    }

    const reservation = new Reservation({
      restaurantId,
      tableId: availableTable._id,
      customerName,
      phone,
      email,
      partySize,
      date,
      startTime,
      duration,
      status: "pending",
    });

    const savedReservation = await reservation.save();

    // Send confirmation notification
    notificationService.sendReservationConfirmation(savedReservation);

    return savedReservation;
  },

  /**
   * Modifies an existing reservation with updated details.
   * Validates the new parameters and checks for table availability if changes require it.
   * Sends a modification notification upon successful update.
   *
   * @param {string} reservationId - The ID of the reservation to modify
   * @param {Object} updates - The fields to update
   * @param {string} [updates.date] - New date for the reservation (YYYY-MM-DD format)
   * @param {string} [updates.startTime] - New start time for the reservation (HH:MM format)
   * @param {number} [updates.partySize] - New party size
   * @param {number} [updates.duration] - New duration in minutes
   * @returns {Promise<IReservation>} The updated reservation object
   * @throws {Error} If reservation ID is invalid, reservation not found, reservation is cancelled/completed, or no tables are available for the new details
   */
  async modifyReservation(
    reservationId: string,
    updates: {
      date?: string;
      startTime?: string;
      partySize?: number;
      duration?: number;
    }
  ): Promise<IReservation> {
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      throw new Error("Invalid reservation ID");
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (reservation.status === "cancelled") {
      throw new Error("Cannot modify a cancelled reservation");
    }

    if (reservation.status === "completed") {
      throw new Error("Cannot modify a completed reservation");
    }

    const restaurant = await Restaurant.findById(reservation.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // Use existing values if not updating
    const newDate = updates.date || reservation.date;
    const newStartTime = updates.startTime || reservation.startTime;
    const newPartySize = updates.partySize || reservation.partySize;
    const newDuration = updates.duration || reservation.duration;

    // Validate new date is not in the past
    const reservationDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new Error("Cannot modify to a past date");
    }

    // Validate new time is within operating hours
    if (
      !isTimeInRange(
        newStartTime,
        restaurant.openingTime,
        restaurant.closingTime
      )
    ) {
      throw new Error(
        `Reservation must be within operating hours (${restaurant.openingTime} - ${restaurant.closingTime})`
      );
    }

    // Check if modification requires a different table
    const needsNewTable =
      newDate !== reservation.date ||
      newStartTime !== reservation.startTime ||
      newPartySize !== reservation.partySize ||
      newDuration !== reservation.duration;

    if (needsNewTable) {
      // Check if current table is still available for new time
      const currentTable = await Table.findById(reservation.tableId);

      if (currentTable && currentTable.capacity >= newPartySize) {
        // Check for conflicts with the same table
        const hasConflict = await this.checkTableConflict(
          currentTable._id.toString(),
          newDate,
          newStartTime,
          newDuration,
          reservationId
        );

        if (hasConflict) {
          // Try to find another available table
          const newTable = await this.findAvailableTable(
            reservation.restaurantId.toString(),
            newPartySize,
            newDate,
            newStartTime,
            newDuration,
            reservationId
          );

          if (!newTable) {
            throw new Error("No available tables for the modified time slot");
          }

          reservation.tableId = newTable._id;
        }
      } else {
        // Current table can't accommodate new party size
        const newTable = await this.findAvailableTable(
          reservation.restaurantId.toString(),
          newPartySize,
          newDate,
          newStartTime,
          newDuration,
          reservationId
        );

        if (!newTable) {
          throw new Error("No available tables for the modified party size");
        }

        reservation.tableId = newTable._id;
      }
    }

    // Update reservation fields
    reservation.date = newDate;
    reservation.startTime = newStartTime;
    reservation.partySize = newPartySize;
    reservation.duration = newDuration;

    const updatedReservation = await reservation.save();

    // Send modification notification
    notificationService.sendModificationNotification(updatedReservation);

    return updatedReservation;
  },

  /**
   * Cancels an existing reservation and processes the waitlist for the freed time slot.
   * Sends a cancellation notification to the customer.
   *
   * @param {string} reservationId - The ID of the reservation to cancel
   * @returns {Promise<IReservation>} The cancelled reservation object
   * @throws {Error} If reservation ID is invalid, reservation not found, or reservation is already cancelled/completed
   */
  async cancelReservation(reservationId: string): Promise<IReservation> {
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      throw new Error("Invalid reservation ID");
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (reservation.status === "cancelled") {
      throw new Error("Reservation is already cancelled");
    }

    if (reservation.status === "completed") {
      throw new Error("Cannot cancel a completed reservation");
    }

    reservation.status = "cancelled";
    const cancelledReservation = await reservation.save();

    // Send cancellation notification
    notificationService.sendCancellationNotification(cancelledReservation);

    // Check waitlist and notify next person
    await this.processWaitlist(
      reservation.restaurantId.toString(),
      reservation.date,
      reservation.startTime,
      reservation.duration
    );

    return cancelledReservation;
  },

  /**
   * Confirms a pending reservation by changing its status to 'confirmed'.
   *
   * @param {string} reservationId - The ID of the reservation to confirm
   * @returns {Promise<IReservation>} The confirmed reservation object
   * @throws {Error} If reservation ID is invalid, reservation not found, or reservation is cancelled/completed
   */
  async confirmReservation(reservationId: string): Promise<IReservation> {
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      throw new Error("Invalid reservation ID");
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (reservation.status === "cancelled") {
      throw new Error("Cannot confirm a cancelled reservation");
    }

    if (reservation.status === "completed") {
      throw new Error("Reservation is already completed");
    }

    reservation.status = "confirmed";
    return await reservation.save();
  },

  /**
   * Marks a reservation as completed.
   *
   * @param {string} reservationId - The ID of the reservation to complete
   * @returns {Promise<IReservation>} The completed reservation object
   * @throws {Error} If reservation ID is invalid, reservation not found, or reservation is cancelled
   */
  async completeReservation(reservationId: string): Promise<IReservation> {
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      throw new Error("Invalid reservation ID");
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (reservation.status === "cancelled") {
      throw new Error("Cannot complete a cancelled reservation");
    }

    reservation.status = "completed";
    return await reservation.save();
  },

  /**
   * Checks if a specific table has any conflicting reservations for the given time slot.
   * Optionally excludes a specific reservation from the conflict check.
   *
   * @param {string} tableId - The ID of the table to check
   * @param {string} date - The date to check (YYYY-MM-DD format)
   * @param {string} startTime - The start time to check (HH:MM format)
   * @param {number} duration - The duration in minutes
   * @param {string} [excludeReservationId] - Optional reservation ID to exclude from conflict check
   * @returns {Promise<boolean>} True if there is a conflict, false otherwise
   */
  async checkTableConflict(
    tableId: string,
    date: string,
    startTime: string,
    duration: number,
    excludeReservationId?: string
  ): Promise<boolean> {
    const query: any = {
      tableId,
      date,
      status: { $in: ["pending", "confirmed"] },
    };

    if (excludeReservationId) {
      query._id = { $ne: excludeReservationId };
    }

    const reservations = await Reservation.find(query);

    return reservations.some((reservation) => {
      return doTimeSlotsOverlap(
        startTime,
        duration,
        reservation.startTime,
        reservation.duration
      );
    });
  },

  /**
   * Finds an available table for the given party size and time slot.
   * Optionally excludes a specific reservation from the availability check.
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {number} partySize - The number of guests
   * @param {string} date - The date (YYYY-MM-DD format)
   * @param {string} startTime - The start time (HH:MM format)
   * @param {number} duration - The duration in minutes
   * @param {string} [excludeReservationId] - Optional reservation ID to exclude from availability check
   * @returns {Promise<any>} The available table object or null if none found
   */
  async findAvailableTable(
    restaurantId: string,
    partySize: number,
    date: string,
    startTime: string,
    duration: number,
    excludeReservationId?: string
  ) {
    const tables = await Table.find({
      restaurantId,
      capacity: { $gte: partySize },
    }).sort({ capacity: 1 });

    if (tables.length === 0) {
      return null;
    }

    const query: any = {
      restaurantId,
      date,
      status: { $in: ["pending", "confirmed"] },
    };

    if (excludeReservationId) {
      query._id = { $ne: excludeReservationId };
    }

    const existingReservations = await Reservation.find(query);

    for (const table of tables) {
      const hasConflict = existingReservations.some((reservation) => {
        if (reservation.tableId.toString() !== table._id.toString()) {
          return false;
        }
        return doTimeSlotsOverlap(
          startTime,
          duration,
          reservation.startTime,
          reservation.duration
        );
      });

      if (!hasConflict) {
        return table;
      }
    }

    return null;
  },

  /**
   * Processes the waitlist for a restaurant when a table becomes available.
   * Notifies the next waiting customer if a table is available for their preferred time.
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {string} date - The date (YYYY-MM-DD format)
   * @param {string} startTime - The start time (HH:MM format)
   * @param {number} duration - The duration in minutes
   * @returns {Promise<void>}
   */
  async processWaitlist(
    restaurantId: string,
    date: string,
    startTime: string,
    duration: number
  ): Promise<void> {
    // Import here to avoid circular dependency
    const { waitlistService } = await import("./waitlistService.js");
    await waitlistService.notifyWaitlist(
      restaurantId,
      date,
      startTime,
      duration
    );
  },

  /**
   * Checks if a table is available for the given party size and time slot.
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {number} partySize - The number of guests
   * @param {string} date - The date (YYYY-MM-DD format)
   * @param {string} startTime - The start time (HH:MM format)
   * @param {number} duration - The duration in minutes
   * @returns {Promise<boolean>} True if available, false otherwise
   */
  async checkAvailability(
    restaurantId: string,
    partySize: number,
    date: string,
    startTime: string,
    duration: number
  ): Promise<boolean> {
    const table = await this.findAvailableTable(
      restaurantId,
      partySize,
      date,
      startTime,
      duration
    );
    return table !== null;
  },

  /**
   * Retrieves all non-cancelled reservations for a restaurant on a specific date.
   * Includes populated table information and sorted by start time.
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {string} date - The date (YYYY-MM-DD format)
   * @returns {Promise<IReservation[]>} Array of reservation objects
   * @throws {Error} If restaurant ID is invalid
   */
  async getReservationsByDate(
    restaurantId: string,
    date: string
  ): Promise<IReservation[]> {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new Error("Invalid restaurant ID");
    }

    return await Reservation.find({
      restaurantId,
      date,
      status: { $ne: "cancelled" },
    })
      .populate("tableId")
      .sort({ startTime: 1 });
  },

  /**
   * Gets all available time slots for a restaurant on a specific date for the given party size.
   * Generates time slots based on restaurant operating hours and checks availability.
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {number} partySize - The number of guests
   * @param {string} date - The date (YYYY-MM-DD format)
   * @param {number} [slotDuration=120] - Duration of each time slot in minutes (default: 120)
   * @returns {Promise<TimeSlot[]>} Array of available time slot objects
   * @throws {Error} If restaurant ID is invalid or restaurant not found
   */
  async getAvailableTimeSlots(
    restaurantId: string,
    partySize: number,
    date: string,
    slotDuration: number = 120
  ): Promise<TimeSlot[]> {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new Error("Invalid restaurant ID");
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    const tables = await Table.find({
      restaurantId,
      capacity: { $gte: partySize },
    });

    if (tables.length === 0) {
      return [];
    }

    const existingReservations = await Reservation.find({
      restaurantId,
      date,
      status: { $in: ["pending", "confirmed"] },
    });

    const timeSlots: TimeSlot[] = [];

    const openingMinutes = timeToMinutes(restaurant.openingTime);
    const closingMinutes = timeToMinutes(restaurant.closingTime);

    for (
      let time = openingMinutes;
      time + slotDuration <= closingMinutes;
      time += 30
    ) {
      const startTime = minutesToTime(time);
      const endTime = minutesToTime(time + slotDuration);

      const availableTables = tables.filter((table) => {
        const hasConflict = existingReservations.some((reservation) => {
          if (reservation.tableId.toString() !== table._id.toString()) {
            return false;
          }
          return doTimeSlotsOverlap(
            startTime,
            slotDuration,
            reservation.startTime,
            reservation.duration
          );
        });
        return !hasConflict;
      });

      if (availableTables.length > 0) {
        timeSlots.push({
          startTime,
          endTime,
          availableTables: availableTables.map((t) => t._id.toString()),
        });
      }
    }

    return timeSlots;
  },
};
