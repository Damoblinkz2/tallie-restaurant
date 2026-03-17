/**
 * Reservation service — core business logic for booking management.
 *
 * Handles the full reservation lifecycle: creating, modifying, cancelling,
 * confirming, and completing bookings.  Also owns the table-availability
 * algorithm and exposes helpers for checking open slots.
 *
 * Pre-order kitchen notifications are managed by a module-level timer registry
 * (`preparationTimers`) so timers can be cancelled if a reservation is modified
 * or cancelled before the 30-minute trigger fires.
 */
import { Reservation } from "../models/reservation.js";
import { IPreOrderItem, IReservation } from "../types/index.js";
import { Table } from "../models/table.js";
import { Branch } from "../models/branch.js";
import { TimeSlot } from "../types/index.js";
import {
  isTimeInRange,
  doTimeSlotsOverlap,
  timeToMinutes,
  minutesToTime,
} from "../utils/timeUtils.js";
import { notificationService } from "./notificationService.js";
import mongoose from "mongoose";

/**
 * Maximum safe delay for `setTimeout` in Node.js (2^31 − 1 ms ≈ 24.8 days).
 * Reservations scheduled further in the future than this limit are skipped;
 * a recurring job or server restart would re-schedule them closer to the time.
 */
const MAX_TIMEOUT_MS = 2147483647;

/**
 * In-memory registry that maps a reservation ID string to its active preparation timer.
 * Storing the timer handles here allows us to cancel a scheduled notification if the
 * reservation is modified or cancelled before the 30-minute window fires.
 */
const preparationTimers = new Map<string, NodeJS.Timeout>();

/**
 * Cancels and removes the preparation notification timer for the given reservation, if one exists.
 * Called whenever a reservation is cancelled or completed so the kitchen is not alerted
 * for a booking that will never arrive.
 *
 * @param reservationId - The string representation of the reservation's MongoDB ObjectId
 */
const clearPreparationTimer = (reservationId: string): void => {
  const existingTimer = preparationTimers.get(reservationId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    preparationTimers.delete(reservationId);
  }
};

/**
 * Schedules a kitchen preparation notification for a reservation that has pre-ordered items.
 * The notification fires 30 minutes before the customer's arrival (`reservation.startTime`).
 *
 * Scheduling rules:
 * - If the reservation has no pre-order items, no timer is set.
 * - If the trigger time has already passed (late booking), the notification fires immediately.
 * - If the delay would exceed `MAX_TIMEOUT_MS` (>24.8 days), the timer is skipped to avoid
 *   integer overflow in `setTimeout`.
 * - Any previously scheduled timer for the same reservation is cancelled first to prevent
 *   duplicate alerts when a reservation is modified.
 *
 * @param reservation - The reservation document that may carry pre-ordered items
 */
