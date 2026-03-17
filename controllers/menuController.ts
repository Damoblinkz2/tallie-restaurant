import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { menuService } from "../services/menuService.js";
import { requestSchemas } from "../validation/schemas.js";
import { validateControllerInput } from "../utils/controllerValidation.js";

export const menuController = {
  uploadBranchMenu: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ branchId: string }>(
      requestSchemas.branchIdParam,
      req.params,
      res,
    );

    const validatedBody = validateControllerInput<{
      menu: {
        itemId: string;
        name: string;
        description?: string;
        price: number;
        available: boolean;
      }[];
    }>(requestSchemas.uploadBranchMenu, req.body, res);

    if (!validatedParams || !validatedBody) {
      return;
    }

    const menu = await menuService.upsertBranchMenu(
      validatedParams.branchId,
      validatedBody.menu,
      (req as any).user?.id,
    );

    res.status(200).json({
      success: true,
      message: "Menu uploaded successfully",
      count: menu.length,
      data: menu,
    });
  }),

  getBranchMenu: asyncHandler(async (req: Request, res: Response) => {
    const validatedParams = validateControllerInput<{ branchId: string }>(
      requestSchemas.branchIdParam,
      req.params,
      res,
    );

    if (!validatedParams) {
      return;
    }

    const menu = await menuService.getBranchMenu(validatedParams.branchId);

    res.status(200).json({
      success: true,
      count: menu.length,
      data: menu,
    });
  }),
};
