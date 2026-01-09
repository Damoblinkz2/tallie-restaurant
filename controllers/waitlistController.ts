import { Request, Response } from "express";
import { waitlistService } from "../services/waitlistService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const waitlistController = {
  // Add to waitlist
  addToWaitlist: asyncHandler(async (req: Request, res: Response) => {
    const {
      restaurantId,
      customerName,
      phone,
      partySize,
      date,
      preferredTime,
      duration,
      email,
    } = req.body;

    if (
      !restaurantId ||
      !customerName ||
      !phone ||
      !partySize ||
      !date ||
      !preferredTime ||
      !duration
    ) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
        required: [
          "restaurantId",
          "customerName",
          "phone",
          "partySize",
          "date",
          "preferredTime",
          "duration",
        ],
      });
      return;
    }

    const waitlistEntry = await waitlistService.addToWaitlist(
      restaurantId,
      customerName,
      phone,
      partySize,
      date,
      preferredTime,
      duration,
      email
    );

    res.status(201).json({
      success: true,
      message: "Added to waitlist successfully",
      data: waitlistEntry,
    });
  }),

  /**
   * Retrieves the waitlist for a specific restaurant and date.
   * Optionally filters by status (active, notified, etc.).
   * Returns waitlist entries sorted by position.
   *
   * @param req - Express request object with query parameters: restaurantId, date, status (optional)
   * @param res - Express response object
   * @returns JSON response with success status, count, and array of waitlist entries
   */
  getWaitlistByDate: asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId, date, status } = req.query;

    if (!restaurantId || !date) {
      res.status(400).json({
        success: false,
        message: "Missing required query parameters",
        required: ["restaurantId", "date"],
      });
      return;
    }

    const waitlist = await waitlistService.getWaitlistByDate(
      restaurantId as string,
      date as string,
      status as string
    );

    res.status(200).json({
      success: true,
      count: waitlist.length,
      data: waitlist,
    });
  }),

  // Convert waitlist to reservation
  convertToReservation: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await waitlistService.convertToReservation(id);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.reservation,
    });
  }),

  /**
   * Removes a customer from the waitlist.
   * This could be due to the customer cancelling or being seated.
   * Updates the positions of remaining waitlist entries.
   *
   * @param req - Express request object with waitlist entry ID in params
   * @param res - Express response object
   * @returns JSON response with success status and removed waitlist entry data
   */
  removeFromWaitlist: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const waitlistEntry = await waitlistService.removeFromWaitlist(id);

    res.status(200).json({
      success: true,
      message: "Removed from waitlist successfully",
      data: waitlistEntry,
    });
  }),
};