const schedulePreparationNotification = (reservation: IReservation): void => {
  // Cancel any existing timer for this reservation before setting a new one
  clearPreparationTimer(reservation._id.toString());

  if (!reservation.preOrderItems || reservation.preOrderItems.length === 0) {
    return;
  }

  const arrivalDateTime = new Date(
    `${reservation.date}T${reservation.startTime}:00`,
  );
  const triggerAt = new Date(arrivalDateTime.getTime() - 30 * 60 * 1000);
  const delayMs = triggerAt.getTime() - Date.now();

  if (delayMs <= 0) {
    // Arrival is imminent or in the past — notify the kitchen right away
    notificationService.sendStartCookingNotification(reservation);
    return;
  }

  if (delayMs > MAX_TIMEOUT_MS) {
    // Too far in the future for a single setTimeout call — skip to prevent overflow
    return;
  }

  const timer = setTimeout(() => {
    notificationService.sendStartCookingNotification(reservation);
    preparationTimers.delete(reservation._id.toString());
  }, delayMs);

  preparationTimers.set(reservation._id.toString(), timer);
};

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
    branchId: string,
    customerName: string,
    phone: string,
    partySize: number,
    date: string,
    startTime: string,
    duration: number,
    email?: string,
    preOrderItems?: IPreOrderItem[],
    customerId?: string,
  ): Promise<IReservation> {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new Error("Cannot make reservations for past dates");
    }

    if (!isTimeInRange(startTime, branch.openingTime, branch.closingTime)) {
      throw new Error(
        `Reservation must be within operating hours (${branch.openingTime} - ${branch.closingTime})`,
      );
    }

    const endTimeMinutes = timeToMinutes(startTime) + duration;
    const closingTimeMinutes = timeToMinutes(branch.closingTime);
    if (endTimeMinutes > closingTimeMinutes) {
      throw new Error("Reservation extends beyond closing time");
    }

    const availableTable = await this.findAvailableTable(
      branchId,
      partySize,
      date,
      startTime,
      duration,
    );

    if (!availableTable) {
      throw new Error(
        "No available tables for the requested party size and time",
      );
    }

    const reservation = new Reservation({
      restaurantId: branch.restaurantId,
      branchId,
      tableId: availableTable._id,
      customerId,
      customerName,
      phone,
      email,
      partySize,
      date,
      startTime,
      duration,
      preOrderItems,
      status: "pending",
    });

    const savedReservation = await reservation.save();

    // Send confirmation notification
    notificationService.sendReservationConfirmation(savedReservation);
    schedulePreparationNotification(savedReservation);

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
      preOrderItems?: IPreOrderItem[];
    },
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

    const branch = await Branch.findById(reservation.branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    // Use existing values if not updating
    const newDate = updates.date || reservation.date;
    const newStartTime = updates.startTime || reservation.startTime;
    const newPartySize = updates.partySize || reservation.partySize;
    const newDuration = updates.duration || reservation.duration;
    const newPreOrderItems = updates.preOrderItems ?? reservation.preOrderItems;

    // Validate new date is not in the past
    const reservationDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new Error("Cannot modify to a past date");
    }

    // Validate new time is within operating hours
    if (!isTimeInRange(newStartTime, branch.openingTime, branch.closingTime)) {
      throw new Error(
        `Reservation must be within operating hours (${branch.openingTime} - ${branch.closingTime})`,
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
          reservationId,
        );

        if (hasConflict) {
          // Try to find another available table
          const newTable = await this.findAvailableTable(
            reservation.branchId.toString(),
            newPartySize,
            newDate,
            newStartTime,
            newDuration,
            reservationId,
          );

          if (!newTable) {
            throw new Error("No available tables for the modified time slot");
          }

          reservation.tableId = newTable._id;
        }
      } else {
        // Current table can't accommodate new party size
        const newTable = await this.findAvailableTable(
          reservation.branchId.toString(),
          newPartySize,
          newDate,
          newStartTime,
          newDuration,
          reservationId,
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
    reservation.preOrderItems = newPreOrderItems;

    const updatedReservation = await reservation.save();

    // Send modification notification
    notificationService.sendModificationNotification(updatedReservation);
    schedulePreparationNotification(updatedReservation);

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
    clearPreparationTimer(cancelledReservation._id.toString());

    // Send cancellation notification
    notificationService.sendCancellationNotification(cancelledReservation);

    // Check waitlist and notify next person
    await this.processWaitlist(
      reservation.branchId.toString(),
      reservation.date,
      reservation.startTime,
      reservation.duration,
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
    const completedReservation = await reservation.save();
    clearPreparationTimer(completedReservation._id.toString());
    return completedReservation;
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
    excludeReservationId?: string,
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
        reservation.duration,
      );
    });
  },

  /**
   * Finds an available table for the given party size and time slot.
   * Optionally excludes a specific reservation from the availability check.
   *
   * @param {string} branchId - The ID of the branch
   * @param {number} partySize - The number of guests
   * @param {string} date - The date (YYYY-MM-DD format)
   * @param {string} startTime - The start time (HH:MM format)
   * @param {number} duration - The duration in minutes
   * @param {string} [excludeReservationId] - Optional reservation ID to exclude from availability check
   * @returns {Promise<any>} The available table object or null if none found
   */
  async findAvailableTable(
    branchId: string,
    partySize: number,
    date: string,
    startTime: string,
    duration: number,
    excludeReservationId?: string,
  ) {
    const tables = await Table.find({
      branchId,
      capacity: { $gte: partySize },
    }).sort({ capacity: 1 });

    if (tables.length === 0) {
      return null;
    }

    const query: any = {
      branchId,
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
          reservation.duration,
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
   * @param {string} branchId - The ID of the branch
   * @param {string} date - The date (YYYY-MM-DD format)
   * @param {string} startTime - The start time (HH:MM format)
   * @param {number} duration - The duration in minutes
   * @returns {Promise<void>}
   */
  async processWaitlist(
    branchId: string,
    date: string,
    startTime: string,
    duration: number,
  ): Promise<void> {
    // Import here to avoid circular dependency
    const { waitlistService } = await import("./waitlistService.js");
    await waitlistService.notifyWaitlist(branchId, date, startTime, duration);
  },

  /**
   * Checks if a table is available for the given party size and time slot.
   *
   * @param {string} branchId - The ID of the branch
   * @param {number} partySize - The number of guests
   * @param {string} date - The date (YYYY-MM-DD format)
   * @param {string} startTime - The start time (HH:MM format)
   * @param {number} duration - The duration in minutes
   * @returns {Promise<boolean>} True if available, false otherwise
   */
  async checkAvailability(
    branchId: string,
    partySize: number,
    date: string,
    startTime: string,
    duration: number,
  ): Promise<boolean> {
    const table = await this.findAvailableTable(
      branchId,
      partySize,
      date,
      startTime,
      duration,
    );
    return table !== null;
  },

  /**
   * Retrieves all non-cancelled reservations for a branch on a specific date.
   * Includes populated table information and sorted by start time.
   *
   * @param {string} branchId - The ID of the branch
   * @param {string} date - The date (YYYY-MM-DD format)
   * @returns {Promise<IReservation[]>} Array of reservation objects
   * @throws {Error} If restaurant ID is invalid
   */
  async getReservationsByDate(
    branchId: string,
    date: string,
  ): Promise<IReservation[]> {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    return await Reservation.find({
      branchId,
      date,
      status: { $ne: "cancelled" },
    })
      .populate("tableId")
      .sort({ startTime: 1 });
  },

  /**
   * Gets all available time slots for a branch on a specific date for the given party size.
   * Generates time slots based on restaurant operating hours and checks availability.
   *
   * @param {string} branchId - The ID of the branch
   * @param {number} partySize - The number of guests
   * @param {string} date - The date (YYYY-MM-DD format)
   * @param {number} [slotDuration=120] - Duration of each time slot in minutes (default: 120)
   * @returns {Promise<TimeSlot[]>} Array of available time slot objects
   * @throws {Error} If restaurant ID is invalid or restaurant not found
   */
  async getAvailableTimeSlots(
    branchId: string,
    partySize: number,
    date: string,
    slotDuration: number = 120,
  ): Promise<TimeSlot[]> {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    const tables = await Table.find({
      branchId,
      capacity: { $gte: partySize },
    });

    if (tables.length === 0) {
      return [];
    }

    const existingReservations = await Reservation.find({
      branchId,
      date,
      status: { $in: ["pending", "confirmed"] },
    });

    const timeSlots: TimeSlot[] = [];

    const openingMinutes = timeToMinutes(branch.openingTime);
    const closingMinutes = timeToMinutes(branch.closingTime);

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
            reservation.duration,
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
