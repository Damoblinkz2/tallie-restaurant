/**
 * Table controller — HTTP request handlers for table management.
 *
 * Routes table-related requests to the table service after validating
 * inputs at the controller level. Returns structured JSON responses.
 */
import { Request, Response } from "express";
import { tableService } from "../services/tableService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requestSchemas } from "../validation/schemas.js";
import { validateControllerInput } from "../utils/controllerValidation.js";

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
    const validatedBody = validateControllerInput<{
      branchId: string;
      tableNumber: number;
      capacity: number;
    }>(requestSchemas.addTable, req.body, res);

    if (!validatedBody) {
      return;
    }

    const { branchId, tableNumber, capacity } = validatedBody;

    const table = await tableService.addTable(
      branchId,
      tableNumber,
      capacity,
      (req as any).user?.id,
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
    const validatedParams = validateControllerInput<{ branchId: string }>(
      requestSchemas.branchIdParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const { branchId } = validatedParams;

    const tables = await tableService.getTablesByBranch(branchId);

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables,
    });
  }),
};
