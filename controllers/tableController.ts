import { Request, Response } from "express";
import { tableService } from "../services/tableService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const tableController = {
  /**
   * Adds a new table to an existing restaurant.
   * Validates table number and capacity, then creates the table record.
   *
   * @param req - Express request object containing table details in body
   * @param res - Express response object
   * @returns JSON response with success status and created table data
   */
  addTable: asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId, tableNumber, capacity } = req.body;

    // Validation
    if (!restaurantId || tableNumber === undefined || !capacity) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
        required: ["restaurantId", "tableNumber", "capacity"],
      });
      return;
    }

    if (tableNumber < 1) {
      res.status(400).json({
        success: false,
        message: "Table number must be at least 1",
      });
      return;
    }

    if (capacity < 1) {
      res.status(400).json({
        success: false,
        message: "Capacity must be at least 1",
      });
      return;
    }

    const table = await tableService.addTable(
      restaurantId,
      tableNumber,
      capacity
    );

    res.status(201).json({
      success: true,
      message: "Table added successfully",
      data: table,
    });
  }),

  /**
   * Retrieves all tables associated with a specific restaurant.
   * Returns table details including number, capacity, and availability status.
   *
   * @param req - Express request object with restaurantId in params
   * @param res - Express response object
   * @returns JSON response with success status, count, and array of tables
   */
  getTablesByRestaurant: asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId } = req.params;

    const tables = await tableService.getTablesByRestaurant(restaurantId);

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables,
    });
  }),
};
