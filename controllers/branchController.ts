import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { branchService } from "../services/branchService.js";
import { requestSchemas } from "../validation/schemas.js";
import { validateControllerInput } from "../utils/controllerValidation.js";

export const branchController = {
  createBranch: asyncHandler(async (req: Request, res: Response) => {
    const validatedBody = validateControllerInput<{
      restaurantId: string;
      name: string;
      address: string;
      openingTime: string;
      closingTime: string;
      totalTables: number;
    }>(requestSchemas.createBranch, req.body, res);

    if (!validatedBody) {
      return;
    }

    const branch = await branchService.createBranch(
      validatedBody.restaurantId,
      validatedBody.name,
      validatedBody.address,
      validatedBody.openingTime,
      validatedBody.closingTime,
      validatedBody.totalTables,
      (req as any).user?.id,
    );

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  }),

  getBranchById: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ id: string }>(
      requestSchemas.idParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const branch = await branchService.getBranchById(validatedParams.id);

    res.status(200).json({
      success: true,
      data: branch,
    });
  }),

  getBranchesByRestaurant: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ restaurantId: string }>(
      requestSchemas.restaurantIdParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const branches = await branchService.getBranchesByRestaurant(
      validatedParams.restaurantId,
    );

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  }),
};
