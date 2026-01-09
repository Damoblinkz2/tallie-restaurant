import { Request, Response } from "express";
import { restaurantService } from "../services/restaurantService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const restaurantController = {
  /**
   * Creates a new restaurant with specified operating hours and table capacity.
   * Validates required fields and creates the restaurant along with its tables.
   *
   * @param req - Express request object containing restaurant details in body
   * @param res - Express response object
   * @returns JSON response with success status and created restaurant data
   */
  createRestaurant: asyncHandler(async (req: Request, res: Response) => {
    const { name, openingTime, closingTime, totalTables } = req.body;

    // Validation
    if (!name || !openingTime || !closingTime || !totalTables) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
        required: ["name", "openingTime", "closingTime", "totalTables"],
      });
      return;
    }

    const restaurant = await restaurantService.createRestaurant(
      name,
      openingTime,
      closingTime,
      totalTables
    );

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: restaurant,
    });
  }),

  // Get restaurant details with tables
  getRestaurantDetails: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const details = await restaurantService.getRestaurantDetails(id);

    res.status(200).json({
      success: true,
      data: details,
    });
  }),

  /**
   * Retrieves a list of all restaurants in the system.
   * Returns basic restaurant information without detailed table data.
   *
   * @param req - Express request object
   * @param res - Express response object
   * @returns JSON response with success status, count, and array of restaurants
   */
  getAllRestaurants: asyncHandler(async (req: Request, res: Response) => {
    const restaurants = await restaurantService.getAllRestaurants();

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  }),
};
