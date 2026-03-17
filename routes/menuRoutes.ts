import { Router } from "express";
import { menuController } from "../controllers/menuController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requestSchemas } from "../validation/schemas.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.patch(
  "/branch/:branchId",
  protect,
  authorize("restaurant_owner"),
  validateRequest(requestSchemas.branchIdParam, "params"),
  validateRequest(requestSchemas.uploadBranchMenu),
  menuController.uploadBranchMenu,
);

router.get(
  "/branch/:branchId",
  validateRequest(requestSchemas.branchIdParam, "params"),
  menuController.getBranchMenu,
);

export default router;
