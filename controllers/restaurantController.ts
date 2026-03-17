/**
 * Restaurant controller — HTTP request handlers for restaurant management.
 *
 * Each handler validates its inputs (at the controller level as a second
 * guard after route middleware), delegates to the restaurant service, and
 * returns a structured JSON response.
 */
import { Request, Response } from "express";
import { restaurantService } from "../services/restaurantService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requestSchemas } from "../validation/schemas.js";
import { validateControllerInput } from "../utils/controllerValidation.js";

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
    const validatedBody = validateControllerInput<{
      name: string;
    }>(requestSchemas.createRestaurant, req.body, res);

    if (!validatedBody) {
      return;
    }

    const { name } = validatedBody;
    const ownerId = (req as any).user?.id;

    const restaurant = await restaurantService.createRestaurant(name, ownerId);

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: restaurant,
    });
  }),

  // Get restaurant details with all its registered tables
  getRestaurantDetails: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ id: string }>(
      requestSchemas.idParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const { id } = validatedParams;

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
