import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requestSchemas } from "../validation/schemas.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post(
  "/register",
  validateRequest(requestSchemas.registerUser),
  authController.register,
);
router.post(
  "/login",
  validateRequest(requestSchemas.loginUser),
  authController.login,
);
router.get("/me", protect, authController.me);

export default router;
