import { Request, Response } from "express";
import { reservationService } from "../services/reservationService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

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
    const {
      restaurantId,
      customerName,
      phone,
      partySize,
      date,
      startTime,
      duration,
      email,
    } = req.body;

    if (
      !restaurantId ||
      !customerName ||
      !phone ||
      !partySize ||
      !date ||
      !startTime ||
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
          "startTime",
          "duration",
        ],
      });
      return;
    }

    if (partySize < 1) {
      res.status(400).json({
        success: false,
        message: "Party size must be at least 1",
      });
      return;
    }

    if (duration < 30) {
      res.status(400).json({
        success: false,
        message: "Duration must be at least 30 minutes",
      });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) {
      res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM (24-hour format)",
      });
      return;
    }

    const isAvailable = await reservationService.checkAvailability(
      restaurantId as string,
      Number(partySize),
      date as string,
      startTime as string,
      Number(duration)
    );

    if (!isAvailable) {
      res.status(400).json({
        success: false,
        message: "Time slot is not available",
      });
      return;
    }

    const reservation = await reservationService.createReservation(
      restaurantId,
      customerName,
      phone,
      partySize,
      date,
      startTime,
      duration,
      email
    );

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
    const { id } = req.params;
    const { date, startTime, partySize, duration } = req.body;

    if (!date && !startTime && !partySize && !duration) {
      res.status(400).json({
        success: false,
        message: "At least one field must be provided to update",
        updatable: ["date", "startTime", "partySize", "duration"],
      });
      return;
    }

    const updates: any = {};
    if (date) updates.date = date;
    if (startTime) updates.startTime = startTime;
    if (partySize) updates.partySize = partySize;
    if (duration) updates.duration = duration;

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
    const { id } = req.params;

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
    const { id } = req.params;

    const reservation = await reservationService.confirmReservation(id);

    res.status(200).json({
      success: true,
      message: "Reservation confirmed successfully",
      data: reservation,
    });
  }),

  // Complete reservation
  completeReservation: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

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
    const { restaurantId, partySize, date, startTime, duration } = req.query;

    if (!restaurantId || !partySize || !date || !startTime || !duration) {
      res.status(400).json({
        success: false,
        message: "Missing required query parameters",
        required: [
          "restaurantId",
          "partySize",
          "date",
          "startTime",
          "duration",
        ],
      });
      return;
    }

    const isAvailable = await reservationService.checkAvailability(
      restaurantId as string,
      Number(partySize),
      date as string,
      startTime as string,
      Number(duration)
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
   * @param req - Express request object with query parameters: restaurantId, date
   * @param res - Express response object
   * @returns JSON response with count and array of reservations for the date
   */
  getReservationsByDate: asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId, date } = req.query;

    if (!restaurantId || !date) {
      res.status(400).json({
        success: false,
        message: "Missing required query parameters",
        required: ["restaurantId", "date"],
      });
      return;
    }

    const reservations = await reservationService.getReservationsByDate(
      restaurantId as string,
      date as string
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
   * @param req - Express request object with query parameters: restaurantId, partySize, date, duration (optional)
   * @param res - Express response object
   * @returns JSON response with count and array of available time slots
   */
  getAvailableTimeSlots: asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId, partySize, date, duration } = req.query;

    if (!restaurantId || !partySize || !date) {
      res.status(400).json({
        success: false,
        message: "Missing required query parameters",
        required: ["restaurantId", "partySize", "date"],
      });
      return;
    }

    const timeSlots = await reservationService.getAvailableTimeSlots(
      restaurantId as string,
      Number(partySize),
      date as string,
      duration ? Number(duration) : undefined
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
