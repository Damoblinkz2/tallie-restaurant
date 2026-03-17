/**
 * Waitlist controller — HTTP request handlers for waitlist management.
 *
 * Handles adding customers to the waitlist, fetching waitlist entries by date,
 * converting a waitlist entry into a reservation, and removing entries.
 * Each handler validates inputs before delegating to the waitlist service.
 */
import { Request, Response } from "express";
import { waitlistService } from "../services/waitlistService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requestSchemas } from "../validation/schemas.js";
import { validateControllerInput } from "../utils/controllerValidation.js";

export const waitlistController = {
  /**
   * Adds a customer to the restaurant waitlist for a requested date and time.
   * Creates a waitlist entry and sends a confirmation notification to the customer.
   *
   * @param req - Express request containing waitlist details in body
   * @param res - Express response object
   * @returns JSON response with success status and the created waitlist entry
   */
  addToWaitlist: asyncHandler(async (req: Request, res: Response) => {
    const validatedBody = validateControllerInput<{
      branchId: string;
      customerName: string;
      phone: string;
      partySize: number;
      date: string;
      preferredTime: string;
      duration: number;
      email?: string;
    }>(requestSchemas.addToWaitlist, req.body, res);

    if (!validatedBody) {
      return;
    }

    const {
      branchId,
      customerName,
      phone,
      partySize,
      date,
      preferredTime,
      duration,
      email,
    } = validatedBody;

    const waitlistEntry = await waitlistService.addToWaitlist(
      branchId,
      customerName,
      phone,
      partySize,
      date,
      preferredTime,
      duration,
      email,
      (req as any).user?.id,
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
   * @param req - Express request object with query parameters: branchId, date, status (optional)
   * @param res - Express response object
   * @returns JSON response with success status, count, and array of waitlist entries
   */
  getWaitlistByDate: asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = validateControllerInput<{
      branchId: string;
      date: string;
      status?: "waiting" | "notified" | "converted" | "expired";
    }>(requestSchemas.waitlistByDateQuery, req.query, res);

    if (!validatedQuery) {
      return;
    }

    const { branchId, date, status } = validatedQuery;

    const waitlist = await waitlistService.getWaitlistByDate(
      branchId,
      date,
      status,
    );

    res.status(200).json({
      success: true,
      count: waitlist.length,
      data: waitlist,
    });
  }),

  /**
   * Converts a waitlist entry into a full reservation.
   * Only entries with status 'waiting' or 'notified' can be converted.
   * Verifies that the requested time slot is still available before creating the reservation.
   *
   * @param req - Express request with waitlist entry ID in params
   * @param res - Express response object
   * @returns JSON response with success status and the newly created reservation
   */
  convertToReservation: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ id: string }>(
      requestSchemas.idParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const { id } = validatedParams;

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
    const validatedParams = validateControllerInput<{ id: string }>(
      requestSchemas.idParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const { id } = validatedParams;

    const waitlistEntry = await waitlistService.removeFromWaitlist(id);

    res.status(200).json({
      success: true,
      message: "Removed from waitlist successfully",
      data: waitlistEntry,
    });
  }),
};
