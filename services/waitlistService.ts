/**
 * Waitlist service — business logic for managing customer waitlist entries.
 *
 * Customers are added to the waitlist when no table is available for their
 * preferred date and time.  When a cancellation frees up a slot, the service
 * checks the waitlist and notifies the first eligible waiting customer.
 * Customers can also convert their waitlist entry directly into a reservation
 * once notified, or remove themselves from the waitlist at any time.
 */
import { Waitlist } from "../models/waitlist.js";
import { IWaitlist } from "../types/index.js";
import { Branch } from "../models/branch.js";
import { notificationService } from "./notificationService.js";
import { reservationService } from "./reservationService.js";
import mongoose from "mongoose";

export const waitlistService = {
  /**
   * Adds a customer to the waitlist for a specific restaurant, date, and preferred time.
   * Validates the restaurant exists and sets an expiration date for the waitlist entry.
   * Sends a waitlist confirmation notification upon successful addition.
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {string} customerName - The name of the customer
   * @param {string} phone - The customer's phone number
   * @param {number} partySize - The number of guests in the party
   * @param {string} date - The date for the waitlist entry (YYYY-MM-DD format)
   * @param {string} preferredTime - The preferred time in HH:MM format
   * @param {number} duration - The duration of the reservation in minutes
   * @param {string} [email] - The customer's email address (optional)
   * @returns {Promise<IWaitlist>} The created waitlist entry object
   * @throws {Error} If restaurant ID is invalid, restaurant not found, or date is in the past
   */
  async addToWaitlist(
    branchId: string,
    customerName: string,
    phone: string,
    partySize: number,
    date: string,
    preferredTime: string,
    duration: number,
    email?: string,
    customerId?: string,
  ): Promise<IWaitlist> {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    // Validate date is not in the past
    const waitlistDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (waitlistDate < today) {
      throw new Error("Cannot add to waitlist for past dates");
    }

    // Set expiration to end of the requested date
    const expiresAt = new Date(date);
    expiresAt.setHours(23, 59, 59, 999);

    const waitlistEntry = new Waitlist({
      restaurantId: branch.restaurantId,
      branchId,
      customerId,
      customerName,
      phone,
      email,
      partySize,
      date,
      preferredTime,
      duration,
      status: "waiting",
      expiresAt,
    });

    const savedEntry = await waitlistEntry.save();

    // Send waitlist confirmation
    notificationService.sendWaitlistConfirmation(savedEntry);

    return savedEntry;
  },

  /**
   * Retrieves waitlist entries for a specific restaurant and date.
   * Optionally filters by status if provided. Results are sorted by creation time (first come, first served).
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {string} date - The date to retrieve waitlist entries for (YYYY-MM-DD format)
   * @param {string} [status] - Optional status filter ('waiting', 'notified', 'converted', 'expired')
   * @returns {Promise<IWaitlist[]>} Array of waitlist entry objects
   * @throws {Error} If restaurant ID is invalid
   */
  async getWaitlistByDate(
    branchId: string,
    date: string,
    status?: string,
  ): Promise<IWaitlist[]> {
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      throw new Error("Invalid branch ID");
    }

    const query: any = { branchId, date };

    if (status) {
      query.status = status;
    }

    return await Waitlist.find(query).sort({ createdAt: 1 });
  },

  /**
   * Notifies the next waiting customer when a table becomes available.
   * Finds waiting customers for the specified date and checks if their preferred time slot is now available.
   * Updates the first eligible customer's status to 'notified' and sends a notification.
   * Only notifies one customer at a time (first come, first served).
   *
   * @param {string} restaurantId - The ID of the restaurant
   * @param {string} date - The date when the table became available (YYYY-MM-DD format)
   * @param {string} startTime - The start time of the available slot (HH:MM format)
   * @param {number} duration - The duration of the available slot in minutes
   * @returns {Promise<void>}
   */
  async notifyWaitlist(
    branchId: string,
    date: string,
    startTime: string,
    duration: number,
  ): Promise<void> {
    // Find waiting customers for this date
    const waitingCustomers = await Waitlist.find({
      branchId,
      date,
      status: "waiting",
    }).sort({ createdAt: 1 }); // First come, first served

    for (const waitlistEntry of waitingCustomers) {
      // Check if a table is now available for this customer
      const isAvailable = await reservationService.checkAvailability(
        branchId,
        waitlistEntry.partySize,
        date,
        waitlistEntry.preferredTime,
        waitlistEntry.duration,
      );

      if (isAvailable) {
        // Update waitlist status
        waitlistEntry.status = "notified";
        waitlistEntry.notifiedAt = new Date();
        await waitlistEntry.save();

        // Send notification
        notificationService.sendWaitlistNotification(waitlistEntry);

        // Only notify one customer at a time
        break;
      }
    }
  },

  /**
   * Convert waitlist entry to reservation
   * Converts a 'waiting' or 'notified' waitlist entry into a confirmed reservation.
   * Re-checks that the requested time slot is still available before creating the reservation.
   * Updates the waitlist entry status to 'converted' upon success.
   *
   * @param {string} waitlistId - The ID of the waitlist entry to convert
   * @returns {Promise<{reservation: IReservation, message: string}>} The newly created reservation and a success message
   * @throws {Error} If waitlist ID is invalid, entry not found, entry status is not convertible, or the time slot is no longer available
   */
  async convertToReservation(waitlistId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(waitlistId)) {
      throw new Error("Invalid waitlist ID");
    }

    const waitlistEntry = await Waitlist.findById(waitlistId);
    if (!waitlistEntry) {
      throw new Error("Waitlist entry not found");
    }

    if (
      waitlistEntry.status !== "notified" &&
      waitlistEntry.status !== "waiting"
    ) {
      throw new Error("Waitlist entry cannot be converted");
    }

    // Check if still available
    const isAvailable = await reservationService.checkAvailability(
      waitlistEntry.branchId.toString(),
      waitlistEntry.partySize,
      waitlistEntry.date,
      waitlistEntry.preferredTime,
      waitlistEntry.duration,
    );

    if (!isAvailable) {
      throw new Error("Time slot is no longer available");
    }

    // Create reservation
    const reservation = await reservationService.createReservation(
      waitlistEntry.branchId.toString(),
      waitlistEntry.customerName,
      waitlistEntry.phone,
      waitlistEntry.partySize,
      waitlistEntry.date,
      waitlistEntry.preferredTime,
      waitlistEntry.duration,
      waitlistEntry.email,
      undefined,
      waitlistEntry.customerId?.toString(),
    );

    // Update waitlist status
    waitlistEntry.status = "converted";
    await waitlistEntry.save();

    return {
      reservation,
      message: "Waitlist entry converted to reservation successfully",
    };
  },

  /**
   * Removes a customer from the waitlist by marking their entry as expired.
   * This is typically used when a customer cancels their waitlist request.
   * Cannot remove entries that have already been converted to reservations.
   *
   * @param {string} waitlistId - The ID of the waitlist entry to remove
   * @returns {Promise<IWaitlist>} The updated waitlist entry with expired status
   * @throws {Error} If waitlist ID is invalid, entry not found, or entry has already been converted
   */
  async removeFromWaitlist(waitlistId: string): Promise<IWaitlist> {
    if (!mongoose.Types.ObjectId.isValid(waitlistId)) {
      throw new Error("Invalid waitlist ID");
    }

    const waitlistEntry = await Waitlist.findById(waitlistId);
    if (!waitlistEntry) {
      throw new Error("Waitlist entry not found");
    }

    if (waitlistEntry.status === "converted") {
      throw new Error(
        "Waitlist entry has already been converted to a reservation",
      );
    }

    waitlistEntry.status = "expired";
    return await waitlistEntry.save();
  },

  /**
   * Cleans up expired waitlist entries by marking entries that have passed their expiration time as 'expired'.
   * Only affects entries with status 'waiting' or 'notified' that have expired.
   * This helps maintain database cleanliness and prevents processing of outdated entries.
   *
   * @returns {Promise<number>} The number of entries that were marked as expired
   */
  async cleanupExpiredEntries(): Promise<number> {
    const now = new Date();

    const result = await Waitlist.updateMany(
      {
        expiresAt: { $lt: now },
        status: { $in: ["waiting", "notified"] },
      },
      {
        $set: { status: "expired" },
      },
    );

    return result.modifiedCount;
  },
};
