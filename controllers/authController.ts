import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authService } from "../services/authService.js";
import { requestSchemas } from "../validation/schemas.js";
import { validateControllerInput } from "../utils/controllerValidation.js";
import { UserRole } from "../types/index.js";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const validatedBody = validateControllerInput<{
      name: string;
      email: string;
      password: string;
      role: UserRole;
    }>(requestSchemas.registerUser, req.body, res);

    if (!validatedBody) {
      return;
    }

    const { name, email, password, role } = validatedBody;
    const result = await authService.register(name, email, password, role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const validatedBody = validateControllerInput<{
      email: string;
      password: string;
    }>(requestSchemas.loginUser, req.body, res);

    if (!validatedBody) {
      return;
    }

    const { email, password } = validatedBody;
    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: (req as any).user,
    });
  }),
};
