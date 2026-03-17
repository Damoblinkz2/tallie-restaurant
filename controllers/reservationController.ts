/**
 * Reservation controller — HTTP request handlers for reservation management.
 *
 * Handles the full reservation lifecycle: create, modify, cancel, confirm,
 * complete, availability checks, and date/slot queries.
 * Each handler validates inputs at the controller level before delegating
 * to the reservation service and returning a structured JSON response.
 */
import { Request, Response } from "express";
import { reservationService } from "../services/reservationService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requestSchemas } from "../validation/schemas.js";
import { validateControllerInput } from "../utils/controllerValidation.js";

export const reservationController = {
  /**
   * Creates a new reservation for a restaurant.
   * Validates input data, checks availability, and creates the reservation if possible.
   * Sends a confirmation notification upon successful creation.
   *
   * @param req - Express request object containing reservation details in body
   * @param res - Express response object
   * @returns JSON response with success status and created reservation data
   */
  createReservation: asyncHandler(async (req: Request, res: Response) => {
    const validatedBody = validateControllerInput<{
      branchId: string;
      customerName: string;
      phone: string;
      partySize: number;
      date: string;
      startTime: string;
      duration: number;
      email?: string;
      preOrderItems?: {
        itemId: string;
        name: string;
        quantity: number;
        price: number;
        notes?: string;
      }[];
    }>(requestSchemas.createReservation, req.body, res);

    if (!validatedBody) {
      return;
    }

    const {
      branchId,
      customerName,
      phone,
      partySize,
      date,
      startTime,
      duration,
      email,
      preOrderItems,
    } = validatedBody;

    //check for reservation availability,pass in the restaurantId,
    //time and duration.
    const isAvailable = await reservationService.checkAvailability(
      branchId as string,
      Number(partySize),
      date as string,
      startTime as string,
      Number(duration),
    );

    //if not available, return a 400 response with a message indicating the time slot is not available
    if (!isAvailable) {
      res.status(400).json({
        success: false,
        message: "Time slot is not available",
      });
      return;
    }

    //create the reservation using the reservation service and return a 201 response with the created reservation data
    const reservation = await reservationService.createReservation(
      branchId,
      customerName,
      phone,
      partySize,
      date,
      startTime,
      duration,
      email,
      preOrderItems,
      (req as any).user?.id,
    );

    //send a confirmation notification to the customer
    // (this can be implemented in the service layer)
    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: reservation,
    });
  }),

  /**
   * Modifies an existing reservation with updated details.
   * Allows updating date, start time, party size, and duration.
   * Validates changes and ensures table availability for modifications.
   *
   * @param req - Express request object with reservation ID in params and updates in body
   * @param res - Express response object
   * @returns JSON response with success status and updated reservation data
   */
  modifyReservation: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ id: string }>(
      requestSchemas.idParam,
      req.params,
      res,
    );
    const validatedBody = validateControllerInput<{
      date?: string;
      startTime?: string;
      partySize?: number;
      duration?: number;
      preOrderItems?: {
        itemId: string;
        name: string;
        quantity: number;
        price: number;
        notes?: string;
      }[];
    }>(requestSchemas.modifyReservation, req.body, res);

    if (!validatedParams || !validatedBody) {
      return;
    }

    const { id } = validatedParams;
    const { date, startTime, partySize, duration, preOrderItems } =
      validatedBody;

    const updates: any = {};
    if (date) updates.date = date;
    if (startTime) updates.startTime = startTime;
    if (partySize) updates.partySize = partySize;
    if (duration) updates.duration = duration;
    if (preOrderItems) updates.preOrderItems = preOrderItems;

    const reservation = await reservationService.modifyReservation(id, updates);

    res.status(200).json({
      success: true,
      message: "Reservation modified successfully",
      data: reservation,
    });
  }),

  /**
   * Cancels an existing reservation.
   * Changes the reservation status to cancelled and processes the waitlist
   * to notify the next person in line if applicable.
   *
   * @param req - Express request object with reservation ID in params
   * @param res - Express response object
   * @returns JSON response with success status and cancelled reservation data
   */
  cancelReservation: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ id: string }>(
      requestSchemas.idParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const { id } = validatedParams;

    const reservation = await reservationService.cancelReservation(id);

    res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
      data: reservation,
    });
  }),

  /**
   * Confirms a pending reservation by changing its status to confirmed.
   * This is typically done by restaurant staff to acknowledge the reservation.
   *
   * @param req - Express request object with reservation ID in params
   * @param res - Express response object
   * @returns JSON response with success status and confirmed reservation data
   */
  confirmReservation: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ id: string }>(
      requestSchemas.idParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const { id } = validatedParams;

    const reservation = await reservationService.confirmReservation(id);

    res.status(200).json({
      success: true,
      message: "Reservation confirmed successfully",
      data: reservation,
    });
  }),

  /**
   * Marks an existing reservation as completed, clearing any pending kitchen preparation timers.
   * Typically called by restaurant staff when the guests have finished their visit.
   *
   * @param req - Express request object with reservation ID in params
   * @param res - Express response object
   * @returns JSON response with success status and the completed reservation data
   */
  completeReservation: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ id: string }>(
      requestSchemas.idParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const { id } = validatedParams;

    const reservation = await reservationService.completeReservation(id);

    res.status(200).json({
      success: true,
      message: "Reservation marked as completed",
      data: reservation,
    });
  }),

  /**
   * Checks if a specific time slot is available for a given restaurant, party size, date, and duration.
   * Returns availability status and a descriptive message.
   *
   * @param req - Express request object with query parameters: restaurantId, partySize, date, startTime, duration
   * @param res - Express response object
   * @returns JSON response with availability status and message
   */
  checkAvailability: asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = validateControllerInput<{
      branchId: string;
      partySize: number;
      date: string;
      startTime: string;
      duration: number;
    }>(requestSchemas.checkAvailabilityQuery, req.query, res);

    if (!validatedQuery) {
      return;
    }

    const { branchId, partySize, date, startTime, duration } = validatedQuery;

    const isAvailable = await reservationService.checkAvailability(
      branchId,
      partySize,
      date,
      startTime,
      duration,
    );

    res.status(200).json({
      success: true,
      available: isAvailable,
      message: isAvailable
        ? "Time slot is available"
        : "Time slot is not available",
    });
  }),

  /**
   * Retrieves all reservations for a specific restaurant on a given date.
   * Returns reservations that are not cancelled, sorted by start time.
   *
   * @param req - Express request object with query parameters: branchId, date
   * @param res - Express response object
   * @returns JSON response with count and array of reservations for the date
   */
  getReservationsByDate: asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = validateControllerInput<{
      branchId: string;
      date: string;
    }>(requestSchemas.reservationsByDateQuery, req.query, res);

    if (!validatedQuery) {
      return;
    }

    const { branchId, date } = validatedQuery;

    const reservations = await reservationService.getReservationsByDate(
      branchId,
      date,
    );

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  }),

  /**
   * Retrieves all available time slots for a restaurant on a specific date and party size.
   * Generates time slots based on restaurant operating hours and existing reservations.
   *
   * @param req - Express request object with query parameters: branchId, partySize, date, duration (optional)
   * @param res - Express response object
   * @returns JSON response with count and array of available time slots
   */
  getAvailableTimeSlots: asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery = validateControllerInput<{
      branchId: string;
      partySize: number;
      date: string;
      duration?: number;
    }>(requestSchemas.availableSlotsQuery, req.query, res);

    if (!validatedQuery) {
      return;
    }

    const { branchId, partySize, date, duration } = validatedQuery;

    const timeSlots = await reservationService.getAvailableTimeSlots(
      branchId,
      partySize,
      date,
      duration,
    );

    res.status(200).json({
      success: true,
      count: timeSlots.length,
      data: timeSlots,
      message:
        timeSlots.length > 0
          ? `Found ${timeSlots.length} available time slots`
          : "No available time slots for this date and party size",
    });
  }),
};
