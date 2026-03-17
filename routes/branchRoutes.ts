import { Router } from "express";
import { branchController } from "../controllers/branchController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requestSchemas } from "../validation/schemas.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.post(
  "/",
  protect,
  authorize("restaurant_owner"),
  validateRequest(requestSchemas.createBranch),
  branchController.createBranch,
);

router.get(
  "/:id",
  validateRequest(requestSchemas.idParam, "params"),
  branchController.getBranchById,
);

router.get(
  "/restaurant/:restaurantId",
  validateRequest(requestSchemas.restaurantIdParam, "params"),
  branchController.getBranchesByRestaurant,
);

export default router;
